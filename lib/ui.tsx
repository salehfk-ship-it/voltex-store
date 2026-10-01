'use client'
import Link from 'next/link'
import {useApp} from './shell'
export const eff=(p:any)=>p.sale_price??p.price
export function Card({p}:{p:any}){
 const {add,money}=useApp(),price=eff(p),old=p.sale_price?p.price:p.old_price,off=old&&old>price?Math.round((1-price/old)*100):0
 const badge=p.is_out_of_stock?'غير متوفر':p.is_new?'جديد':p.is_bestseller?'الأكثر مبيعاً':(p.is_offer||off)?'عرض':null
 return <div className="group">
  <Link href={'/product/'+p.id} className="block relative aspect-square bg-neutral-100 overflow-hidden">
   {p.main_image_url?<img loading="lazy" src={p.main_image_url} alt={p.name_ar} className="w-full h-full object-cover transition duration-500 group-hover:scale-105"/>
    :<div className="w-full h-full grid place-items-center text-neutral-400 text-xs">لا توجد صورة</div>}
   {badge&&<span className="absolute top-2 right-2 bg-ink text-gold text-xs px-2 py-1">{badge}</span>}
   {off>0&&<span className="absolute top-2 left-2 bg-gold text-white text-xs px-2 py-1">-{off}%</span>}</Link>
  <div className="pt-3 space-y-1"><div className="text-xs text-neutral-500">{p.sku}</div>
   <div className="font-medium">{p.name_ar}</div>
   <div><span className="font-bold">{money(price)}</span>{old>price&&<span className="line-through text-neutral-400 text-sm mr-2">{money(old)}</span>}</div>
   <div className="flex gap-2 pt-1">
    <button className="btn flex-1" disabled={p.is_out_of_stock} onClick={()=>add({id:p.id,name:p.name_ar,sku:p.sku,price,image:p.main_image_url,qty:1})}>أضف إلى السلة</button>
    <Link className="btn2" href={'/product/'+p.id}>عرض</Link></div></div></div>}
export const Grid=({list}:{list:any[]})=><div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">{list.map(p=><Card key={p.id} p={p}/>)}</div>
