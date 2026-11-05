import {query} from '../../../db';
import {saveInquiry,parseInquiry,takeRateLimit} from '../../../lib/inquiries';
import {sameOrigin,boundedText} from '../../../lib/request';
import {rateKey} from '../../../lib/auth';
export const runtime='nodejs';
export async function POST(request:Request){
 const headers={'Cache-Control':'no-store'};
 if(!sameOrigin(request))return Response.json({error:'Please submit this form from our website.'},{status:403,headers});
 if(!request.headers.get('content-type')?.includes('application/json'))return Response.json({error:'Invalid request.'},{status:415,headers});
 let raw;try{raw=await boundedText(request,24000);}catch{return Response.json({error:'Your message is too long.'},{status:413,headers});}
 let parsed;try{parsed=JSON.parse(raw);}catch{return Response.json({error:'Invalid form.'},{status:400,headers});}
 const data=parseInquiry(parsed);if(!data)return Response.json({error:'Please check your details and acknowledge the privacy notice.'},{status:400,headers});
 const id=crypto.randomUUID();
 try{
  if(!await takeRateLimit(query,rateKey('inquiry',data.email),5,900))return Response.json({error:'Too many requests. Please try again in 15 minutes.'},{status:429,headers});
  await saveInquiry(query,{...data,id,createdAt:new Date().toISOString(),consentVersion:'2026-11-05'});
  // Demo mode by user request: persist the inquiry, but never send an email.
  return Response.json({id},{status:201,headers});
 }catch{console.error('Inquiry persistence failed');return Response.json({error:'We could not save your request. Please try again. Your form has been kept.'},{status:503,headers});}
}
