import { neon } from '@neondatabase/serverless';
export type Query = (text:string, values?:unknown[]) => Promise<Record<string,unknown>[]>;
export const query:Query = async (text,values=[]) => {
 const url=process.env.DATABASE_URL;
 if(!url) throw new Error('DATABASE_URL is not configured');
 return await neon(url).query(text,values) as Record<string,unknown>[];
};
