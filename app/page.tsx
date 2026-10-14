'use client'
import {useEffect,useState} from 'react'
import Link from 'next/link'
import {sb} from '@/lib/supabase'
import {useApp} from '@/lib/shell'
import {Grid} from '@/lib/ui'
export default function Home(){
 const {s}=useApp(),[ps,setPs]=useState<any[]>([]),[cs,setCs]=useState<any[]>([])
 useEffect(()=>{sb.from('products').select('*').eq('is_active',true).order('created_at',{ascending:false}).then(r=>setPs(r.data||[]))
  sb.from('categories').select('*').eq('is_active',true).order('sort_order').then(r=>setCs(r.data||[]))},[])
 const h=s.hero||{},secs:[string,(p:any)=>boolean][]=[['أحدث المنتجات',()=>true],['الأكثر طلباً',p=>p.is_bestseller],['العروض',p=>p.is_offer||!!p.sale_price],['ثريات مميزة',p=>p.is_featured],['إضاءة عصرية',p=>/عصري|مودرن|LED/i.test(p.name_ar+(p.name_en||''))],['إضاءة كلاسيكية',p=>/كلاسيك|كريستال/.test(p.name_ar)]]
 return <>
  <section className="bg-ink text-white relative overflow-hidden">
   {h.image_url&&<img src={h.image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50"/>}
   <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-36"><h1 className="text-3xl md:text-5xl font-bold text-gold max-w-xl leading-snug">{h.title}</h1>
    <p className="mt-4 text-white/80 max-w-md">{h.subtitle}</p><Link href="/products" className="btn mt-8 !bg-gold hover:!bg-white hover:!text-ink">تسوق الآن</Link></div></section>
  <div className="max-w-6xl mx-auto px-4 space-y-16 mt-14">
   {secs.map(([t,f])=>{const l=ps.filter(f).slice(0,4);return l.length?<section key={t}><h2 className="text-2xl font-bold mb-6">{t}</h2><Grid list={l}/></section>:null})}
   {ps.length? <section><h2 className="text-2xl font-bold mb-6">كل المنتجات</h2><Grid list={ps}/></section> : null}
   <section><h2 className="text-2xl font-bold mb-6">تسوق حسب التصنيف</h2><div className="flex flex-wrap gap-3">
    {cs.map(c=><Link key={c.id} href={'/products?q='+encodeURIComponent(c.name_ar)} className="btn2">{c.name_ar}</Link>)}</div></section>
   <section className="bg-ink text-center text-white py-14 px-4"><h2 className="text-2xl text-gold font-bold">جاهز لتجديد إضاءة منزلك؟</h2>
    <Link href="/products" className="btn mt-6 !bg-gold">تصفح كل المنتجات</Link></section></div></>}
