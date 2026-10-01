'use client'
import {useEffect,useState} from 'react'
import {sb} from '@/lib/supabase'
import {useApp} from '@/lib/shell'
const ST:any={new:'طلب جديد',contacted:'تم التواصل مع العميل',confirmed:'تم تأكيد الطلب',preparing:'قيد التجهيز',out_for_delivery:'خرج للتوصيل',delivered:'تم التسليم',cancelled:'ملغي'}
async function upload(f:File){
 const b=await createImageBitmap(f),r=Math.min(1,1600/Math.max(b.width,b.height)),c=document.createElement('canvas');c.width=b.width*r;c.height=b.height*r
 c.getContext('2d')!.drawImage(b,0,0,c.width,c.height)
 const blob:Blob=await new Promise(res=>c.toBlob(x=>res(x!),'image/webp',0.82)),n=Date.now()+'.webp'
 const {error}=await sb.storage.from('store-images').upload(n,blob,{contentType:'image/webp'});if(error)throw error
 return sb.storage.from('store-images').getPublicUrl(n).data.publicUrl}
function Crud({table,fields,order,cols}:any){
 const [rows,setRows]=useState<any[]>([]),[f,setF]=useState<any>(null)
 const load=()=>sb.from(table).select('*').order(order).then(({data})=>setRows(data||[]))
 useEffect(()=>{load()},[])
 const save=async()=>{const o:any={};fields.forEach((x:any)=>{let v=f[x.k];if(x.t==='number')v=v===''||v==null?null:Number(v);else if(x.t==='bool')v=!!v;else if(v==='')v=null;o[x.k]=v??null})
  const {error}=f.id?await sb.from(table).update(o).eq('id',f.id):await sb.from(table).insert(o);if(error)return alert(error.message);setF(null);load()}
 const del=async(id:string)=>{if(confirm('حذف نهائي؟')){const {error}=await sb.from(table).delete().eq('id',id);if(error)alert(error.message);load()}}
 if(f)return <div className="space-y-3 max-w-xl">{fields.map((x:any)=><label key={x.k} className="block text-sm">{x.l}
  {x.t==='bool'?<input type="checkbox" className="mr-2" checked={!!f[x.k]} onChange={e=>setF({...f,[x.k]:e.target.checked})}/>
  :x.t==='image'?<div><input type="file" accept="image/*" onChange={async e=>{const fl=e.target.files?.[0];if(fl)try{setF({...f,[x.k]:await upload(fl)})}catch(er:any){alert(er.message)}}}/>{f[x.k]&&<img src={f[x.k]} className="h-20 mt-1"/>}</div>
  :x.t==='select'?<select className="inp" value={f[x.k]||''} onChange={e=>setF({...f,[x.k]:e.target.value})}><option value="">—</option>{x.o.map((c:any)=><option key={c.id} value={c.id}>{c.name_ar}</option>)}</select>
  :x.t==='area'?<textarea className="inp" value={f[x.k]||''} onChange={e=>setF({...f,[x.k]:e.target.value})}/>
  :<input className="inp" type={x.t==='number'?'number':'text'} value={f[x.k]??''} onChange={e=>setF({...f,[x.k]:e.target.value})}/>}</label>)}
  <div className="flex gap-2"><button className="btn" onClick={save}>حفظ</button><button className="btn2" onClick={()=>setF(null)}>إلغاء</button></div></div>
 return <div><button className="btn mb-4" onClick={()=>setF({is_active:true})}>+ إضافة</button>
  {rows.map(r=><div key={r.id} className="flex items-center gap-3 border-b py-2 text-sm">{r.main_image_url&&<img src={r.main_image_url} className="w-10 h-10 object-cover"/>}
   <span className="flex-1">{cols.map((c:string)=>r[c]).join(' — ')}{r.is_active===false&&' (مخفي)'}</span>
   {'is_active' in r&&<button className="underline" onClick={async()=>{await sb.from(table).update({is_active:!r.is_active}).eq('id',r.id);load()}}>{r.is_active?'إخفاء':'إظهار'}</button>}
   <button className="underline" onClick={()=>setF(r)}>تعديل</button><button className="text-red-600 underline" onClick={()=>del(r.id)}>حذف</button></div>)}</div>}
