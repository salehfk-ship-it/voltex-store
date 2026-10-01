import './globals.css'
import {Tajawal} from 'next/font/google'
import {Shell} from '@/lib/shell'
const f=Tajawal({subsets:['arabic','latin'],weight:['400','500','700']})
export const metadata={title:'فولتكس للإضاءة الحديثة'}
export default function L({children}:{children:React.ReactNode}){
 return <html lang="ar" dir="rtl"><body className={f.className+' bg-white text-neutral-900'}><Shell>{children}</Shell></body></html>}
