#!/usr/bin/env python3
"""Retrieve exact corresponding sources/patches for the pinned prebuilt libraries.
No credentials are required. Every file is checked before being included.
"""
from pathlib import Path
import base64,concurrent.futures,hashlib,json,time,urllib.request,os
ROOT=Path(__file__).resolve().parent.parent
DEST=ROOT/'downloads/redistribution'
entries=json.loads((ROOT/'scripts/third-party-sources.json').read_text())
def collect(item):
 name=Path(item['file'])
 if name.is_absolute() or '..' in name.parts:raise RuntimeError('Invalid source file path')
 target=DEST/name;target.parent.mkdir(parents=True,exist_ok=True)
 if target.exists() and hashlib.sha256(target.read_bytes()).hexdigest()==item['sha256']:return
 for attempt in range(4):
  try:
   with urllib.request.urlopen(item['url'],timeout=120) as response:data=response.read()
   if item.get('transform')=='base64':data=base64.b64decode(data)
   if hashlib.sha256(data).hexdigest()!=item['sha256']:raise RuntimeError('Source checksum mismatch: '+str(name))
   temp=target.with_name(target.name+'.part');temp.write_bytes(data);os.replace(temp,target);return
  except Exception:
   if attempt==3:raise RuntimeError('Could not retrieve verified source: '+str(name)) from None
   time.sleep(2)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:list(pool.map(collect,entries))
print('Verified',len(entries),'pinned corresponding source files')
