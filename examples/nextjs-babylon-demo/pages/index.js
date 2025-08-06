import dynamic from 'next/dynamic';

// 动态导入 Babylon 组件以避免 SSR 问题
const BabylonScene = dynamic(
  () => import('../components/BabylonScene'),
  { 
    ssr: false,
    loading: () => (
      <div style={{ 
        width: '100%', 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ 
          color: 'white', 
          fontSize: '20px',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: '40px',
            marginBottom: '20px'
          }}>
            🚀
          </div>
          <div>正在加载 3D 场景...</div>
          <div style={{ 
            marginTop: '10px', 
            fontSize: '14px', 
            opacity: 0.7 
          }}>
            Loading Babylon.js Scene...
          </div>
          <div style={{
            marginTop: '20px',
            width: '200px',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, #ff6b6b, #4ecdc4)',
              animation: 'loading 2s infinite'
            }} />
          </div>
        </div>
        <style jsx>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    )
  }
);

export default function Home() {
  return (
    <div>
      <BabylonScene />
    </div>
  );
}
