// Database Webhook (INSERT on public.orders) -> this function -> WhatsApp Cloud API.
// Secrets: WA_TOKEN, WA_PHONE_ID. Enable via: update settings set value='{"enabled":true}' where key='whatsapp_api';
import {createClient} from 'npm:@supabase/supabase-js@2'
Deno.serve(async(req)=>{
 const {record:o}=await req.json(),sb=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
 const {data:st}=await sb.from('settings').select('*').in('key',['whatsapp_number','whatsapp_api','currency'])
 const m:any=Object.fromEntries((st||[]).map((r:any)=>[r.key,r.value]));if(!m.whatsapp_api?.enabled)return new Response('disabled')
 const {data:it}=await sb.from('order_items').select('*').eq('order_id',o.id),c=m.currency||''
 const body=`🔔 طلب جديد\n\nرقم الطلب: #${o.order_number}\n\n👤 العميل:\n${o.customer_name}\n\n📞 الهاتف:\n${o.phone}\n\n📍 المدينة:\n${o.city_name}\n\n🏠 العنوان:\n${o.address}\n\n🛒 المنتجات:\n\n`+
  (it||[]).map((i:any,n:number)=>`${n+1}. ${i.product_name}\nالكود: ${i.sku}\nالكمية: ${i.quantity}\nالسعر: ${i.unit_price} ${c}`).join('\n\n')+`\n\n💰 الإجمالي:\n${o.total} ${c}`
 const r=await fetch(`https://graph.facebook.com/v20.0/${Deno.env.get('WA_PHONE_ID')}/messages`,{method:'POST',headers:{Authorization:`Bearer ${Deno.env.get('WA_TOKEN')}`,'Content-Type':'application/json'},
  body:JSON.stringify({messaging_product:'whatsapp',to:m.whatsapp_number,type:'text',text:{body}})})
 return new Response(await r.text(),{status:r.status})})
