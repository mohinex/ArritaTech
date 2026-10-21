import 'reflect-metadata';
import 'dotenv/config';
import {Module,Controller,Get,Post,Patch,Delete,Body,Param,Headers,ForbiddenException,BadRequestException,NotFoundException,Injectable,OnModuleDestroy} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import {Store} from './db';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import express from 'express';
@Injectable()class DbService extends Store implements OnModuleDestroy{onModuleDestroy(){return this.close()}}
const text=(x:unknown,max:number)=>typeof x==='string'?x.trim().slice(0,max):'';
function validate(raw:any){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new BadRequestException('Invalid JSON input');
 const name=text(raw.name,120),email=text(raw.email,254),company=text(raw.company,150),service=text(raw.service,150),message=text(raw.message,5000),client_id=text(raw.clientId,100)||crypto.randomUUID();
 if(name.length<2||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||message.length<10||! /^[a-zA-Z0-9-]{8,100}$/.test(client_id))throw new BadRequestException('Name, valid email and message (10+ characters) required');
 return {name,email,company,service,message,client_id};
}
function verify(token:string|undefined){const required=process.env.ADMIN_TOKEN;if(!required)throw new ForbiddenException('Set ADMIN_TOKEN in backend environment');const supplied=token?.replace(/^Bearer\s+/i,'')||'';const a=Buffer.from(supplied),b=Buffer.from(required);if(a.length!==b.length||!crypto.timingSafeEqual(a,b))throw new ForbiddenException('Invalid admin token')}
@Controller('api')class ApiController{
 constructor(private db:DbService){}
 @Get('health')health(){return {ok:true,database:this.db.mode,time:new Date().toISOString()}}
 @Post('inquiries')create(@Body()input:any){return this.db.create(validate(input))}
 @Get('admin/inquiries')async list(@Headers('authorization')authorization?:string){verify(authorization);return{items:await this.db.list()}}
 @Patch('admin/inquiries/:id')async update(@Headers('authorization')authorization:string,@Param('id')id:string,@Body()body:any){verify(authorization);if(!['new','in_progress','closed'].includes(body?.status))throw new BadRequestException('Invalid status');if(!await this.db.update(id,body.status))throw new NotFoundException();return{ok:true}}
 @Delete('admin/inquiries/:id')async remove(@Headers('authorization')authorization:string,@Param('id')id:string){verify(authorization);if(!await this.db.remove(id))throw new NotFoundException();return{ok:true}}
}
@Module({controllers:[ApiController],providers:[DbService]})class AppModule{}
export async function startServer(){
 const app=await NestFactory.create(AppModule,{cors:process.env.WEB_ORIGIN?{origin:process.env.WEB_ORIGIN}:false,bodyParser:true});
 app.use(express.json({limit:'32kb'}));
 const store=app.get(DbService);await store.init();
 app.use((_req:any,res:any,next:any)=>{res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');next()});
 const site=process.env.FRONTEND_DIST||path.resolve(__dirname,'../../frontend/dist');
 if(fs.existsSync(path.join(site,'index.html'))){app.use(express.static(site));app.use((req:any,res:any,next:any)=>{if(req.method==='GET'&&!req.path.startsWith('/api/'))res.sendFile(path.join(site,'index.html'));else next()})}
 const port=Number(process.env.PORT||3001);await app.listen(port,process.env.HOST||'127.0.0.1');console.log(`Arrita API on http://${process.env.HOST||'127.0.0.1'}:${port} (${store.mode})`);return app;
}
if(require.main===module)startServer().catch(e=>{console.error(e);process.exit(1)});
