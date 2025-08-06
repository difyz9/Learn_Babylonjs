import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="zh-CN">
      <Head>
        {/* 预加载 Babylon.js 关键资源 */}
        <link rel="preload" href="https://cdn.babylonjs.com/babylon.js" as="script" />
        
        {/* WebGL 兼容性检测 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // WebGL 支持检测
              function checkWebGLSupport() {
                try {
                  const canvas = document.createElement('canvas');
                  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                  return !!gl;
                } catch (e) {
                  return false;
                }
              }

              if (!checkWebGLSupport()) {
                console.warn('WebGL 不受支持，Babylon.js 可能无法正常工作');
              }
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
        
        {/* WebGL 不支持时的提示 */}
        <noscript>
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#1a1a2e',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            textAlign: 'center',
            fontFamily: 'Arial, sans-serif'
          }}>
            <div>
              <h2>需要启用 JavaScript</h2>
              <p>此应用需要 JavaScript 和 WebGL 支持才能运行。</p>
              <p>请启用 JavaScript 并使用支持 WebGL 的现代浏览器。</p>
            </div>
          </div>
        </noscript>
      </body>
    </Html>
  );
}
