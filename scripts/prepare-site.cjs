/* One public-file manifest shared by browser QA and GitHub Pages. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const files=['index.html','studio.html','reading-archive.html','editorial-style-guide.html','bookshelf.json','substack-posts.json','message-received.html',...fs.readdirSync(root).filter(p=>/\.(css|js)$/.test(p))];
function prepare(destination='_site'){
 const out=path.resolve(root,destination);
 if(out===root||!out.startsWith(root+path.sep))throw Error('Output must be inside the repository');
 fs.mkdirSync(out,{recursive:true});
 for(const file of files)fs.copyFileSync(path.join(root,file),path.join(out,file));
 for(const dir of ['assets','articles'])fs.cpSync(path.join(root,dir),path.join(out,dir),{recursive:true});
 fs.mkdirSync(path.join(out,'data'),{recursive:true});
 fs.copyFileSync(path.join(root,'data/science-cabinet.json'),path.join(out,'data/science-cabinet.json'));
 fs.writeFileSync(path.join(out,'.nojekyll'),'');
 return out;
}
module.exports={prepare};
if(require.main===module)prepare(process.argv[2]);
