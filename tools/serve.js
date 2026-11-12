// Production-like static server for local testing: clean URLs, 404 page, same security headers/CSP as the server configs.
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(process.argv[2]||'.'),port=+process.argv[3]||8802;
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.pdf':'application/pdf','.xml':'application/xml','.txt':'text/plain; charset=utf-8','.webmanifest':'application/manifest+json'};
const CSP="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; frame-src https://www.google.com https://maps.google.com; connect-src 'self' https:; base-uri 'self'; form-action 'self' https://wa.me; object-src 'none'; frame-ancestors 'self'";
http.createServer((q,r)=>{
  let p=decodeURIComponent(q.url.split('?')[0]);
  let f=path.join(root,p);
  if(!f.startsWith(root)){r.writeHead(403);return r.end()}
  if(fs.existsSync(f)&&fs.statSync(f).isDirectory()){
    if(!p.endsWith('/')){r.writeHead(301,{Location:p+'/'});return r.end()}
    f=path.join(f,'index.html');
  }
  const h={'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Content-Security-Policy':CSP};
  if(!fs.existsSync(f)){const nf=fs.readFileSync(path.join(root,'404.html'));r.writeHead(404,{...h,'Content-Type':mime['.html']});return r.end(nf)}
  const ext=path.extname(f);h['Content-Type']=mime[ext]||'application/octet-stream';
  h['Cache-Control']=p.startsWith('/assets/')&&!p.endsWith('config.js')?'public,max-age=31536000,immutable':'no-cache';
  r.writeHead(200,h);fs.createReadStream(f).pipe(r);
}).listen(port,()=>console.log('serving',root,'on',port));
