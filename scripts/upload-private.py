#!/usr/bin/env python3
"""Private build source transfer over GitHub API when Git transport is unavailable.
Only tracked files from this independent repository are sent. No installer or user project is uploaded.
"""
import subprocess,json,base64,tempfile,os,concurrent.futures,pathlib,hashlib
ROOT=pathlib.Path(__file__).resolve().parent.parent
REPO=os.environ.get('PRIVATE_BUILD_REPO', '')
if not REPO or REPO.count('/') != 1:raise SystemExit('PRIVATE_BUILD_REPO must name the existing private build repository')
GH=os.environ.get('BUILD_GH','gh')
def api(endpoint,body=None,method=None):
 command=[GH,'api',endpoint]
 if method:command+=['--method',method]
 name=None
 if body is not None:
  with tempfile.NamedTemporaryFile(mode='w',suffix='.json',delete=False) as f:json.dump(body,f);name=f.name
  command+=['--input',name]
 try:return json.loads(subprocess.check_output(command,cwd=ROOT,stderr=subprocess.PIPE))
 except subprocess.CalledProcessError as e:
  print('Private build API request failed; no response body printed.');raise SystemExit(1)
 finally:
  if name:os.unlink(name)
meta=api('repos/'+REPO)
if not meta['private']:raise SystemExit('Refuse non-private destination')
try:base=api('repos/'+REPO+'/git/ref/heads/main')['object']['sha']
except subprocess.CalledProcessError as e:
 if b'404' not in e.stderr and b'409' not in e.stderr:raise
 data=(ROOT/'README.md').read_bytes()
 init=api('repos/'+REPO+'/contents/README.md',{'message':'Initialize private build repository','content':base64.b64encode(data).decode(),'branch':'main'},'PUT')
 base=init['commit']['sha']
base_commit=api('repos/'+REPO+'/git/commits/'+base)
oldtree=api('repos/'+REPO+'/git/trees/'+base_commit['tree']['sha']+'?recursive=1')
old={item['path']:item.get('sha') for item in oldtree['tree'] if item['type']=='blob'}
files=subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard','-z'],cwd=ROOT).decode().split('\0')
files=list(dict.fromkeys(f for f in files if f and (f.split('/')[0] in ['src','server','desktop','scripts','template','docs','LICENSES','.github'] or f in ['LICENSE','NOTICE','CHANGELOG.md','package.json','package-lock.json','README.md','AGENTS.md','electron-builder.yml','index.html','.gitignore','.gitattributes'])))
def element(file):
 data=(ROOT/file).read_bytes(); mode='100755' if os.access(ROOT/file,os.X_OK) else '100644'
 blobsha=hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
 if old.get(file)==blobsha:return {'path':file,'mode':mode,'type':'blob','sha':blobsha}
 try:content=data.decode('utf8')
 except UnicodeDecodeError:content=None
 if content is None or len(data)>500000:
  blob=api('repos/'+REPO+'/git/blobs',{'content':base64.b64encode(data).decode(),'encoding':'base64'})
  return {'path':file,'mode':mode,'type':'blob','sha':blob['sha']}
 return {'path':file,'mode':mode,'type':'blob','content':content}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:elements=list(pool.map(element,[f for f in files if f]))
tree=api('repos/'+REPO+'/git/trees',{'tree':elements})
commit=api('repos/'+REPO+'/git/commits',{'message':'Build isolated Apple Silicon manager test edition','tree':tree['sha'],'parents':[base],'author':{'name':'Website Manager Contributors','email':'maintainer@example.invalid'}})
# Never force: fail if remote changed since it was inspected.
api('repos/'+REPO+'/git/refs/heads/main',{'sha':commit['sha'],'force':False},'PATCH')
print('Private build source uploaded:',commit['sha'])
