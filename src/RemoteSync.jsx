import React,{useState} from 'react';
function Preview({row,side}){const url=row.media?.[side];return <>{url&&(row.media.kind==='video'?<video className="compare-img" src={url} controls preload="metadata"/>:<img className="compare-img" src={url} alt={side==='local'?'本地素材':'远端素材'}/>)}<pre>{row[side]??'文件已删除 / 不存在'}</pre></>;}
export default function RemoteSync({run,busy,refresh}) {
 const [plan,setPlan]=useState(null),[choices,setChoices]=useState({}),[edits,setEdits]=useState({}),[message,setMessage]=useState(''),[connection,setConnection]=useState(''),[repository,setRepository]=useState(''),[rechecked,setRechecked]=useState(false);
 async function check(afterReconnect=false){setPlan(null);setMessage('');const p=await run('remote-check',{});if(p){setPlan(p);setChoices({});setEdits({});setMessage(p.message);setRechecked(afterReconnect);if(p.needsReconnect&&!afterReconnect){setConnection('');setRepository(p.target?.repo?.split('/').pop()||'');}}}
 const conflicts=plan?.rows.filter(r=>r.conflict)||[];
 return <section className="publish-note remote-sync"><h2>检查远端更新</h2><p>GitHub 上的内容有变化时，先对比并同步到本地。检查不会覆盖内容；确认同步前会保留本地备份。</p>
 <button disabled={busy} onClick={()=>check()}>检查远端更新</button>
 {message&&<p role="status">{message}</p>}
 {plan?.needsReconnect&&<div className="reconnect-panel" role="region" aria-label="重新建立 GitHub 授权连接"><h3>重新建立 GitHub 授权连接</h3><p>① 在浏览器重新授权自己的 GitHub 账号 → ② 核对并确认网站仓库 → ③ 再次检查远端更新。</p><p className="hint">这个流程不会删除本地文件、重置提交或强制覆盖 GitHub 仓库。</p>
 <button disabled={busy} onClick={async()=>{setConnection('');setRechecked(false);const r=await run('github-login',{});if(r){setRepository(r.repository||'');setConnection('authorized');setMessage('授权完成。请确认网站仓库属于刚登录的账号，然后继续。');}}}>① 重新授权 GitHub</button>
 <label>网站仓库名称<input disabled={busy||!connection} placeholder="你的账号.github.io" value={repository} onChange={e=>{setRepository(e.target.value);setConnection('authorized');}}/></label>
 <button disabled={busy||!connection||!repository.trim()} onClick={async()=>{if(!confirm('确认重新连接网站仓库「'+repository+'」？只确认连接，不发布内容。若项目已经关联其他仓库，将停止操作。'))return;const r=await run('publication',{name:repository.trim(),create:false,confirm:true});if(r){setConnection('confirmed');setRechecked(false);setMessage('仓库连接已确认。请再次检查远端更新。');await refresh();}}}>② 重新确认仓库连接</button>
 <button disabled={busy||connection!=='confirmed'} onClick={()=>check(true)}>③ 再次检查远端更新</button>
 {rechecked&&<p className="notice error" role="alert">授权和仓库确认后，提交历史仍不一致。这属于内容版本问题，不能靠重新登录解决。本地内容已保留，请先备份项目，再合并提交历史；不要反复授权或强制覆盖仓库。</p>}
 </div>}

 {!!plan?.rows.length&&<><p>共 {plan.rows.length} 个文件更新，{conflicts.length} 个冲突需要选择。关闭或离开页面会取消本次对比。</p>{plan.rows.map(r=><details key={r.file} open={r.conflict}><summary>{r.conflict?'需要处理冲突':'可以合并'} · {r.file}</summary><div className="compare-columns"><div><small>本地内容</small><Preview row={r} side="local"/></div><div><small>远端内容</small><Preview row={r} side="remote"/></div></div>{r.conflict?<><label>处理方式<select disabled={busy} value={choices[r.file]||''} onChange={e=>{setChoices({...choices,[r.file]:e.target.value});if(e.target.value==='edit'&&!Object.hasOwn(edits,r.file))setEdits({...edits,[r.file]:r.local||r.remote||''});}}><option value="">请选择</option><option value="local">保留本地（随后可重新发布）</option><option value="remote">采用远端（替换此文件的本地内容）</option>{!r.binary&&<option value="edit">手动编辑合并内容</option>}</select></label>{choices[r.file]==='edit'&&<label>合并后的完整文件内容<textarea rows={12} disabled={busy} value={edits[r.file]??''} onChange={e=>setEdits({...edits,[r.file]:e.target.value})}/></label>}</>:r.merged!==null&&<details><summary>同步后的内容</summary><pre>{r.merged}</pre></details>}</details>)}
 <button className="primary" disabled={busy||conflicts.some(r=>!choices[r.file])} onClick={async()=>{if(!confirm('确认按以上选择同步到本地？采用远端会替换对应文件；同步前保留备份，不会上传。'))return;const result=await run('remote-sync',{id:plan.id,confirm:true,choices,edits});if(result){setPlan(null);setMessage(result.message);await refresh();}}}>确认同步到本地</button><button disabled={busy} onClick={()=>{setPlan(null);setMessage('已取消对比，本地内容未因本次对比而改变');}}>取消对比</button><p className="hint">同步后先打开「本地预览」，确认正确后再发布。图片、视频冲突可选择本地或远端；文字可手动合并。备份位于应用私有数据目录。</p></>}
 </section>;
}
