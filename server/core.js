import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import matter from 'gray-matter';
import YAML from 'yaml';
import {marked} from 'marked';
import sanitizeHtml from 'sanitize-html';
import TurndownService from 'turndown';
import {pinyin} from 'pinyin-pro';
export const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
export function slugify(s){return pinyin(String(s),{toneType:'none',nonZh:'consecutive'}).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70)||'new-item';}
export function slug(s){if(!/^[a-z0-9][a-z0-9-]{0,99}$/.test(s))throw Error('网址名称只能使用小写英文字母、数字和短横线');return s;}
export function text(v,max=20000){if(typeof v!=='string'||v.length>max)throw Error('文字格式不正确或长度过长');return v;}
export const cleanHtml=s=>sanitizeHtml(s,{allowedTags:['p','br','h2','h3','h4','strong','em','s','del','ul','ol','li','blockquote','pre','code','a','img','hr'],allowedAttributes:{a:['href','title'],img:['src','alt','title'],code:['class']},allowedSchemes:['https','http','mailto'],allowProtocolRelative:false});
const td=new TurndownService({headingStyle:'atx',bulletListMarker:'-',codeBlockStyle:'fenced',emDelimiter:'*'});
td.addRule('strike',{filter:['s','del'],replacement:content=>'~~'+content+'~~'});
export function markdownFromHtml(html){const md=td.turndown(cleanHtml(text(html,500000)));if(/\{%|\{\{/.test(md))throw Error('正文不能加入模板指令');return md;}
export const htmlFromMarkdown=s=>cleanHtml(marked.parse(s));
export function asset(v){if(!/^\/assets\/(?:images|videos|covers)\/[a-zA-Z0-9._-]+$/.test(v))throw Error('素材路径无效，请使用图片选择器');return v;}
export function docParse(raw){if(!raw.startsWith('---\n'))throw Error('文档缺少资料头部');const end=raw.indexOf('\n---',4);if(end<0)throw Error('文档资料头部不完整');return{data:YAML.parse(raw.slice(4,end)),body:raw.slice(end+4).replace(/^\r?\n/,'')};}
export const docWrite=(data,body)=>'---\n'+YAML.stringify(data,{lineWidth:0})+'---\n'+body.trim()+'\n';
export async function readDoc(file){const raw=await fs.readFile(file,'utf8');return {...docParse(raw),revision:hash(raw)};}
export async function atomic(file,content){await fs.mkdir(path.dirname(file),{recursive:true});const temp=file+'.manager-'+crypto.randomUUID();await fs.writeFile(temp,content);await fs.rename(temp,file);}
export function safeFile(root,rel){if(typeof rel!=='string'||path.isAbsolute(rel)||rel.split(/[\\/]/).some(s=>s==='..'||s==='.git')||rel.includes('\0'))throw Error('文件位置无效');const resolved=path.resolve(root,rel);if(!resolved.startsWith(path.resolve(root)+path.sep))throw Error('文件超出范围');return resolved;}
export async function assertNoSymlink(root,rel){let cur=root;for(const part of rel.split('/')){cur=path.join(cur,part);try{if((await fs.lstat(cur)).isSymbolicLink())throw Error('不支持符号链接文件');}catch(e){if(e.code!=='ENOENT')throw e;}}}
export function validDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||new Date(s+'T12:00:00Z').toISOString().slice(0,10)!==s)throw Error('请选择有效日期');return s;}
export function externalUrl(s){if(!s)return '';let u;try{u=new URL(s);}catch{throw Error('请输入完整的 https:// 链接');}if(!['https:','http:'].includes(u.protocol)||u.username||u.password)throw Error('链接只支持 http 或 https');return s;}
export function profileFromAbout(doc){const b=doc.body;function section(title,next){return b.split('### '+title+'\n')[1]?.split('\n### ')[0].trim()||'';}function timeline(s){return [...s.matchAll(/\*\*(.*?)\*\*\s*<span class="timeline-date">(.*?)<\/span>\s*\n\s*([\s\S]*?)(?=\n\s*\*\*|$)/g)].map(m=>({title:m[1],date:m[2],detail:m[3].trim()}));}return {eyebrow:b.match(/class="eyebrow">(.*?)<\/p>/)?.[1]||"ABOUT ME",heading:b.match(/^## (.*)$/m)?.[1]||'关于我',intro:b.split(/^## .*\n/m)[1]?.split('\n### ')[0].trim()||'',work:timeline(section('工作经历')),education:timeline(section('教育经历')),skills:section('研究与技能'),interests:section('工作之外')};}
