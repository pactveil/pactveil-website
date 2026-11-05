import {readFile} from 'node:fs/promises';
import {parse} from 'csv-parse/sync';
import {neon} from '@neondatabase/serverless';
const filename=process.argv[2];
if(!filename||!process.env.DATABASE_URL)throw Error('Usage: npm run db:import -- /path/to/export.csv (requires DATABASE_URL).');
const rows=parse(await readFile(filename,'utf8'),{columns:true,bom:true,skip_empty_lines:true});
const keys=['id','createdAt','name','email','company','market','interest','message'];
// The old CSV exporter prefixes formula-like values with an apostrophe for spreadsheet safety.
const restore=v=>v.replace(/^'(?=[=+@\-\t\r])/,'');
for(const row of rows){if(keys.some(k=>typeof row[k]!=='string')||!row.id||Number.isNaN(Date.parse(row.createdAt)))throw Error('Invalid CSV row. Nothing imported.');}
const sql=neon(process.env.DATABASE_URL);
for(let i=0;i<rows.length;i+=100){
 await sql.transaction(rows.slice(i,i+100).map(r=>sql.query('INSERT INTO inquiries (id,created_at,name,email,company,market,interest,message,consent_version) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING',[r.id,new Date(r.createdAt).toISOString(),...keys.slice(2).map(k=>restore(r[k])),'legacy-export-not-recorded'])));
}
console.log(`Processed ${rows.length} rows. Existing IDs were skipped. Legacy export does not contain a consent version; that field is marked explicitly.`);
