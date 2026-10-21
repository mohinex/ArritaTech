import React,{useEffect,useState,useCallback} from 'react';
import{createRoot}from'react-dom/client';
import{originalMarkup}from'./originalMarkup';
import './original.css';
import './enhancements.css';

const api=async(path,options={})=>{
 const response=await fetch(`/api${path}`,{...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});
 const result=await response.json().catch(()=>({error:'Invalid server response'}));
 if(!response.ok)throw Error(result.message||result.error||`HTTP ${response.status}`);
 return result;
};
const storeKey='arrita_pending_inquiries';
const pending=()=>{try{return JSON.parse(localStorage.getItem(storeKey)||'[]')}catch{return []}};
const savePending=(items)=>localStorage.setItem(storeKey,JSON.stringify(items));
async function syncPending(){
 let items=pending();let remainder=[];
 for(const item of items){try{await api('/inquiries',{method:'POST',body:JSON.stringify(item)})}catch{remainder.push(item)}}
 savePending(remainder);
 window.dispatchEvent(new Event('arrita-sync'));
}
function ContactModal({close}){
 const[form,setForm]=useState({name:'',email:'',company:'',service:'',message:''});
 const[status,setStatus]=useState('');const[busy,setBusy]=useState(false);
 useEffect(()=>{const onKey=e=>{if(e.key==='Escape')close()};document.addEventListener('keydown',onKey);return()=>document.removeEventListener('keydown',onKey)},[close]);
 const update=e=>setForm(v=>({...v,[e.target.name]:e.target.value}));
 const submit=async(e)=>{
  e.preventDefault();setBusy(true);setStatus('');
  const payload={...form,clientId:crypto.randomUUID()};
  try{await api('/inquiries',{method:'POST',body:JSON.stringify(payload)});setStatus('Inquiry submitted successfully.');setForm({name:'',email:'',company:'',service:'',message:''});}
  catch(err){if(!navigator.onLine||err instanceof TypeError){savePending([...pending(),payload]);setStatus('Saved offline. Will send when connectivity returns.');setForm({name:'',email:'',company:'',service:'',message:''});}else setStatus(err.message)}
  finally{setBusy(false)};
 };
 return <div className="arrita-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><div role="dialog" aria-modal="true" aria-labelledby="inquiry-title" className="arrita-modal"><button type="button" className="arrita-close" onClick={close} aria-label="Close">×</button><div className="eyebrow">Your next big move</div><h2 id="inquiry-title">Start a project<span style={{color:'var(--red)'}}>.</span></h2><form onSubmit={submit}><label>Name *<input required maxLength="120" name="name" value={form.name} onChange={update}/></label><label>Email *<input type="email" required maxLength="254" name="email" value={form.email} onChange={update}/></label><label>Company<input maxLength="150" name="company" value={form.company} onChange={update}/></label><label>Service<select name="service" value={form.service} onChange={update}><option value="">Select a service</option>{['Custom Software','Web & Mobile Apps','UI/UX & Product Design','Cloud & DevOps','AI & Automation','Digital Consulting'].map(v=><option key={v}>{v}</option>)}</select></label><label>Project details *<textarea required minLength="10" maxLength="5000" rows="4" name="message" value={form.message} onChange={update}/></label><button className="btn red" type="submit" disabled={busy}>{busy?'Submitting…':'Send inquiry ↗'}</button><p role="status" aria-live="polite">{status}</p></form></div></div>;
}
function Landing(){const[modal,setModal]=useState(false);const close=useCallback(()=>setModal(false),[]);
 useEffect(()=>{
  document.getElementById('year').textContent=new Date().getFullYear();
  const menuBtn=document.getElementById('menuBtn'),navLinks=document.getElementById('navLinks');
  const onMenu=()=>{const open=navLinks.classList.toggle('open');menuBtn.setAttribute('aria-expanded',String(open));menuBtn.textContent=open?'×':'☰'};
  menuBtn.addEventListener('click',onMenu);
  const navHandlers=Array.from(navLinks.querySelectorAll('a')).map(a=>{const h=()=>{navLinks.classList.remove('open');menuBtn.setAttribute('aria-expanded','false');menuBtn.textContent='☰'};a.addEventListener('click',h);return()=>a.removeEventListener('click',h)});
  const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.12});document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
  const projectLink=document.querySelector('.cta .btn');
  const onProject=e=>{e.preventDefault();setModal(true)};projectLink.addEventListener('click',onProject);
  const sync=()=>syncPending();window.addEventListener('online',sync);syncPending();
  return()=>{menuBtn.removeEventListener('click',onMenu);navHandlers.forEach(f=>f());projectLink.removeEventListener('click',onProject);window.removeEventListener('online',sync);io.disconnect()}
 },[]);
 return <><div dangerouslySetInnerHTML={{__html:originalMarkup}}/>{modal&&<ContactModal close={close}/>}</>;
}
function Admin(){
 const[token,setToken]=useState(sessionStorage.getItem('arrita_admin_token')||'');const[typed,setTyped]=useState('');const[items,setItems]=useState([]);const[error,setError]=useState('');const[loading,setLoading]=useState(false);
 const auth={Authorization:`Bearer ${token}`};
 const refresh=useCallback(async()=>{if(!token)return;setLoading(true);try{const r=await api('/admin/inquiries',{headers:auth});setItems(r.items);setError('')}catch(e){setError(e.message)}finally{setLoading(false)}},[token]);
 useEffect(()=>{refresh()},[refresh]);
 const login=e=>{e.preventDefault();sessionStorage.setItem('arrita_admin_token',typed);setToken(typed);setTyped('')};
 const update=async(id,status)=>{try{await api(`/admin/inquiries/${id}`,{method:'PATCH',headers:auth,body:JSON.stringify({status})});await refresh()}catch(e){setError(e.message)}};
 const remove=async(id)=>{if(!window.confirm('Delete this inquiry?'))return;try{await api(`/admin/inquiries/${id}`,{method:'DELETE',headers:auth});await refresh()}catch(e){setError(e.message)}};
 return <div className="admin-shell"><header className="admin-top"><a href="/"><img src="/arrita-wordmark.png" alt="Arrita"/></a><a href="/">← Website</a></header><main className="admin-main"><div className="eyebrow">Administration</div><h1>Inquiry dashboard<span style={{color:'var(--red)'}}>.</span></h1>{!token?<form onSubmit={login} className="admin-login"><label>Admin token<input type="password" autoComplete="off" required value={typed} onChange={e=>setTyped(e.target.value)}/></label><button className="btn red">Sign in</button></form>:<><div className="admin-toolbar"><span>{items.length} inquiries</span><button className="btn" onClick={refresh} disabled={loading}>Refresh</button><button className="btn" onClick={()=>{sessionStorage.removeItem('arrita_admin_token');setToken('');setItems([])}}>Sign out</button></div>{error&&<p role="alert">{error}</p>}<div className="admin-table-wrap"><table><thead><tr><th>Date</th><th>Name</th><th>Email</th><th>Company</th><th>Service</th><th>Message</th><th>Status</th><th>Actions</th></tr></thead><tbody>{items.map(i=><tr key={i.id}><td>{new Date(i.created_at).toLocaleString()}</td><td>{i.name}</td><td><a href={`mailto:${i.email}`}>{i.email}</a></td><td>{i.company||'—'}</td><td>{i.service||'—'}</td><td className="message-cell">{i.message}</td><td><select aria-label={`Status for ${i.name}`} value={i.status} onChange={e=>update(i.id,e.target.value)}>{['new','in_progress','closed'].map(v=><option key={v} value={v}>{v}</option>)}</select></td><td><button onClick={()=>remove(i.id)}>Delete</button></td></tr>)}</tbody></table>{!items.length&&!loading&&<p>No inquiries.</p>}</div></>}</main></div>
}
createRoot(document.getElementById('root')).render(location.pathname.startsWith('/admin')?<Admin/>:<Landing/>);
