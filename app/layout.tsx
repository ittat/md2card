import type {Metadata} from 'next';
import { Plus_Jakarta_Sans, Noto_Serif_SC, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

const notoSerifSC = Noto_Serif_SC({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-serif',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'MD2Card — 小红书/抖音 Markdown 图文卡片工坊',
  description: '将 Markdown 实时转化为严格符合小红书 (3:4)、抖音图文 (9:16) 尺寸规范的多张高颜值视觉卡片，支持智能/手动分页、底纹与边框图层定制、自定义模板及批量高清导出。',
  openGraph: {
    title: 'MD2Card — 小红书/抖音 Markdown 图文卡片工坊',
    description: '将 Markdown 实时转化为严格符合小红书 (3:4)、抖音图文 (9:16) 尺寸规范的多张高颜值视觉卡片，支持智能/手动分页、底纹与边框图层定制、自定义模板及批量高清导出。',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MD2Card — 小红书/抖音 Markdown 图文卡片工坊',
    description: '将 Markdown 实时转化为严格符合小红书 (3:4)、抖音图文 (9:16) 尺寸规范的多张高颜值视觉卡片，支持智能/手动分页、底纹与边框图层定制、自定义模板及批量高清导出。',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="zh-CN" className={`${plusJakarta.variable} ${notoSerifSC.variable} ${jetbrainsMono.variable}`}>
      <body suppressHydrationWarning className="font-sans antialiased bg-[#F7F6F2] text-stone-900 selection:bg-rose-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
