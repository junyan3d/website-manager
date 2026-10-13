const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
function projectKey(actual){return crypto.createHash('sha256').update(actual).digest('hex');}
async function inspectProject(folder,forbiddenRoot){const actual=await fs.realpath(folder);if(forbiddenRoot){const protectedPath=await fs.realpath(forbiddenRoot);if(actual===protectedPath||actual.startsWith(protectedPath+path.sep))throw Error('网站资料必须放在应用之外，请选择文稿或其他可写文件夹');}for(const f of ['_config.yml','Gemfile','_projects','_posts','_layouts'])await fs.access(path.join(actual,f));await fs.access(actual,2);return actual;}
module.exports={inspectProject,projectKey};
