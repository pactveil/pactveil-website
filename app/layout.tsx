import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'pactveil ai — AI-powered brands. Intelligent experiences.',description:'AI digital humans, intelligent content, multilingual engagement and audience insights. hotmedia × hotchain.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
