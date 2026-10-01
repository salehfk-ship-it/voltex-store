'use client'
import Link from 'next/link'
import {useApp} from '@/lib/shell'
export default function Cart(){
 const {cart,setQty,money}=useApp(),sub=cart.reduce((a:number,i:any)=>a+i.price*i.qty,0)
 if(!cart.length)return <div className="text-center py-24"><p className="mb-6">السلة فارغة</p><Link href="/products" className="btn">تصفح المنتجات</Link></div>
 return <div className="max-w-3xl mx-auto px-4 py-8"><h1 className="text-2xl font-bold mb-6">السلة</h1>
  {cart.map((i:any)=><div key={i.id} className="flex gap-4 py-4 border-b items-center">
   <div className="w-20 h-20 bg-neutral-100 shrink-0">{i.image&&<img src={i.image} className="w-full h-full object-cover"/>}</div>
   <div className="flex-1"><div className="font-medium">{i.name}</div><div className="text-xs text-neutral-500">{i.sku}</div><div className="text-sm">{money(i.price)}</div></div>
   <div className="flex items-center gap-2"><button className="btn2 !px-3" onClick={()=>setQty(i.id,i.qty-1)}>-</button>{i.qty}<button className="btn2 !px-3" onClick={()=>setQty(i.id,i.qty+1)}>+</button></div>
   <div className="w-24 text-left font-bold">{money(i.price*i.qty)}</div><button onClick={()=>setQty(i.id,0)} className="text-red-600 text-sm">حذف</button></div>)}
  <div className="mt-6 text-lg flex justify-between"><span>المجموع الفرعي</span><b>{money(sub)}</b></div>
  <p className="text-xs text-neutral-500">تكلفة التوصيل تُحسب حسب المدينة في الخطوة التالية.</p>
  <Link href="/checkout" className="btn block mt-6">إتمام الطلب</Link></div>}
