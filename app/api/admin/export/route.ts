import {cookies} from 'next/headers';
import {COOKIE,verifySession} from '../../../../lib/auth';
import {query} from '../../../../db';
import {listInquiries,inquiriesCsv} from '../../../../lib/inquiries';
export const runtime='nodejs';
export async function GET(){
 if(!verifySession((await cookies()).get(COOKIE)?.value))return new Response('Forbidden',{status:403,headers:{'Cache-Control':'no-store'}});
 try{
 const rows=await listInquiries(query,10001);
 if(rows.length>10000)return new Response('Export exceeds 10,000 rows. Export from your database console.',{status:413});
 return new Response(inquiriesCsv(rows),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="pactveil-ai-inquiries.csv"','Cache-Control':'no-store'}});
 }catch{return new Response('Export unavailable. Check database configuration.',{status:503});}
}
