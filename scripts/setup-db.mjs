import {readFile} from 'node:fs/promises';
import {neon} from '@neondatabase/serverless';
if(!process.env.DATABASE_URL)throw Error('Set DATABASE_URL in .env.local or your shell before running db:setup.');
const sql=neon(process.env.DATABASE_URL);
const statements=(await readFile(new URL('../db/schema.sql',import.meta.url),'utf8')).split(';').map(s=>s.trim()).filter(Boolean);
await sql.transaction(statements.map(s=>sql.query(s)));
console.log('Database schema is ready. Existing enquiries were preserved.');
