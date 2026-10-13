import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFile} from 'node:child_process';
import {safeFile,assertNoSymlink,atomic} from './core.js';
const digest=v=>crypto.createHash('sha256').update(v).digest('hex');
const equal=(a,b)=>a===null?b===null:b!==null&&a.equals(b);
const text=b=>b!==null&&!b.includes(0)&&Buffer.from(b.toString('utf8')).equals(b)&&b.length<500000;
export function createRemoteSync({site,state,gitFile,network,verify}) {
 const run=(args,options={})=>new Promise((resolve,reject)=>execFile(gitFile,args,{cwd:site,env:process.env,encoding:'buffer',maxBuffer:120*1024*1024,...options},(e,out)=>e?reject(e):resolve(out)));
 const git=async args=>(await run(args)).toString('utf8').trim();
 let plan;
 const read=async file=>{await assertNoSymlink(site,file);try{const stat=await fs.lstat(safeFile(site,file));if(!stat.isFile())throw Error('同步文件位置被目录占用，请先处理：'+file);return await fs.readFile(safeFile(site,file));}catch(e){if(e.code==='ENOENT')return null;throw e;}};
 const blob=async(ref,file)=>{const entry=await run(['ls-tree','-z',ref,'--',file]);return entry.length?run(['show',ref+':'+file]):null;};
 async function check(j) {
  plan=null;const target=await verify();
  if(await git(['branch','--show-current'])!=='main')throw Error('请切换到 main 分支后检查更新');
  if(await git(['diff','--cached','--name-only']))throw Error('存在已暂存修改，请先处理后再同步');
  if(await git(['ls-files','-u']))throw Error('项目有尚未解决的 Git 冲突，请先处理');
  const head=await git(['rev-parse','HEAD']);
  const refs=await network(['ls-remote','origin','refs/heads/main'],j);
  if(!refs.trim())return {rows:[],message:'远端尚无 main 分支，可以继续首次发布'};
  await network(['fetch','origin','main'],j);
  const remote=await git(['rev-parse','FETCH_HEAD']);
  if(head===remote)return {rows:[],message:'本地版本已包含最新远端更新'};
  try{await git(['merge-base','--is-ancestor',head,remote]);}catch{return {rows:[],needsReconnect:true,reason:'history-diverged',target,message:'当前项目与 GitHub 仓库的版本记录不一致。请先重新授权 GitHub，并重新确认你的账号与网站仓库。重新授权不会合并提交历史；如果连接确认后仍不一致，将保留本地内容并停止同步。'};}
  const files=(await run(['diff','--name-only','-z',head,remote])).toString().split('\0').filter(Boolean);
  const modes=new Map((await run(['ls-tree','-r','-z',remote])).toString().split('\0').filter(Boolean).map(s=>{const [info,file]=s.split('\t');return [file,info.split(' ')[0]];}));
  const rows=[];
  for(const file of files){
   safeFile(site,file);
   if(/[\t\r\n\\]/.test(file))throw Error('远端文件名含不支持的字符，请先处理');
   if(file.split('/').some(p=>p.startsWith('.')&&p!=='.github')||/^(?:node_modules|vendor|_site|logs|backups|originals|trash)(?:\/|$)/.test(file))throw Error('远端包含需人工检查的文件，已停止同步：'+file);
   const mode=modes.get(file);if(mode&&!['100644','100755'].includes(mode))throw Error('远端包含符号链接或子模块，已停止同步：'+file);
   const base=await blob(head,file),local=await read(file),online=await blob(remote,file);
   let result=online,conflict=false;
   if(equal(local,base)||equal(local,online))result=online;
   else if(equal(online,base))result=local;
   else if([base,local,online].every(text)){
    const temp=await fs.mkdtemp(path.join(state,'sync-merge-'));try{
     for(const [name,data] of [['local',local],['base',base],['remote',online]])await fs.writeFile(path.join(temp,name),data);
     try{result=await run(['merge-file','-p',path.join(temp,'local'),path.join(temp,'base'),path.join(temp,'remote')]);}catch(e){if(e.code!==1)throw e;result=null;conflict=true;}
    }finally{await fs.rm(temp,{recursive:true,force:true});}
   }else {conflict=true;result=null;}
   rows.push({file,base,local,online,result,conflict,mode:mode||'100644'});
  }
  const id=crypto.randomUUID();plan={id,head,remote,rows};
  return {id,rows:rows.map(r=>({file:r.file,conflict:r.conflict,binary:![r.local,r.online].filter(x=>x!==null).every(text),media:/^assets\/(?:images|videos|covers)\/.*\.(?:png|jpg|jpeg|webp|mp4)$/.test(r.file)?{kind:r.file.endsWith('.mp4')?'video':'image',local:r.local===null?null:'/api/remote-media?id='+id+'&side=local&file='+encodeURIComponent(r.file),remote:r.online===null?null:'/api/remote-media?id='+id+'&side=remote&file='+encodeURIComponent(r.file)}:null,local:r.local===null?null:text(r.local)?r.local.toString():`素材文件（${r.local.length} 字节）`,remote:r.online===null?null:text(r.online)?r.online.toString():`素材文件（${r.online.length} 字节）`,merged:r.result!==null&&text(r.result)?r.result.toString():null})),message:'检查完成，请比较更新并处理冲突。尚未修改网站内容'};
 }
 async function apply({id,choices={},edits={},confirm},j) {
  if(confirm!==true||!plan||id!==plan.id)throw Error('请重新检查远端更新并确认同步');
  const p=plan;await verify();
  if(await git(['branch','--show-current'])!=='main')throw Error('当前分支已变化，请切回 main 并重新检查');
  if(await git(['rev-parse','HEAD'])!==p.head||await git(['diff','--cached','--name-only']))throw Error('本地版本已变化，请重新检查更新');
  const refs=await network(['ls-remote','origin','refs/heads/main'],j);
  if(refs.trim().split(/\s/)[0]!==p.remote)throw Error('远端又有新更新，请重新检查');
  const writes=[];
  for(const r of p.rows){if(!equal(await read(r.file),r.local))throw Error('本地内容已变化，请重新检查：'+r.file);
   let data=r.result;
   if(r.conflict){const choice=choices[r.file];if(choice==='local')data=r.local;else if(choice==='remote')data=r.online;else if(choice==='edit'&&[r.local,r.online].filter(x=>x!==null).every(text)&&typeof edits[r.file]==='string')data=Buffer.from(edits[r.file]);else throw Error('请为每个冲突选择处理方式：'+r.file);}
   writes.push({...r,data});
  }
  const dir=path.join(state,'backups','sync-'+Date.now()+'-'+p.id);await fs.mkdir(dir,{recursive:true});
  const indexPath=path.resolve(site,await git(['rev-parse','--git-path','index']));const index=await fs.readFile(indexPath);
  await fs.writeFile(path.join(dir,'index'),index);
  await fs.writeFile(path.join(dir,'record.json'),JSON.stringify({head:p.head,remote:p.remote,files:writes.map(r=>({file:r.file,existed:r.local!==null,hash:r.local===null?null:digest(r.local)}))},null,2));
  for(const r of writes)if(r.local!==null)await atomic(safeFile(path.join(dir,'files'),r.file),r.local);
  // Keep uncommitted local edits as uncommitted edits against the new remote baseline.
  const changed=[];let moved=false;
  try{
   for(const r of writes){await assertNoSymlink(site,r.file);changed.push({...r,oldMode:r.local===null?null:(await fs.stat(safeFile(site,r.file))).mode});if(r.data===null)await fs.rm(safeFile(site,r.file),{force:true});else{await atomic(safeFile(site,r.file),r.data);await fs.chmod(safeFile(site,r.file),r.mode==='100755'?0o755:0o644);}}
   await git(['read-tree',p.remote]);await git(['update-ref','refs/heads/main',p.remote,p.head]);moved=true;plan=null;
  }catch(e){if(moved)await git(['update-ref','refs/heads/main',p.head,p.remote]);await fs.writeFile(indexPath,index);for(const r of changed.reverse()){if(r.local===null)await fs.rm(safeFile(site,r.file),{force:true});else{await atomic(safeFile(site,r.file),r.local);await fs.chmod(safeFile(site,r.file),r.oldMode);}}throw e;}
  return {files:writes.map(r=>r.file),message:'已同步到本地并保留备份。请检查本地预览，再确认发布；同步不会上传内容'};
 }
 return {check,apply,media:({id,file,side})=>{if(!plan||id!==plan.id||!['local','remote'].includes(side))throw Error('对比已过期，请重新检查更新');const row=plan.rows.find(r=>r.file===file);if(!row||!/^assets\/(?:images|videos|covers)\/.*\.(?:png|jpg|jpeg|webp|mp4)$/.test(file))throw Error('素材无效');return side==='local'?row.local:row.online;}};
}
