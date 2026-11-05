import type {NextConfig} from 'next';
const config:NextConfig={
 poweredByHeader:false,
 async headers(){return [{source:'/(.*)',headers:[
 {key:'X-Content-Type-Options',value:'nosniff'},
 {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
 {key:'X-Frame-Options',value:'DENY'}
 ]},{source:'/admin/:path*',headers:[{key:'X-Robots-Tag',value:'noindex, nofollow'},{key:'Cache-Control',value:'private, no-store'}]},
 {source:'/api/admin/:path*',headers:[{key:'Cache-Control',value:'private, no-store'}]}];}
};
export default config;
