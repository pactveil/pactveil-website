import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {query} from '../../db';
import {listInquiries} from '../../lib/inquiries';
import {COOKIE,verifySession} from '../../lib/auth';
export const dynamic='force-dynamic';
export default async function Admin({searchParams}:{searchParams:Promise<{page?:string}>}){
 if(!verifySession((await cookies()).get(COOKIE)?.value))redirect('/admin/login');
 const p=await searchParams;const page=Math.max(1,Math.min(100000,Number.parseInt(p.page||'1',10)||1));
 let rows;try{rows=await listInquiries(query,51,(page-1)*50);}catch{return <main className="wrap"><h1>Unable to load enquiries.</h1><p>Check the database configuration and schema, then try again.</p><a className="button" href="/admin">Try again</a></main>;}
 const next=rows.length>50;const records=rows.slice(0,50);
 return <main className="wrap"><a href="/">← Back to website</a><div className="admin-toolbar"><div><div className="eyebrow">PACTVEIL AI / PRIVATE WORKSPACE</div><h1 style={{fontSize:58}}>Demo enquiries</h1><p>Email demo mode · No emails are sent.</p><p>Future notification recipient: elizabeth@pactveil.com</p></div><div><a className="button" href="/api/admin/export">Export CSV ↓</a><form action="/api/admin/logout" method="post" style={{marginTop:15}}><button className="text-link" type="submit">Sign out</button></form></div></div>{records.length===0?<p>No enquiries on this page.</p>:records.map(r=><article className="admin-row" key={r.id}><div className="eyebrow">{r.interest} / {r.createdAt.slice(0,16).replace('T',' ')} UTC</div><h3>{r.name} · {r.company}</h3><p>{r.email} / {r.market}</p><p style={{whiteSpace:'pre-wrap'}}>{r.message||'No additional message.'}</p><p className="fine">Reference: {r.id}</p></article>)}<div style={{display:'flex',gap:30,marginTop:30}}>{page>1&&<a href={`/admin?page=${page-1}`}>← Previous</a>}<span>Page {page}</span>{next&&<a href={`/admin?page=${page+1}`}>Next →</a>}</div></main>;
}
