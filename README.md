# دليل التشغيل (فولتكس)
## 1) تشغيل المشروع
`npm install` ثم انسخ `.env.example` إلى `.env.local` واملأه، ثم `npm run dev` وافتح http://localhost:3000
## 2) ربط Supabase
أنشئ مشروعاً في supabase.com ← SQL Editor ← الصق محتوى `supabase/schema.sql` ← Run. ثم Project Settings ← API: انسخ Project URL و anon key إلى `.env.local`. (لا تستخدم service_role في الواجهة أبداً.)
## 3) إنشاء حساب المدير
Authentication ← Users ← Add user (بريد وكلمة مرور، فعّل Auto Confirm). ثم في SQL Editor:
`insert into admins(user_id,email) select id,email from auth.users where email='بريدك';`
ادخل من `/admin`.
## 4) إضافة أول منتج
/admin ← المنتجات ← + إضافة ← الكود (فريد) والاسم والسعر والصورة ← حفظ.
## 5) تغيير السعر   المنتجات ← تعديل ← السعر (أو سعر التخفيض) ← حفظ.
## 6) تغيير الصورة   المنتجات ← تعديل ← اختر صورة جديدة ← حفظ (تُضغط تلقائياً WebP).
## 7) إضافة تصنيف   التصنيفات ← + إضافة.
## 8) مدينة وسعر توصيل   المدن والتوصيل ← + إضافة.
## 9) رقم WhatsApp   إعدادات المتجر ← رقم WhatsApp (مثل 218912345678) ← حفظ. (نفس الصفحة: الاسم والشعار والتواصل ومحتوى الرئيسية.)
## 10) النشر
ارفع المجلد إلى GitHub ← vercel.com ← Import ← أضف المتغيرين NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY ← Deploy.
## إشعار WhatsApp التلقائي (اختياري، يحتاج WhatsApp Business API)
1. `supabase functions deploy notify-whatsapp` و `supabase secrets set WA_TOKEN=... WA_PHONE_ID=...`
2. Database ← Webhooks ← INSERT على جدول orders ← يستدعي الدالة.
3. فعّله: `update settings set value='{"enabled":true}' where key='whatsapp_api';`
ملاحظة: Meta تشترط قالب رسالة معتمداً للرسائل خارج نافذة 24 ساعة. بدون ذلك يعمل زر WhatsApp الاحتياطي وإشعارات لوحة الإدارة الفورية.
