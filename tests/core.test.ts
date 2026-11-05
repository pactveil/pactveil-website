import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {scryptSync} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {parseInquiry,saveInquiry,listInquiries,takeRateLimit,inquiriesCsv,type Inquiry} from '../lib/inquiries';
import {passwordMatches,createSession,verifySession} from '../lib/auth';
import {boundedText,sameOrigin} from '../lib/request';
import type {Query} from '../db';
const fields={name:'Alice',email:'ALICE@example.com',company:'Example',market:'Europe',interest:'AI digital humans',message:'Hello',consent:true,website:''};
test('inquiries reject invalid consent, oversized inputs and bot field; normalize email',()=>{
 assert.equal(parseInquiry(fields)?.email,'alice@example.com');
 for(const v of [null,[],{...fields,consent:false},{...fields,website:'spam'},{...fields,email:'invalid'},{...fields,name:' '},{...fields,message:'a'.repeat(3001)}])assert.equal(parseInquiry(v),null);
});
test('Postgres schema stores submitted enquiry, orders/paginates and rate limits atomically',async()=>{
 const db=new PGlite();try{
 await db.exec(await readFile(new URL('../db/schema.sql',import.meta.url),'utf8'));
 const q:Query=async(t,v)=>(await db.query<Record<string,unknown>>(t,v)).rows;
 const r:Inquiry={...parseInquiry(fields)!,id:'first',createdAt:'2026-11-05T00:00:00Z',consentVersion:'2026-11-05'};
 await saveInquiry(q,r);await saveInquiry(q,{...r,id:'second',createdAt:'2026-11-05T01:00:00Z',message:"Robert'); DROP TABLE inquiries;--"});
 assert.equal((await listInquiries(q,1))[0].id,'second');assert.equal((await listInquiries(q,1,1))[0].id,'first');
 const limits=await Promise.all(Array.from({length:12},()=>takeRateLimit(q,'test-admin',10,900)));assert.equal(limits.filter(Boolean).length,10);
 await q("UPDATE rate_limits SET expires_at=NOW()-INTERVAL '1 second' WHERE key=$1",['test-admin']);assert.equal(await takeRateLimit(q,'test-admin',10,900),true);
 assert.equal((await listInquiries(q)).length,2);
 }finally{await db.close();}
});
test('passwords, tampered/expired cookies, and credential rotation',async()=>{
 const salt='a'.repeat(32);const hash='scrypt:'+salt+':'+scryptSync('secret-test',salt,64).toString('hex');
 process.env.ADMIN_EMAIL='admin@example.com';process.env.ADMIN_PASSWORD_HASH=hash;process.env.SESSION_SECRET='test-only-'.repeat(8);
 assert.equal(await passwordMatches('secret-test',hash),true);assert.equal(await passwordMatches('wrong',hash),false);assert.equal(await passwordMatches('secret-test','bad'),false);
 const now=Date.now(), token=createSession(now);
 assert.equal(verifySession(token,now),true);assert.equal(verifySession(token+'x',now),false);assert.equal(verifySession(token,now+9*3600*1000),false);assert.equal(verifySession(undefined),false);
 process.env.ADMIN_PASSWORD_HASH=hash+'0';assert.equal(verifySession(token,now),false);
 delete process.env.SESSION_SECRET;assert.equal(verifySession(token,now),false);
});
test('CSV protects spreadsheet formulas and preserves quoted multiline content',()=>{
 const csv=inquiriesCsv([{...parseInquiry(fields)!,id:'id',createdAt:'date',consentVersion:'v',name:'  =CMD()',message:'line1\n"line2"'}]);
 assert.ok(csv.includes('"\'  =CMD()"'));assert.ok(csv.includes('line1\n""line2""'));
});
test('requests reject cross-origin and oversized streamed bodies',async()=>{
 assert.equal(sameOrigin(new Request('https://pactveil.test/api',{headers:{origin:'https://evil.test'}})),false);
 assert.equal(sameOrigin(new Request('https://pactveil.test/api',{headers:{origin:'https://pactveil.test'}})),true);
 await assert.rejects(boundedText(new Request('https://pactveil.test',{method:'POST',body:'123456'}),5));
 assert.equal(await boundedText(new Request('https://pactveil.test',{method:'POST',body:'123'}),5),'123');
});
