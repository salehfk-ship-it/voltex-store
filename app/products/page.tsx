'use client'
import {useEffect,useState} from 'react'
import {sb} from '@/lib/supabase'
import {Grid,eff} from '@/lib/ui'
export default function P(){
 const [all,setAll]=useState<any[]>([]),[cats,setCats]=useState<any[]>([]),[q,setQ]=useState(''),[f,setF]=useState<any>({})
 useEffect(()=>{setQ(new URLSearchParams(location.search).get('q')||'')
  sb.from('products').select('*').eq('is_active',true).order('created_at',{ascending:false}).then(r=>setAll(r.data||[]))
  sb.from('categories').select('*').eq('is_active',true).order('sort_order').then(r=>setCats(r.data||[]))},[])
 const cn=(p:any)=>cats.find(c=>c.id===p.category_id)?.name_ar||''
 const t=q.trim().toLowerCase()
 const list=all.filter(p=>(!t||[p.name_ar,p.name_en,p.sku,p.description_ar,cn(p)].some(x=>(x||'').toLowerCase().includes(t)))
  &&(!f.cat||p.category_id===f.cat)&&(!f.max||eff(p)<=+f.max)&&(!f.light_type||p.light_type===f.light_type)&&(!f.light_color||p.light_color===f.light_color)
  &&(!f.material||p.material===f.material)&&(!f.avail||!p.is_out_of_stock)&&(!f.offer||p.is_offer||p.sale_price))
 const opts=(k:string)=>Array.from(new Set(all.map(p=>p[k]).filter(Boolean))) as string[]
 const sel=(k:string,l:string)=><select className="inp" value={f[k]||''} onChange={e=>setF({...f,[k]:e.target.value})}><option value="">{l}</option>{opts(k).map(x=><option key={x}>{x}</option>)}</select>
 return <div className="max-w-6xl mx-auto px-4 py-8"><input className="inp mb-4" placeholder="ابحث: ثريا، CH-102، جزء من الاسم..." value={q} onChange={e=>setQ(e.target.value)}/>
  <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-6">
   <select className="inp" value={f.cat||''} onChange={e=>setF({...f,cat:e.target.value})}><option value="">كل التصنيفات</option>{cats.map(c=><option key={c.id} value={c.id}>{c.name_ar}</option>)}</select>
   <input className="inp" type="number" placeholder="أقصى سعر" onChange={e=>setF({...f,max:e.target.value})}/>
   {sel('light_type','نوع الإضاءة')}{sel('light_color','اللون')}{sel('material','الخامة')}
   <div className="flex gap-3 items-center text-sm"><label><input type="checkbox" onChange={e=>setF({...f,avail:e.target.checked})}/> متوفر</label><label><input type="checkbox" onChange={e=>setF({...f,offer:e.target.checked})}/> عروض</label></div></div>
  {list.length?<Grid list={list}/>:<p className="text-center text-neutral-500 py-20">لا توجد نتائج. جرّب كلمة أخرى أو أزل الفلاتر.</p>}</div>}
