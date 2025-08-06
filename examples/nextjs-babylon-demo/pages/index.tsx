import type { NextPage } from 'next';
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
        background: '#1a1a2e'
      }}>
        <div style={{ 
          color: 'white', 
          fontSize: '18px',
          textAlign: 'center'
        }}>
          <div>正在加载 3D 场景...</div>
          <div style={{ 
            marginTop: '10px', 
            fontSize: '14px', 
            opacity: 0.7 
          }}>
            Loading Babylon.js Scene...
          </div>
        </div>
      </div>
    )
  }
);

const Home: NextPage = () => {
  return (
    <div>
      <BabylonScene />
    </div>
  );
};

export default Home;
