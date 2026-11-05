import {createHmac,createHash,timingSafeEqual,scrypt,randomBytes} from 'node:crypto';
import {promisify} from 'node:util';
const derive=promisify(scrypt);
export const COOKIE='pactveil_admin';
export const SESSION_SECONDS=60*60*8;
export const normalizeEmail=(s:string)=>s.trim().toLowerCase();
export function authConfigured(){return !!process.env.ADMIN_EMAIL&&!!process.env.ADMIN_PASSWORD_HASH&&!!process.env.SESSION_SECRET&&process.env.SESSION_SECRET.length>=32;}
export async function passwordMatches(password:string,encoded:string){
 const [version,salt,hash]=encoded.split(':');
 if(version!=='scrypt'||! /^[a-f0-9]{32}$/.test(salt||'')||! /^[a-f0-9]{128}$/.test(hash||'')||password.length>1024)return false;
 const actual=await derive(password,salt,64) as Buffer;
 return timingSafeEqual(actual,Buffer.from(hash,'hex'));
}
function signingKey(){
 if(!authConfigured())throw Error('Admin authentication is not configured');
 return createHmac('sha256',process.env.SESSION_SECRET!).update(process.env.ADMIN_PASSWORD_HASH!).digest();
}
export function createSession(now=Date.now()){
 const body=Buffer.from(JSON.stringify({email:normalizeEmail(process.env.ADMIN_EMAIL!),expires:now+SESSION_SECONDS*1000,nonce:randomBytes(16).toString('hex')})).toString('base64url');
 return body+'.'+createHmac('sha256',signingKey()).update(body).digest('base64url');
}
export function verifySession(token:string|undefined,now=Date.now()){
 if(!token||!authConfigured())return false;
 try{
 const [body,signature,...rest]=token.split('.');if(rest.length||!body||!signature)return false;
 const expected=createHmac('sha256',signingKey()).update(body).digest();const supplied=Buffer.from(signature,'base64url');
 if(supplied.length!==expected.length||!timingSafeEqual(supplied,expected))return false;
 const p=JSON.parse(Buffer.from(body,'base64url').toString());
 return p.email===normalizeEmail(process.env.ADMIN_EMAIL!)&&Number.isFinite(p.expires)&&p.expires>now&&p.expires<=now+SESSION_SECONDS*1000;
 }catch{return false;}
}
export function rateKey(prefix:string,value:string){return prefix+':'+createHash('sha256').update(value).digest('hex');}