const PF=[{k:'sku',l:'كود المنتج SKU (فريد)'},{k:'name_ar',l:'الاسم'},{k:'description_ar',l:'الوصف',t:'area'},{k:'main_image_url',l:'الصورة الرئيسية',t:'image'},{k:'price',l:'السعر',t:'number'},{k:'old_price',l:'السعر القديم',t:'number'},{k:'sale_price',l:'سعر التخفيض',t:'number'},{k:'stock',l:'الكمية المتوفرة (اتركها فارغة لعدم التتبع)',t:'number'},{k:'light_type',l:'نوع الإضاءة'},{k:'light_color',l:'لون الإضاءة'},{k:'material',l:'الخامة'},{k:'bulb_count',l:'عدد اللمبات',t:'number'},{k:'bulb_base',l:'نوع القاعدة'},{k:'dimensions',l:'الأبعاد'},{k:'is_active',l:'ظاهر',t:'bool'},{k:'is_new',l:'جديد',t:'bool'},{k:'is_bestseller',l:'الأكثر مبيعاً',t:'bool'},{k:'is_offer',l:'عرض',t:'bool'},{k:'is_featured',l:'مميز',t:'bool'},{k:'is_out_of_stock',l:'غير متوفر',t:'bool'}]
function Products(){const [cats,setCats]=useState<any[]>([]);useEffect(()=>{sb.from('categories').select('id,name_ar').then(r=>setCats(r.data||[]))},[])
 return <Crud table="products" order="created_at" cols={['sku','name_ar','price']} fields={[...PF,{k:'category_id',l:'التصنيف',t:'select',o:cats}]}/>}
function Settings(){
 const {s,setS}=useApp(),K:[string,string?][]=[['store_name'],['store_tagline'],['logo_url'],['whatsapp_number'],['contact_phone'],['contact_address'],['currency'],['hero','title'],['hero','subtitle'],['hero','image_url']]
 const L:any={store_name:'اسم المتجر',store_tagline:'الوصف تحت الاسم',logo_url:'الشعار',whatsapp_number:'رقم WhatsApp (بصيغة دولية بدون +)',contact_phone:'هاتف التواصل',contact_address:'العنوان',currency:'العملة',title:'عنوان الصفحة الرئيسية',subtitle:'نص فرعي',image_url:'صورة الغلاف'}
 const [v,setV]=useState<any>(s);useEffect(()=>setV(s),[s])
 const get=(k:string,sub?:string)=>sub?(v[k]||{})[sub]||'':v[k]||'',set=(k:string,x:string,sub?:string)=>setV({...v,[k]:sub?{...(v[k]||{}),[sub]:x}:x})
 const save=async()=>{for(const k of Array.from(new Set(K.map(x=>x[0])))){const {error}=await sb.from('settings').upsert({key:k,value:v[k]??null});if(error)return alert(error.message)};setS(v);alert('تم الحفظ')}
 return <div className="space-y-3 max-w-xl">{K.map(([k,sub])=>{const n=sub||k,img=n==='logo_url'||n==='image_url'
  return <label key={k+sub} className="block text-sm">{L[n]}{img?<div><input type="file" accept="image/*" onChange={async e=>{const fl=e.target.files?.[0];if(fl)try{set(k,await upload(fl),sub)}catch(er:any){alert(er.message)}}}/>{get(k,sub)&&<img src={get(k,sub)} className="h-16 mt-1"/>}</div>
   :<input className="inp" value={get(k,sub)} onChange={e=>set(k,e.target.value,sub)}/>}</label>})}<button className="btn" onClick={save}>حفظ الإعدادات</button></div>}
