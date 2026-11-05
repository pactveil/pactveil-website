import {NextResponse} from 'next/server';
import {query} from '../../../../db';
import {takeRateLimit} from '../../../../lib/inquiries';
import {authConfigured,passwordMatches,normalizeEmail,createSession,COOKIE,SESSION_SECONDS} from '../../../../lib/auth';
import {sameOrigin,boundedText} from '../../../../lib/request';
export const runtime='nodejs';
export async function POST(request:Request){
 if(!sameOrigin(request))return new Response('Forbidden',{status:403});
 if(!authConfigured())return Response.json({error:'Administrator access has not been configured.'},{status:503});
 let data;try{data=JSON.parse(await boundedText(request,4096));}catch{return Response.json({error:'Invalid request.'},{status:400});}
 if(typeof data?.email!=='string'||typeof data?.password!=='string'||data.email.length>254||data.password.length>1024)return Response.json({error:'Invalid credentials.'},{status:400});
 try{
 // Shared persistent limit for the single administrator account, independent of spoofable IP headers.
 if(!await takeRateLimit(query,'admin-login',10,900))return Response.json({error:'Too many attempts. Try again in 15 minutes.'},{status:429});
 const matches=await passwordMatches(data.password,process.env.ADMIN_PASSWORD_HASH!);
 if(!matches||normalizeEmail(data.email)!==normalizeEmail(process.env.ADMIN_EMAIL!))return Response.json({error:'Incorrect email or password.'},{status:401});
 const response=NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 response.cookies.set(COOKIE,createSession(),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:SESSION_SECONDS});
 return response;
 }catch{return Response.json({error:'Sign-in is temporarily unavailable.'},{status:503});}
}
