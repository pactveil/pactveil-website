import {randomBytes,scryptSync} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {createInterface} from 'node:readline/promises';
const rl=createInterface({input:process.stdin,output:process.stdout});
const email=(await rl.question('Administrator email: ')).trim().toLowerCase();rl.close();
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Enter a valid email.');
const password=randomBytes(24).toString('base64url');const salt=randomBytes(16).toString('hex');
const hash='scrypt:'+salt+':'+scryptSync(password,salt,64).toString('hex');
const secret=randomBytes(48).toString('base64url');
let current='';try{current=await readFile('.env.local','utf8');}catch(e){if(e.code!=='ENOENT')throw e;}
current=current.split('\n').filter(line=>! /^(ADMIN_EMAIL|ADMIN_PASSWORD_HASH|SESSION_SECRET)=/.test(line)).join('\n');
await writeFile('.env.local',current.trimEnd()+`\nADMIN_EMAIL=${email}\nADMIN_PASSWORD_HASH=${hash}\nSESSION_SECRET=${secret}\n`,{mode:0o600});
console.log('\nAdmin credentials written to ignored .env.local. Copy those three values into Vercel environment variables.');
console.log('Store this generated login password in your password manager (shown only here):\n'+password);
console.log('Re-running this script rotates the password and invalidates existing sessions after redeployment.');