function Orders(){
 const {money}=useApp(),[os,setOs]=useState<any[]>([]),[open,setOpen]=useState(''),[range,setRange]=useState('all'),[from,setFrom]=useState(''),[to,setTo]=useState(''),[toast,setToast]=useState('')
 const load=()=>sb.from('orders').select('*,order_items(*)').order('created_at',{ascending:false}).then(({data})=>setOs(data||[]))
 useEffect(()=>{load();const ch=sb.channel('o').on('postgres_changes',{event:'INSERT',schema:'public',table:'orders'},(p:any)=>{setToast('🔔 طلب جديد '+p.new.order_number);load()}).subscribe();return()=>{sb.removeChannel(ch)}},[])
 const now=new Date(),d0=new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime()
 const list=os.filter(o=>{const t=new Date(o.created_at).getTime();if(from||to)return(!from||t>=new Date(from).getTime())&&(!to||t<=new Date(to).getTime()+864e5);
  return range==='today'?t>=d0:range==='week'?t>=d0-6*864e5:range==='month'?t>=d0-29*864e5:true})
 const live=list.filter(o=>o.status!=='cancelled'),cnt=(f:(s:string)=>boolean)=>list.filter(o=>f(o.status)).length
 const top:any={};live.forEach(o=>o.order_items.forEach((i:any)=>top[i.product_name]=(top[i.product_name]||0)+i.quantity))
 const stats:[string,any][]=[['إجمالي الطلبات',list.length],['طلبات اليوم',os.filter(o=>new Date(o.created_at).getTime()>=d0).length],['قيد التنفيذ',cnt(s=>!['delivered','cancelled'].includes(s))],['مكتملة',cnt(s=>s==='delivered')],['ملغاة',cnt(s=>s==='cancelled')],['إجمالي المبيعات',money(live.reduce((a,o)=>a+Number(o.total),0))]]
 const print=(o:any)=>{const w=window.open('','_blank')!;w.document.write(`<html dir="rtl"><body style="font-family:sans-serif"><h2>فاتورة #${o.order_number}</h2><p>${o.customer_name} — ${o.phone}<br>${o.city_name} — ${o.address}</p><table border="1" cellpadding="6" style="border-collapse:collapse;width:100%"><tr><th>المنتج</th><th>الكود</th><th>الكمية</th><th>السعر</th><th>المجموع</th></tr>${o.order_items.map((i:any)=>`<tr><td>${i.product_name}</td><td>${i.sku}</td><td>${i.quantity}</td><td>${i.unit_price}</td><td>${i.subtotal}</td></tr>`).join('')}</table><p>التوصيل: ${o.delivery_fee}<br><b>الإجمالي: ${o.total}</b></p></body></html>`);w.document.close();w.print()}
 return <div>{toast&&<div className="bg-gold text-white p-3 mb-4 cursor-pointer" onClick={()=>setToast('')}>{toast}</div>}
  <div className="flex flex-wrap gap-2 mb-4 text-sm">{[['all','الكل'],['today','اليوم'],['week','الأسبوع'],['month','الشهر']].map(([k,l])=><button key={k} className={range===k&&!from&&!to?'btn':'btn2'} onClick={()=>{setRange(k);setFrom('');setTo('')}}>{l}</button>)}
   <input type="date" className="inp !w-auto" value={from} onChange={e=>setFrom(e.target.value)}/><input type="date" className="inp !w-auto" value={to} onChange={e=>setTo(e.target.value)}/></div>
  <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-6">{stats.map(([k,v])=><div key={k} className="border p-3"><div className="text-xs text-neutral-500">{k}</div><div className="font-bold">{v}</div></div>)}</div>
  <p className="text-sm mb-4"><b>الأكثر طلباً:</b> {Object.entries(top).sort((a:any,b:any)=>b[1]-a[1]).slice(0,5).map(([k,v])=>`${k} (${v})`).join('، ')||'—'}</p>
  {list.map(o=><div key={o.id} className="border-b py-3 text-sm"><div className="flex flex-wrap gap-3 items-center cursor-pointer" onClick={()=>setOpen(open===o.id?'':o.id)}>
   <b>#{o.order_number}</b><span>{o.customer_name}</span><span>{o.phone}</span><span>{o.city_name}</span><span>{money(o.total)}</span><span>{new Date(o.created_at).toLocaleDateString('ar')}</span>
   <select className="inp !w-auto" value={o.status} onClick={e=>e.stopPropagation()} onChange={async e=>{await sb.from('orders').update({status:e.target.value}).eq('id',o.id);load()}}>{Object.keys(ST).map(k=><option key={k} value={k}>{ST[k]}</option>)}</select></div>
   {open===o.id&&<div className="bg-neutral-50 p-3 mt-2 space-y-1"><div>العنوان: {o.address}</div>{o.order_items.map((i:any)=><div key={i.id}>{i.product_name} ({i.sku}) × {i.quantity} = {money(i.subtotal)}</div>)}<div>التوصيل: {money(o.delivery_fee)}</div>
    <div className="flex gap-3 pt-2"><a className="underline" href={'tel:'+o.phone}>اتصال</a><a className="underline" target="_blank" href={'https://wa.me/'+o.phone.replace(/\D/g,'')}>WhatsApp للعميل</a><button className="underline" onClick={()=>navigator.clipboard.writeText(o.phone)}>نسخ الرقم</button><button className="underline" onClick={()=>print(o)}>طباعة الطلب / الفاتورة</button></div></div>}</div>)}</div>}
