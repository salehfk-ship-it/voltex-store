'use client'
import {useEffect,useState} from 'react'
import {sb} from '@/lib/supabase'
import {useApp} from '@/lib/shell'
const ST:any={new:'طلب جديد',contacted:'تم التواصل مع العميل',confirmed:'تم تأكيد الطلب',preparing:'قيد التجهيز',out_for_delivery:'خرج للتوصيل',delivered:'تم التوصيل',cancelled:'ملغي'}
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
   :x.t==='image'?<div><input type="file" accept="image/*" onChange={async e=>{const fl=e.target.files?.[0];if(fl)try{setF({...f,[x.k]:await upload(fl)})}catch(er:any){alert(er.message)}}}/>{f[x.k]&&<img src={f[x.k]} className="mt-2 h-20 w-20 object-cover"/>}</div>
   :x.t==='select'?<select className="inp" value={f[x.k]||''} onChange={e=>setF({...f,[x.k]:e.target.value})}><option value="">—</option>{x.o.map((c:any)=><option key={c.id} value={c.id}>{c.name_ar||c.name_en||c.label||c.slug}</option>)}</select>
   :x.t==='area'?<textarea className="inp" value={f[x.k]||''} onChange={e=>setF({...f,[x.k]:e.target.value})}/>
   :<input className="inp" type={x.t==='number'?'number':'text'} value={f[x.k]??''} onChange={e=>setF({...f,[x.k]:e.target.value})}/>}</label>)}
   <div className="flex gap-2"><button className="btn" onClick={save}>حفظ</button><button className="btn2" onClick={()=>setF(null)}>إلغاء</button></div></div>
  return <div><button className="btn mb-4" onClick={()=>setF({is_active:true})}>+ إضافة</button>
   {rows.map(r=><div key={r.id} className="flex items-center gap-3 border-b py-2 text-sm">{r.main_image_url&&<img src={r.main_image_url} className="w-10 h-10 object-cover"/>}
    <span className="flex-1">{cols.map((c:string)=>r[c]).join(' — ')}{r.is_active===false&&' (مخفي)'}</span>
    {'is_active' in r&&<button className="underline" onClick={async()=>{await sb.from(table).update({is_active:!r.is_active}).eq('id',r.id);load()}}>{r.is_active?'إخفاء':'إظهار'}</button>}
    <button className="underline" onClick={()=>setF(r)}>تعديل</button><button className="text-red-600 underline" onClick={()=>del(r.id)}>حذف</button></div>)}</div>
}
const PF=[{k:'sku',l:'كود المنتج SKU (فريد)'},{k:'name_ar',l:'الاسم'},{k:'description_ar',l:'الوصف',t:'area'},{k:'main_image_url',l:'الصورة الرئيسية',t:'image'},{k:'price',l:'السعر',t:'number'},{k:'old_price',l:'السعر القديم',t:'number'},{k:'sale_price',l:'سعر الخصم',t:'number'},{k:'stock',l:'المخزون',t:'number'},{k:'light_type',l:'نوع الإضاءة'},{k:'light_color',l:'لون الإضاءة'},{k:'material',l:'الخامة'},{k:'bulb_count',l:'عدد اللمبات',t:'number'},{k:'bulb_base',l:'نوع القاعدة'},{k:'dimensions',l:'الأبعاد'},{k:'is_active',l:'معروض',t:'bool'},{k:'is_new',l:'جديد',t:'bool'},{k:'is_featured',l:'مميز',t:'bool'},{k:'is_offer',l:'عرض',t:'bool'},{k:'is_bestseller',l:'الأكثر مبيعاً',t:'bool'}]
async function saveProductImages(productId:string,urls:string[]){
  if(!productId) return
  await sb.from('product_images').delete().eq('product_id',productId)
  if(!urls.length) return
  const rows=urls.map((url,index)=>({product_id:productId,url,sort_order:index}))
  const {error}=await sb.from('product_images').insert(rows)
  if(error) throw error
}
function Products(){
  const [cats,setCats]=useState<any[]>([]),[rows,setRows]=useState<any[]>([]),[form,setForm]=useState<any>(null),[busy,setBusy]=useState(false)
  const load=()=>{sb.from('products').select('*').order('created_at',{ascending:false}).then(({data})=>setRows(data||[]))}
  useEffect(()=>{load();sb.from('categories').select('id,name_ar').then(({data})=>setCats(data||[]))},[])
  const openNew=()=>setForm({sku:'',name_ar:'',description_ar:'',main_image_url:'',price:'',old_price:'',sale_price:'',stock:'',light_type:'',light_color:'',material:'',bulb_count:'',bulb_base:'',dimensions:'',category_id:'',is_active:true,is_new:false,is_featured:false,is_offer:false,is_bestseller:false,product_images:[]})
  const openEdit=async(r:any)=>{const {data}=await sb.from('product_images').select('url').eq('product_id',r.id).order('sort_order');setForm({...r,product_images:(data||[]).map((x:any)=>x.url)})}
  const save=async()=>{
    if(!form)return
    setBusy(true)
    try{
      const o:any={
        sku:form.sku||'',name_ar:form.name_ar||'',description_ar:form.description_ar||'',main_image_url:form.main_image_url||null,
        price:form.price===''||form.price==null?null:Number(form.price),old_price:form.old_price===''||form.old_price==null?null:Number(form.old_price),
        sale_price:form.sale_price===''||form.sale_price==null?null:Number(form.sale_price),stock:form.stock===''||form.stock==null?null:Number(form.stock),
        light_type:form.light_type||null,light_color:form.light_color||null,material:form.material||null,bulb_count:form.bulb_count===''||form.bulb_count==null?null:Number(form.bulb_count),
        bulb_base:form.bulb_base||null,dimensions:form.dimensions||null,category_id:form.category_id||null,is_active:!!form.is_active,
        is_new:!!form.is_new,is_featured:!!form.is_featured,is_offer:!!form.is_offer,is_bestseller:!!form.is_bestseller
      }
      let productId=form.id
      if(productId){
        const {error}=await sb.from('products').update(o).eq('id',productId);if(error)throw error
      }else{
        const {data,error}=await sb.from('products').insert(o).select('id').single();if(error)throw error;productId=data.id
      }
      await saveProductImages(productId,(form.product_images||[]).filter(Boolean))
      setForm(null);load()
    }catch(er:any){alert(er.message||'حدث خطأ أثناء حفظ المنتج')}
    finally{setBusy(false)}
  }
  const del=async(id:string)=>{if(!confirm('حذف المنتج نهائياً؟'))return;const {error}=await sb.from('products').delete().eq('id',id);if(error)return alert(error.message);await sb.from('product_images').delete().eq('product_id',id);load()}
  const uploadFiles=async(e:any)=>{const files=[...e.target.files||[]];if(!files.length)return;const urls=[];for(const file of files){const url=await upload(file);urls.push(url)};setForm({...form,product_images:[...(form.product_images||[]),...urls]})}
  const removeExtra=(url:string)=>setForm({...form,product_images:(form.product_images||[]).filter((x:string)=>x!==url)})
  if(form)return <div className="space-y-4 max-w-2xl">
    <div className="grid md:grid-cols-2 gap-3">
      <label className="block text-sm">كود المنتج SKU<input className="inp" value={form.sku||''} onChange={e=>setForm({...form,sku:e.target.value})}/></label>
      <label className="block text-sm">التصنيف<select className="inp" value={form.category_id||''} onChange={e=>setForm({...form,category_id:e.target.value})}><option value="">—</option>{cats.map(c=><option key={c.id} value={c.id}>{c.name_ar}</option>)}</select></label>
      <label className="block text-sm md:col-span-2">الاسم<input className="inp" value={form.name_ar||''} onChange={e=>setForm({...form,name_ar:e.target.value})}/></label>
      <label className="block text-sm md:col-span-2">الوصف<textarea className="inp" rows={4} value={form.description_ar||''} onChange={e=>setForm({...form,description_ar:e.target.value})}/></label>
      <label className="block text-sm">السعر<input className="inp" type="number" value={form.price ?? ''} onChange={e=>setForm({...form,price:e.target.value})}/></label>
      <label className="block text-sm">السعر القديم<input className="inp" type="number" value={form.old_price ?? ''} onChange={e=>setForm({...form,old_price:e.target.value})}/></label>
      <label className="block text-sm">سعر الخصم<input className="inp" type="number" value={form.sale_price ?? ''} onChange={e=>setForm({...form,sale_price:e.target.value})}/></label>
      <label className="block text-sm">المخزون<input className="inp" type="number" value={form.stock ?? ''} onChange={e=>setForm({...form,stock:e.target.value})}/></label>
      <label className="block text-sm">نوع الإضاءة<input className="inp" value={form.light_type||''} onChange={e=>setForm({...form,light_type:e.target.value})}/></label>
      <label className="block text-sm">لون الإضاءة<input className="inp" value={form.light_color||''} onChange={e=>setForm({...form,light_color:e.target.value})}/></label>
      <label className="block text-sm">الخامة<input className="inp" value={form.material||''} onChange={e=>setForm({...form,material:e.target.value})}/></label>
      <label className="block text-sm">عدد اللمبات<input className="inp" type="number" value={form.bulb_count ?? ''} onChange={e=>setForm({...form,bulb_count:e.target.value})}/></label>
      <label className="block text-sm">نوع القاعدة<input className="inp" value={form.bulb_base||''} onChange={e=>setForm({...form,bulb_base:e.target.value})}/></label>
      <label className="block text-sm md:col-span-2">الأبعاد<input className="inp" value={form.dimensions||''} onChange={e=>setForm({...form,dimensions:e.target.value})}/></label>
    </div>
    <div className="space-y-3 border rounded p-3">
      <div className="font-semibold">الصورة الرئيسية</div>
      <input type="file" accept="image/*" onChange={async e=>{const fl=e.target.files?.[0];if(!fl)return;try{const url=await upload(fl);setForm({...form,main_image_url:url})}catch(er:any){alert(er.message)}}} />
      {form.main_image_url&&<img src={form.main_image_url} className="h-32 w-32 object-cover rounded" />}
    </div>
    <div className="space-y-3 border rounded p-3">
      <div className="font-semibold">صور المنتج الإضافية</div>
      <input type="file" accept="image/*" multiple onChange={uploadFiles}/>
      <div className="flex flex-wrap gap-2">{(form.product_images||[]).map((url:string)=><div key={url} className="relative"><img src={url} className="h-20 w-20 object-cover rounded border"/><button type="button" className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs" onClick={()=>removeExtra(url)}>×</button></div>)}</div>
    </div>
    <div className="flex flex-wrap gap-3">
      <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={!!form.is_active} onChange={e=>setForm({...form,is_active:e.target.checked})}/> معروض</label>
      <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={!!form.is_new} onChange={e=>setForm({...form,is_new:e.target.checked})}/> جديد</label>
      <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={!!form.is_featured} onChange={e=>setForm({...form,is_featured:e.target.checked})}/> مميز</label>
      <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={!!form.is_offer} onChange={e=>setForm({...form,is_offer:e.target.checked})}/> عرض</label>
      <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={!!form.is_bestseller} onChange={e=>setForm({...form,is_bestseller:e.target.checked})}/> الأكثر مبيعاً</label>
    </div>
    <div className="flex gap-2"><button className="btn" onClick={save} disabled={busy}>{busy?'جارٍ الحفظ...':'حفظ المنتج'}</button><button className="btn2" onClick={()=>setForm(null)}>إلغاء</button></div>
  </div>
  return <div>
    <button className="btn mb-4" onClick={openNew}>+ إضافة منتج</button>
    <div className="space-y-2">{rows.map(r=><div key={r.id} className="flex items-center gap-3 border-b py-2 text-sm">
      {r.main_image_url&&<img src={r.main_image_url} className="w-12 h-12 object-cover rounded"/>}
      <div className="flex-1"><div className="font-semibold">{r.name_ar}</div><div className="text-neutral-500">{r.sku} — {r.price} د.ل</div></div>
      <button className="underline" onClick={()=>openEdit(r)}>تعديل</button>
      <button className="text-red-600 underline" onClick={()=>del(r.id)}>حذف</button>
    </div>)}</div>
  </div>
}
function Settings(){
  const {s,setS}=useApp(),K:[string,string?][]=[['store_name'],['store_tagline'],['logo_url'],['whatsapp_number'],['contact_phone'],['contact_address'],['currency'],['hero','title'],['hero','subtitle'],['hero','image_url']]
  const L:any={store_name:'اسم المتجر',store_tagline:'الوصف تحت الاسم',logo_url:'الشعار',whatsapp_number:'رقم WhatsApp (بصيغة دولية بدون +)',contact_phone:'رقم التواصل',contact_address:'العنوان',currency:'العملة',title:'عنوان الشريحة الرئيسية',subtitle:'نص الشريحة الرئيسية',image_url:'صورة الشريحة الرئيسية'}
  const [v,setV]=useState<any>(s);useEffect(()=>setV(s),[s])
  const get=(k:string,sub?:string)=>sub?(v[k]||{})[sub]||'':v[k]||'',set=(k:string,x:string,sub?:string)=>setV({...v,[k]:sub?{...(v[k]||{}),[sub]:x}:x})
  const save=async()=>{for(const k of Array.from(new Set(K.map(x=>x[0])))){const {error}=await sb.from('settings').upsert({key:k,value:v[k]??null});if(error)return alert(error.message)};setS(v);alert('تم حفظ الإعدادات')}
  return <div className="space-y-3 max-w-xl">{K.map(([k,sub])=>{const n=sub||k,img=n==='logo_url'||n==='image_url'
   return <label key={k+sub} className="block text-sm">{L[n]}{img?<div><input type="file" accept="image/*" onChange={async e=>{const fl=e.target.files?.[0];if(fl)try{set(k,await upload(fl),sub)}catch(er:any){alert(er.message)}}}/>{get(k,sub)&&<img src={get(k,sub)} className="mt-2 h-20 w-20 object-cover"/>}</div>
    :<input className="inp" value={get(k,sub)} onChange={e=>set(k,e.target.value,sub)}/>}</label>})}<button className="btn" onClick={save}>حفظ الإعدادات</button></div>
}
function Orders(){
  const {money}=useApp(),[os,setOs]=useState<any[]>([]),[open,setOpen]=useState(''),[range,setRange]=useState('all'),[from,setFrom]=useState(''),[to,setTo]=useState(''),[toast,setToast]=useState('')
  const load=()=>sb.from('orders').select('*,order_items(*)').order('created_at',{ascending:false}).then(({data})=>setOs(data||[]))
  useEffect(()=>{load();const ch=sb.channel('o').on('postgres_changes',{event:'INSERT',schema:'public',table:'orders'},(p:any)=>{setToast('🔔 طلب جديد '+p.new.order_number);load()}).subscribe();return ()=>{sb.removeChannel(ch)}},[])
  const now=new Date(),d0=new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime(),list=os.filter(o=>{const t=new Date(o.created_at).getTime();if(from||to)return(!from||t>=new Date(from).getTime())&&(!to||t<=new Date(to).getTime()+864e5);return range==='today'?t>=d0:range==='week'?t>=d0-6*864e5:range==='month'?t>=d0-29*864e5:true})
  const live=list.filter(o=>o.status!=='cancelled'),cnt=(f:(s:string)=>boolean)=>list.filter(o=>f(o.status)).length,top:any={};live.forEach(o=>o.order_items.forEach((i:any)=>top[i.product_name]=(top[i.product_name]||0)+i.quantity))
  const stats:[string,any][]=[['إجمالي الطلبات',list.length],['طلبات اليوم',os.filter(o=>new Date(o.created_at).getTime()>=d0).length],['قيد التنفيذ',cnt(s=>!['delivered','cancelled'].includes(s))],['مكتملة',cnt(s=>s==='delivered')],['ملغية',cnt(s=>s==='cancelled')],['إجمالي المبالغ',money(list.reduce((a,o)=>a+(Number(o.total)||0),0))]]
  const print=(o:any)=>{const w=window.open('','_blank')!;w.document.write(`<html dir="rtl"><body style="font-family:sans-serif"><h2>فاتورة #${o.order_number}</h2><p>${o.customer_name} — ${o.phone}</p><p>${o.city_name}</p>${o.order_items.map((i:any)=>`<div>${i.product_name} × ${i.quantity} = ${money(i.subtotal)}</div>`).join('')}<h3>الإجمالي: ${money(o.total)}</h3></body></html>`);w.document.close()}
  return <div>{toast&&<div className="bg-gold text-white p-3 mb-4 cursor-pointer" onClick={()=>setToast('')}>{toast}</div>}
   <div className="flex flex-wrap gap-2 mb-4 text-sm">{[['all','الكل'],['today','اليوم'],['week','الأسبوع'],['month','الشهر']].map(([k,l])=><button key={k} className={range===k?'btn':'btn2'} onClick={()=>setRange(k)}>{l}</button>)}<input type="date" className="inp !w-auto" value={from} onChange={e=>setFrom(e.target.value)}/><input type="date" className="inp !w-auto" value={to} onChange={e=>setTo(e.target.value)}/></div>
   <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-6">{stats.map(([k,v])=><div key={k} className="border p-3"><div className="text-xs text-neutral-500">{k}</div><div className="font-bold">{v}</div></div>)}</div>
   <p className="text-sm mb-4"><b>الأكثر طلباً:</b> {Object.entries(top).sort((a:any,b:any)=>b[1]-a[1]).slice(0,5).map(([k,v])=>`${k} (${v})`).join('، ')||'—'}</p>
   {list.map(o=><div key={o.id} className="border-b py-3 text-sm"><div className="flex flex-wrap gap-3 items-center cursor-pointer" onClick={()=>setOpen(open===o.id?'':o.id)}><b>#{o.order_number}</b><span>{o.customer_name}</span><span>{o.phone}</span><span>{o.city_name}</span><span>{money(o.total)}</span><span>{new Date(o.created_at).toLocaleDateString('ar')}</span><select className="inp !w-auto" value={o.status} onClick={e=>e.stopPropagation()} onChange={async e=>{await sb.from('orders').update({status:e.target.value}).eq('id',o.id);load()}}>{Object.keys(ST).map(k=><option key={k} value={k}>{ST[k]}</option>)}</select></div>
    {open===o.id&&<div className="bg-neutral-50 p-3 mt-2 space-y-1"><div>العنوان: {o.address}</div>{o.order_items.map((i:any)=><div key={i.id}>{i.product_name} ({i.sku}) × {i.quantity} = {money(i.subtotal)}</div>)}<div className="flex gap-3 pt-2"><a className="underline" href={'tel:'+o.phone}>اتصال</a><a className="underline" target="_blank" href={'https://wa.me/'+o.phone.replace(/\D/g,'')}>WhatsApp</a><button className="underline" onClick={()=>print(o)}>طباعة</button></div></div>}</div>)}
  </div>
}
export default function Admin(){
  const [st,setSt]=useState('load'),[tab,setTab]=useState('orders'),[em,setEm]=useState(''),[pw,setPw]=useState(''),[err,setErr]=useState('')
  const check=async()=>{const {data:{session}}=await sb.auth.getSession();if(!session)return setSt('login');const {data}=await sb.from('admins').select('user_id').maybeSingle();setSt(data?'ok':'no')}
  useEffect(()=>{check()},[])
  if(st==='load')return <p className="p-20 text-center">جارٍ التحميل...</p>
  if(st==='login'||st==='no')return <div className="max-w-sm mx-auto py-24 px-4 space-y-3"><h1 className="text-xl font-bold">دخول الإدارة</h1>
   {st==='no'&&<p className="text-red-600 text-sm">هذا الحساب ليس مدير متجر.</p>}<input className="inp" placeholder="البريد" onChange={e=>setEm(e.target.value)}/><input className="inp" type="password" placeholder="كلمة المرور" onChange={e=>setPw(e.target.value)}/>
   {err&&<p className="text-red-600 text-sm">{err}</p>}<button className="btn w-full" onClick={async()=>{await sb.auth.signOut();const {error}=await sb.auth.signInWithPassword({email:em,password:pw});if(error)return setErr(error.message);check()}}>دخول</button></div>
  const T:[string,string][]=[['orders','الطلبات'],['products','المنتجات'],['categories','التصنيفات'],['cities','المدن والتوصيل'],['settings','إعدادات المتجر']]
  return <div className="max-w-6xl mx-auto px-4 py-6"><div className="flex gap-2 flex-wrap mb-6">{T.map(([k,l])=><button key={k} className={tab===k?'btn':'btn2'} onClick={()=>setTab(k)}>{l}</button>)}<button className="btn2 mr-auto" onClick={async()=>{await sb.auth.signOut();setSt('login')}}>خروج</button></div>
   {tab==='orders'&&<Orders/>}{tab==='products'&&<Products/>}{tab==='categories'&&<Crud table="categories" order="sort_order" cols={['name_ar','slug']} fields={[{k:'name_ar',l:'الاسم'},{k:'slug',l:'الرابط (إنجليزي، فريد)'},{k:'sort_order',l:'ترتيب',t:'number'},{k:'image_url',l:'صورة',t:'image'},{k:'is_active',l:'نشط',t:'bool'}]}/>} {tab==='cities'&&<Crud table="cities" order="sort_order" cols={['name_ar','delivery_price']} fields={[{k:'name_ar',l:'المدينة'},{k:'delivery_price',l:'سعر التوصيل',t:'number'},{k:'sort_order',l:'الترتيب',t:'number'},{k:'is_active',l:'نشط',t:'bool'}]}/>}{tab==='settings'&&<Settings/>}</div>
}
