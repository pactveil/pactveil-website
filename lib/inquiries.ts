import type { Query } from '../db/index';
export type Inquiry={id:string;createdAt:string;name:string;email:string;company:string;market:string;interest:string;message:string;consentVersion:string};
export const columns=`id, created_at AS "createdAt", name, email, company, market, interest, message, consent_version AS "consentVersion"`;
export async function saveInquiry(db:Query,r:Inquiry){
 await db('INSERT INTO inquiries (id,created_at,name,email,company,market,interest,message,consent_version) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',[r.id,r.createdAt,r.name,r.email,r.company,r.market,r.interest,r.message,r.consentVersion]);
}
export async function listInquiries(db:Query,limit=100,offset=0){
 const rows=await db(`SELECT ${columns} FROM inquiries ORDER BY created_at DESC,id DESC LIMIT $1 OFFSET $2`,[limit,offset]);
 return rows.map(r=>({...r,createdAt:new Date(r.createdAt as string).toISOString()})) as Inquiry[];
}
export async function takeRateLimit(db:Query,key:string,limit:number,seconds:number){
 const rows=await db(`INSERT INTO rate_limits (key,attempts,expires_at) VALUES ($1,1,NOW()+($2 * INTERVAL '1 second'))
 ON CONFLICT (key) DO UPDATE SET
 attempts=CASE WHEN rate_limits.expires_at<=NOW() THEN 1 ELSE rate_limits.attempts+1 END,
 expires_at=CASE WHEN rate_limits.expires_at<=NOW() THEN NOW()+($2 * INTERVAL '1 second') ELSE rate_limits.expires_at END
 RETURNING attempts`,[key,seconds]);
 return Number(rows[0]?.attempts)<=limit;
}
export function parseInquiry(v:unknown):Omit<Inquiry,'id'|'createdAt'|'consentVersion'>|null{
 if(!v||typeof v!=='object'||Array.isArray(v))return null;
 const r=v as Record<string,unknown>;
 const limits={name:120,email:254,company:200,market:100,interest:100,message:3000};
 for(const [field,max] of Object.entries(limits))if(typeof r[field]!=='string'||(r[field] as string).length>max)return null;
 const d=Object.fromEntries(Object.keys(limits).map(k=>[k,(r[k] as string).trim()])) as Omit<Inquiry,'id'|'createdAt'|'consentVersion'>;
 if(!d.name||!d.company||!d.market||!d.interest||!d.email||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)||r.consent!==true||r.website)return null;
 d.email=d.email.toLowerCase();return d;
}
export function inquiriesCsv(rows:Inquiry[]){
 const keys=['id','createdAt','name','email','company','market','interest','message'] as const;
 const cell=(v:string)=>'"'+v.replace(/^(\s*[=+@-]|[\t\r\n])/u,"'$&").replace(/"/g,'""')+'"';
 return '\uFEFF'+[keys.join(','),...rows.map(r=>keys.map(k=>cell(r[k]??'')).join(','))].join('\r\n');
}
