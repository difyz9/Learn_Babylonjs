import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="zh-CN">
      <Head>
        {/* 预加载关键资源 */}
        <link
          rel="preload"
          href="https://cdn.babylonjs.com/babylon.js"
          as="script"
          crossOrigin="anonymous"
        />
        
        {/* Meta 标签 */}
        <meta name="description" content="Babylon.js + Next.js 3D Web 应用示例" />
        <meta name="keywords" content="babylonjs, nextjs, 3d, webgl, react" />
        <meta name="author" content="Your Name" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Babylon.js + Next.js Demo" />
        <meta property="og:description" content="现代 3D Web 应用开发示例" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/og-image.png" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Babylon.js + Next.js Demo" />
        <meta name="twitter:description" content="现代 3D Web 应用开发示例" />
        <meta name="twitter:image" content="/twitter-image.png" />
        
        {/* 网站图标 */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        
        {/* PWA 配置 */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        
        {/* 字体预加载 */}
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        
        {/* 样式预加载 */}
        <link rel="preload" href="/styles/critical.css" as="style" />
        <link rel="stylesheet" href="/styles/critical.css" />
      </Head>
      <body className="bg-black text-white">
        <Main />
        <NextScript />
        
        {/* 性能监控脚本 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('performance' in window && 'PerformanceObserver' in window) {
                const observer = new PerformanceObserver((list) => {
                  for (const entry of list.getEntries()) {
                    if (entry.entryType === 'largest-contentful-paint') {
                      console.log('LCP:', entry.startTime);
                    }
                  }
                });
                observer.observe({ entryTypes: ['largest-contentful-paint'] });
              }
            `,
          }}
        />
      </body>
    </Html>
  );
}
