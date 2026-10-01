'use client'
import {useEffect,useState} from 'react'
import {sb} from '@/lib/supabase'
import {useApp} from '@/lib/shell'
export default function Checkout(){
 const {cart,clear,money,s}=useApp(),[cities,setCities]=useState<any[]>([]),[f,setF]=useState<any>({}),[busy,setBusy]=useState(false),[done,setDone]=useState<any>(null),[err,setErr]=useState('')
 useEffect(()=>{sb.from('cities').select('*').eq('is_active',true).order('sort_order').then(r=>setCities(r.data||[]))},[])
 const city=cities.find(c=>c.id===f.city),fee=city?.delivery_price||0,sub=cart.reduce((a:number,i:any)=>a+i.price*i.qty,0)
 const submit=async(e:any)=>{e.preventDefault();setBusy(true);setErr('')
  const {data,error}=await sb.rpc('create_order',{p_name:f.name,p_phone:f.phone,p_city_id:f.city,p_address:f.addr,p_items:cart.map((i:any)=>({product_id:i.id,quantity:i.qty}))})
  setBusy(false);if(error)return setErr(error.message)
  const lines=cart.map((i:any,n:number)=>`${n+1}. ${i.name}\nالكود: ${i.sku}\nالكمية: ${i.qty}\nالسعر: ${money(i.price)}`).join('\n\n')
  setDone({...data,msg:`🔔 طلب جديد\n\nرقم الطلب: #${data.order_number}\n\n👤 العميل:\n${f.name}\n\n📞 الهاتف:\n${f.phone}\n\n📍 المدينة:\n${city.name_ar}\n\n🏠 العنوان:\n${f.addr}\n\n🛒 المنتجات:\n\n${lines}\n\n💰 الإجمالي:\n${money(data.total)}`});clear()}
 if(done)return <div className="max-w-md mx-auto text-center py-20 px-4"><h1 className="text-2xl font-bold text-gold mb-3">تم استلام طلبك</h1>
  <p>رقم الطلب: <b>#{done.order_number}</b></p><p className="text-neutral-600 my-3">سنتواصل معك قريباً لتأكيد الطلب.</p>
  {s.whatsapp_number&&<a className="btn2" target="_blank" href={`https://wa.me/${s.whatsapp_number}?text=${encodeURIComponent(done.msg)}`}>إرسال الطلب عبر WhatsApp</a>}</div>
 if(!cart.length)return <p className="text-center py-24">السلة فارغة</p>
 return <form onSubmit={submit} className="max-w-xl mx-auto px-4 py-8 space-y-3"><h1 className="text-2xl font-bold mb-4">بيانات الطلب</h1>
  <input required className="inp" placeholder="الاسم الكامل" onChange={e=>setF({...f,name:e.target.value})}/>
  <input required className="inp" type="tel" placeholder="رقم الهاتف" onChange={e=>setF({...f,phone:e.target.value})}/>
  <select required className="inp" onChange={e=>setF({...f,city:e.target.value})}><option value="">اختر المدينة</option>{cities.map(c=><option key={c.id} value={c.id}>{c.name_ar}</option>)}</select>
  <textarea required className="inp" placeholder="عنوان التوصيل" onChange={e=>setF({...f,addr:e.target.value})}/>
  <div className="border p-4 text-sm space-y-1">{cart.map((i:any)=><div key={i.id} className="flex justify-between"><span>{i.name} ({i.sku}) × {i.qty}</span><span>{money(i.price*i.qty)}</span></div>)}
   <div className="flex justify-between pt-2 border-t"><span>التوصيل</span><span>{city?money(fee):'—'}</span></div><div className="flex justify-between font-bold"><span>الإجمالي</span><span>{money(sub+fee)}</span></div></div>
  <p className="text-sm text-neutral-500">طريقة الدفع: الدفع عند الاستلام</p>{err&&<p className="text-red-600 text-sm">{err}</p>}
  <button className="btn w-full" disabled={busy}>{busy?'جارٍ الإرسال...':'تأكيد الطلب'}</button></form>}
