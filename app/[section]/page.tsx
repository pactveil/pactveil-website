import Site from '../Site';
import { notFound, redirect } from 'next/navigation';
export default async function Page({params}:{params:Promise<{section:string}>}){const {section}=await params;if(section==='plan')redirect('/ai-solutions');if(!['work','solutions','ai-solutions','book-demo','privacy','security'].includes(section))notFound();return <Site view={section}/>}
