const {Pool} = require('pg');
const crypto = require('node:crypto');
let pool;
let schemaReady;
function db(){
 if(!process.env.DATABASE_URL) throw Object.assign(new Error('DATABASE_URL is not configured'),{status:503});
 if(!pool) pool=new Pool({connectionString:process.env.DATABASE_URL,max:3,connectionTimeoutMillis:5000,ssl:process.env.PG_SSL==='true'?{rejectUnauthorized:true}:undefined});
 return pool;
}
const send=(res,status,data)=>res.status(status).json(data);
const clean=(v,max)=>typeof v==='string'?v.trim().slice(0,max):'';
function admin(req){
 const secret=process.env.ADMIN_TOKEN;
 if(!secret || secret==='admin' || secret.length<24)throw Object.assign(new Error('ADMIN_TOKEN must be set to a strong secret'),{status:503});
 const supplied=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
 const a=Buffer.from(supplied),b=Buffer.from(secret);
 if(a.length!==b.length||!crypto.timingSafeEqual(a,b))throw Object.assign(new Error('Unauthorized'),{status:403});
}
async function ready(){
 const connection=db();
 if(!schemaReady) schemaReady=connection.query(`CREATE TABLE IF NOT EXISTS inquiries (id TEXT PRIMARY KEY,client_id TEXT UNIQUE NOT NULL,name TEXT NOT NULL,email TEXT NOT NULL,company TEXT NOT NULL DEFAULT '',service TEXT NOT NULL DEFAULT '',message TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'new',created_at TEXT NOT NULL)`).catch(e=>{schemaReady=undefined;throw e});
 await schemaReady;
 return connection;
}
module.exports=async (req,res)=>{
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 try{
  const path=new URL(req.url,'https://localhost').pathname.replace(/^\/api(?:\/index)?(?=\/|$)/,'')||'/';
  if(path==='/health'&&req.method==='GET'){
   if(!process.env.DATABASE_URL)return send(res,503,{ok:false,database:'not configured'});
   await (await ready()).query('SELECT 1');return send(res,200,{ok:true,database:'postgres',time:new Date().toISOString()});
  }
  if(path==='/inquiries'&&req.method==='POST'){
   const b=req.body||{};
   const name=clean(b.name,120),email=clean(b.email,254),company=clean(b.company,150),service=clean(b.service,150),message=clean(b.message,5000),clientId=clean(b.clientId,100)||crypto.randomUUID();
   if(name.length<2||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||message.length<10||!/^[a-zA-Z0-9-]{8,100}$/.test(clientId))return send(res,400,{message:'Invalid inquiry data'});
   const conn=await ready();
   await conn.query('INSERT INTO inquiries (id,client_id,name,email,company,service,message,status,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (client_id) DO NOTHING',[crypto.randomUUID(),clientId,name,email,company,service,message,'new',new Date().toISOString()]);
   return send(res,200,{ok:true,clientId});
  }
  if(path.startsWith('/admin/')){
   admin(req);const conn=await ready();
   if(path==='/admin/inquiries'&&req.method==='GET'){
    const r=await conn.query('SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 1000');return send(res,200,{items:r.rows});
   }
   const match=path.match(/^\/admin\/inquiries\/([0-9a-f-]{36})$/i);
   if(match&&req.method==='PATCH'){
    if(!['new','in_progress','closed'].includes(req.body?.status))return send(res,400,{message:'Invalid status'});
    const r=await conn.query('UPDATE inquiries SET status=$1 WHERE id=$2',[req.body.status,match[1]]);
    return send(res,r.rowCount?200:404,r.rowCount?{ok:true}:{message:'Not found'});
   }
   if(match&&req.method==='DELETE'){
    const r=await conn.query('DELETE FROM inquiries WHERE id=$1',[match[1]]);
    return send(res,r.rowCount?200:404,r.rowCount?{ok:true}:{message:'Not found'});
   }
  }
  return send(res,404,{message:'API endpoint not found'});
 }catch(e){console.error('API error:',e);return send(res,e.status||500,{message:e.status?e.message:'Server error'});}
};
