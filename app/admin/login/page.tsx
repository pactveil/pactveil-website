'use client';
import {useState,type FormEvent} from 'react';
export default function Login(){
 const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();if(busy)return;setBusy(true);setError('');const f=new FormData(e.currentTarget);
 try{const r=await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(f))});const data=await r.json();if(!r.ok)throw Error(data.error);window.location.assign('/admin');}catch(e){setError(e instanceof Error?e.message:'Unable to sign in.');setBusy(false);}}
 return <main className="wrap" style={{maxWidth:640}}><a className="brand" href="/" aria-label="pactveil ai home">pactveil<sup className="brand-ai">ai</sup></a><div className="eyebrow" style={{marginTop:60}}>PRIVATE WORKSPACE</div><h1 style={{fontSize:54}}>Welcome back.</h1><p style={{margin:'24px 0'}}>Sign in to review website enquiries.</p><div className="form-panel"><form onSubmit={submit}><label>Email<input name="email" type="email" autoComplete="username" required maxLength={254}/></label><label>Password<input name="password" type="password" autoComplete="current-password" required maxLength={1024}/></label><p className="form-error" role="alert">{error}</p><button className="button submit" disabled={busy}>{busy?'Signing in…':'Sign in'}<span aria-hidden="true">↗</span></button></form></div></main>;
}
