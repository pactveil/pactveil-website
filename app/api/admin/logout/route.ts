import {NextResponse} from 'next/server';
import {COOKIE} from '../../../../lib/auth';
import {sameOrigin} from '../../../../lib/request';
export async function POST(request:Request){
 if(!sameOrigin(request))return new Response('Forbidden',{status:403});
 const response=NextResponse.redirect(new URL('/admin/login',request.url),303);
 response.cookies.set(COOKIE,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:0});return response;
}