export default function Admin(){
 const [st,setSt]=useState('load'),[tab,setTab]=useState('orders'),[em,setEm]=useState(''),[pw,setPw]=useState(''),[err,setErr]=useState('')
 const check=async()=>{const {data:{session}}=await sb.auth.getSession();if(!session)return setSt('login');const {data}=await sb.from('admins').select('user_id').maybeSingle();setSt(data?'ok':'no')}
 useEffect(()=>{check()},[])
 if(st==='load')return <p className="p-20 text-center">...</p>
 if(st==='login'||st==='no')return <div className="max-w-sm mx-auto py-24 px-4 space-y-3"><h1 className="text-xl font-bold">دخول الإدارة</h1>
  {st==='no'&&<p className="text-red-600 text-sm">هذا الحساب ليس مدير متجر.</p>}<input className="inp" placeholder="البريد" onChange={e=>setEm(e.target.value)}/><input className="inp" type="password" placeholder="كلمة المرور" onChange={e=>setPw(e.target.value)}/>
  {err&&<p className="text-red-600 text-sm">{err}</p>}<button className="btn w-full" onClick={async()=>{await sb.auth.signOut();const {error}=await sb.auth.signInWithPassword({email:em,password:pw});if(error)return setErr(error.message);check()}}>دخول</button></div>
 const T:[string,string][]=[['orders','الطلبات'],['products','المنتجات'],['categories','التصنيفات'],['cities','المدن والتوصيل'],['settings','إعدادات المتجر']]
 return <div className="max-w-6xl mx-auto px-4 py-6"><div className="flex gap-2 flex-wrap mb-6">{T.map(([k,l])=><button key={k} className={tab===k?'btn':'btn2'} onClick={()=>setTab(k)}>{l}</button>)}
  <button className="btn2 mr-auto" onClick={async()=>{await sb.auth.signOut();setSt('login')}}>خروج</button></div>
  {tab==='orders'&&<Orders/>}{tab==='products'&&<Products/>}
  {tab==='categories'&&<Crud table="categories" order="sort_order" cols={['name_ar','slug']} fields={[{k:'name_ar',l:'الاسم'},{k:'slug',l:'الرابط (إنجليزي، فريد)'},{k:'sort_order',l:'الترتيب',t:'number'},{k:'is_active',l:'ظاهر',t:'bool'}]}/>}
  {tab==='cities'&&<Crud table="cities" order="sort_order" cols={['name_ar','delivery_price']} fields={[{k:'name_ar',l:'المدينة'},{k:'delivery_price',l:'سعر التوصيل',t:'number'},{k:'sort_order',l:'الترتيب',t:'number'},{k:'is_active',l:'ظاهرة',t:'bool'}]}/>}
  {tab==='settings'&&<Settings/>}</div>}
