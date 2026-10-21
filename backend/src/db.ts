import {Pool} from 'pg';
import crypto from 'node:crypto';
export type Inquiry={id:string;client_id:string;name:string;email:string;company:string;service:string;message:string;status:string;created_at:string};
export class Store{
 memory=new Map<string,Inquiry>();pg?:Pool;mode:'sqlite'|'postgres';
 constructor(){this.mode=process.env.DATABASE_URL?'postgres':'sqlite'}
 async init(){
  if(this.mode==='postgres'){
   try{
    this.pg=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.PG_SSL==='true'?{rejectUnauthorized:true}:undefined});
    await this.pg.query(`CREATE TABLE IF NOT EXISTS inquiries(id TEXT PRIMARY KEY,client_id TEXT UNIQUE NOT NULL,name TEXT NOT NULL,email TEXT NOT NULL,company TEXT NOT NULL DEFAULT '',service TEXT NOT NULL DEFAULT '',message TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'new',created_at TEXT NOT NULL);`);
    try{await this.pg.query('CREATE EXTENSION IF NOT EXISTS vector');await this.pg.query('CREATE TABLE IF NOT EXISTS knowledge_vectors(id TEXT PRIMARY KEY,content TEXT NOT NULL,embedding vector(1536))')}catch(e){console.warn('pgvector unavailable. Install the vector extension to enable embeddings:',(e as Error).message)}
   }catch(e){
    console.warn('[AI Studio] PostgreSQL not connected — falling back to in-memory mock:',(e as Error).message);
    this.pg=undefined;
    this.mode='sqlite';
   }
  }
 }
 async create(input:Omit<Inquiry,'id'|'status'|'created_at'>){
  const item:Inquiry={...input,id:crypto.randomUUID(),status:'new',created_at:new Date().toISOString()};
  if(this.pg){await this.pg.query('INSERT INTO inquiries (id,client_id,name,email,company,service,message,status,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (client_id) DO NOTHING',[item.id,item.client_id,item.name,item.email,item.company,item.service,item.message,item.status,item.created_at])}
  else{
   const exists=Array.from(this.memory.values()).some(x=>x.client_id===item.client_id);
   if(!exists)this.memory.set(item.id,item);
  }
  return {ok:true,clientId:item.client_id};
 }
 async list():Promise<Inquiry[]>{
  if(this.pg)return(await this.pg.query('SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 1000')).rows;
  return Array.from(this.memory.values()).sort((a,b)=>b.created_at.localeCompare(a.created_at)).slice(0,1000);
 }
 async update(id:string,status:string){
  if(this.pg)return(await this.pg.query('UPDATE inquiries SET status=$1 WHERE id=$2',[status,id])).rowCount||0;
  const item=this.memory.get(id);
  if(!item)return 0;
  this.memory.set(id,{...item,status});
  return 1;
 }
 async remove(id:string){
  if(this.pg)return(await this.pg.query('DELETE FROM inquiries WHERE id=$1',[id])).rowCount||0;
  return this.memory.delete(id)?1:0;
 }
 async close(){await this.pg?.end();this.memory.clear()}
}
