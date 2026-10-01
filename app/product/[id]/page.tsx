'use client'
import {useEffect,useState} from 'react'
import {useParams,useRouter} from 'next/navigation'
import {sb} from '@/lib/supabase'
import {useApp} from '@/lib/shell'
import {Grid,eff} from '@/lib/ui'
export default function Prod(){
 const {id}=useParams() as {id:string},r=useRouter(),{add,money}=useApp()
 const [p,setP]=useState<any>(null),[imgs,setImgs]=useState<string[]>([]),[cur,setCur]=useState(''),[qty,setQty]=useState(1),[sim,setSim]=useState<any[]>([]),[zoom,setZoom]=useState(false)
 useEffect(()=>{sb.from('products').select('*').eq('id',id).maybeSingle().then(async({data})=>{if(!data)return;setP(data)
  const {data:im}=await sb.from('product_images').select('url').eq('product_id',id).order('sort_order')
  const l=[data.main_image_url,...(im||[]).map((x:any)=>x.url)].filter(Boolean);setImgs(l);setCur(l[0]||'')
  let q=sb.from('products').select('*').eq('is_active',true).neq('id',id).limit(4);if(data.category_id)q=q.eq('category_id',data.category_id)
  q.then(x=>setSim(x.data||[]))})},[id])
 if(!p)return <p className="p-20 text-center">جارٍ التحميل...</p>
 const price=eff(p),old=p.sale_price?p.price:p.old_price
 const item={id:p.id,name:p.name_ar,sku:p.sku,price,image:p.main_image_url,qty}
 const specs:[string,any][]=[['نوع الإضاءة',p.light_type],['لون الإضاءة',p.light_color],['الخامة',p.material],['عدد اللمبات',p.bulb_count],['نوع القاعدة',p.bulb_base],['الأبعاد',p.dimensions]]
 return <div className="max-w-6xl mx-auto px-4 py-8"><div className="grid md:grid-cols-2 gap-10">
  <div><div className="aspect-square bg-neutral-100 cursor-zoom-in" onClick={()=>cur&&setZoom(true)}>{cur&&<img src={cur} alt={p.name_ar} className="w-full h-full object-cover"/>}</div>
   <div className="flex gap-2 mt-2">{imgs.map(u=><img key={u} src={u} loading="lazy" onClick={()=>setCur(u)} className={'w-16 h-16 object-cover cursor-pointer '+(u===cur?'ring-2 ring-gold':'')}/>)}</div></div>
  <div className="space-y-4"><div className="text-sm text-neutral-500">الكود: {p.sku}</div><h1 className="text-3xl font-bold">{p.name_ar}</h1>
   <div className="text-2xl font-bold">{money(price)}{old>price&&<span className="line-through text-neutral-400 text-base mr-3">{money(old)}</span>}</div>
   <p className="text-neutral-600 leading-relaxed">{p.description_ar}</p>
   <dl className="text-sm divide-y">{specs.filter(x=>x[1]).map(([k,v])=><div key={k} className="flex justify-between py-2"><dt className="text-neutral-500">{k}</dt><dd>{v}</dd></div>)}</dl>
   {p.is_out_of_stock?<p className="text-red-600">غير متوفر حالياً</p>:<>
   <div className="flex items-center gap-3"><button className="btn2" onClick={()=>setQty(Math.max(1,qty-1))}>-</button><span>{qty}</span><button className="btn2" onClick={()=>setQty(qty+1)}>+</button></div>
   <div className="flex gap-2"><button className="btn flex-1" onClick={()=>add(item)}>أضف للسلة</button><button className="btn2 flex-1" onClick={()=>{add(item);r.push('/checkout')}}>اطلب الآن</button></div></>}</div></div>
  {sim.length>0&&<section className="mt-16"><h2 className="text-2xl font-bold mb-6">منتجات مشابهة</h2><Grid list={sim}/></section>}
  {zoom&&<div className="fixed inset-0 bg-black/90 z-50 grid place-items-center" onClick={()=>setZoom(false)}><img src={cur} className="max-h-[90vh] max-w-[95vw]"/></div>}</div>}
