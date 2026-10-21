const {app,BrowserWindow,shell}=require('electron');
const path=require('node:path');
const fs=require('node:fs');
let server;
async function start(){
 const dev=!app.isPackaged;
 if(!dev){
  process.env.SQLITE_PATH=path.join(app.getPath('userData'),'arrita.sqlite');
  process.env.PORT='3001';process.env.HOST='127.0.0.1';
  process.env.FRONTEND_DIST=path.resolve(__dirname,'../frontend/dist');
  const {startServer}=require('../backend/dist/main.js');
  server=await startServer();
 }
 const win=new BrowserWindow({width:1440,height:900,minWidth:800,minHeight:600,backgroundColor:'#09090b',webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});
 const target=dev?'http://127.0.0.1:5173':'http://127.0.0.1:3001';
 win.webContents.setWindowOpenHandler(({url})=>{if(url.startsWith('https:')||url.startsWith('mailto:'))shell.openExternal(url);return{action:'deny'}});
 win.loadURL(target);
}
app.whenReady().then(start).catch(console.error);
app.on('window-all-closed',async()=>{if(server)await server.close();if(process.platform!=='darwin')app.quit()});
app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)start()});
