import Database from 'better-sqlite3';
import {Pool} from 'pg';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
export type Inquiry={id:string;client_id:string;name:string;email:string;company:string;service:string;message:string;status:string;created_at:string};
const schema=`CREATE TABLE IF NOT EXISTS inquiries(id TEXT PRIMARY KEY,client_id TEXT NOT NULL UNIQUE,name TEXT NOT NULL,email TEXT NOT NULL,company TEXT NOT NULL DEFAULT '',service TEXT NOT NULL DEFAULT '',message TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'new',created_at TEXT NOT NULL);`;
export class Store{
 sqlite?:Database.Database;pg?:Pool;mode:'sqlite'|'postgres';
 constructor(){this.mode=process.env.DATABASE_URL?'postgres':'sqlite'}
 async init(){
  if(this.mode==='postgres'){
   this.pg=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.PG_SSL==='true'?{rejectUnauthorized:true}:undefined});
   await this.pg.query(`CREATE TABLE IF NOT EXISTS inquiries(id TEXT PRIMARY KEY,client_id TEXT UNIQUE NOT NULL,name TEXT NOT NULL,email TEXT NOT NULL,company TEXT NOT NULL DEFAULT '',service TEXT NOT NULL DEFAULT '',message TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'new',created_at TEXT NOT NULL);`);
   // Optional vector extension: deployed PostgreSQL must have pgvector installed.
   try{await this.pg.query('CREATE EXTENSION IF NOT EXISTS vector');await this.pg.query('CREATE TABLE IF NOT EXISTS knowledge_vectors(id TEXT PRIMARY KEY,content TEXT NOT NULL,embedding vector(1536))')}catch(e){console.warn('pgvector unavailable. Install the vector extension to enable embeddings:',(e as Error).message)}
  }else{
   const dbPath=process.env.SQLITE_PATH||path.resolve(process.cwd(),'data/arrita.sqlite');fs.mkdirSync(path.dirname(dbPath),{recursive:true});
   this.sqlite=new Database(dbPath);this.sqlite.pragma('journal_mode = WAL');this.sqlite.exec(schema);
  }
 }
 async create(input:Omit<Inquiry,'id'|'status'|'created_at'>){
  const item:Inquiry={...input,id:crypto.randomUUID(),status:'new',created_at:new Date().toISOString()};
  if(this.pg){await this.pg.query('INSERT INTO inquiries (id,client_id,name,email,company,service,message,status,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (client_id) DO NOTHING',[item.id,item.client_id,item.name,item.email,item.company,item.service,item.message,item.status,item.created_at])}
  else this.sqlite!.prepare('INSERT OR IGNORE INTO inquiries (id,client_id,name,email,company,service,message,status,created_at) VALUES (@id,@client_id,@name,@email,@company,@service,@message,@status,@created_at)').run(item);
  return {ok:true,clientId:item.client_id};
 }
 async list():Promise<Inquiry[]>{if(this.pg)return(await this.pg.query('SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 1000')).rows;return this.sqlite!.prepare('SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 1000').all() as Inquiry[]}
 async update(id:string,status:string){if(this.pg)return(await this.pg.query('UPDATE inquiries SET status=$1 WHERE id=$2',[status,id])).rowCount||0;return this.sqlite!.prepare('UPDATE inquiries SET status=? WHERE id=?').run(status,id).changes}
 async remove(id:string){if(this.pg)return(await this.pg.query('DELETE FROM inquiries WHERE id=$1',[id])).rowCount||0;return this.sqlite!.prepare('DELETE FROM inquiries WHERE id=?').run(id).changes}
 async close(){await this.pg?.end();this.sqlite?.close()}
}
