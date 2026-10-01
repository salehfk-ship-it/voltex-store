'use client'
import React,{createContext,useContext,useEffect,useState} from 'react'
import Link from 'next/link'
import {sb} from './supabase'
export type Item={id:string,name:string,sku:string,price:number,image:string|null,qty:number}
const C=createContext<any>(null)
export const useApp=()=>useContext(C)
export function Shell({children}:{children:React.ReactNode}){
 const [s,setS]=useState<any>({}),[cart,setCart]=useState<Item[]>([]),[q,setQ]=useState('')
 useEffect(()=>{try{setCart(JSON.parse(localStorage.getItem('cart')||'[]'))}catch{}
  sb.from('settings').select('*').then(({data})=>setS(Object.fromEntries((data||[]).map((r:any)=>[r.key,r.value]))))},[])
 const save=(c:Item[])=>{setCart(c);localStorage.setItem('cart',JSON.stringify(c))}
 const add=(i:Item)=>save(cart.find(x=>x.id===i.id)?cart.map(x=>x.id===i.id?{...x,qty:x.qty+i.qty}:x):[...cart,i])
 const setQty=(id:string,n:number)=>save(n<1?cart.filter(x=>x.id!==id):cart.map(x=>x.id===id?{...x,qty:n}:x))
 const count=cart.reduce((a,b)=>a+b.qty,0)
 const money=(n:number)=>`${n} ${s.currency||''}`
 return <C.Provider value={{s,setS,cart,add,setQty,clear:()=>save([]),money,count}}>
  <header className="bg-ink text-white sticky top-0 z-30">
   <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
    <Link href="/" className="flex items-center gap-2 text-gold font-bold">
     {s.logo_url?<img src={s.logo_url} alt="" className="h-9"/>:null}<span>{s.store_name||'اسم المتجر'}</span></Link>
    <nav className="hidden sm:flex gap-4 text-sm"><Link href="/">الرئيسية</Link><Link href="/products">المنتجات</Link></nav>
    <form className="flex-1" onSubmit={e=>{e.preventDefault();location.href='/products?q='+encodeURIComponent(q)}}>
     <input value={q} onChange={e=>setQ(e.target.value)} placeholder="ابحث بالاسم أو الكود..." className="w-full bg-white/10 px-3 py-1.5 text-sm outline-none placeholder:text-white/50"/></form>
    <Link href="/cart" className="text-sm whitespace-nowrap">السلة ({count})</Link>
   </div></header>
  <main className="min-h-[70vh]">{children}</main>
  <footer className="bg-ink text-white/70 text-sm mt-20 py-8 text-center">
   <div className="text-gold mb-1">{s.store_name} {s.store_tagline}</div>{s.contact_phone} {s.contact_address}</footer>
 </C.Provider>}
