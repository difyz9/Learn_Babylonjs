import { useEffect, useRef } from 'react';

const BabylonScene = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // 动态导入 Babylon.js 以避免 SSR 问题
    const initBabylon = async () => {
      const BABYLON = await import('babylonjs');
      
      const canvas = canvasRef.current;
      if (!canvas) return;

      // 创建引擎和场景
      const engine = new BABYLON.Engine(canvas, true);
      const scene = new BABYLON.Scene(engine);

      // 创建摄像机
      const camera = new BABYLON.ArcRotateCamera(
        'camera',
        -Math.PI / 2,
        Math.PI / 2.5,
        10,
        BABYLON.Vector3.Zero(),
        scene
      );
      camera.attachToCanvas(canvas, true);

      // 创建光源
      const light = new BABYLON.HemisphericLight(
        'light',
        new BABYLON.Vector3(0, 1, 0),
        scene
      );

      // 创建一个立方体
      const box = BABYLON.MeshBuilder.CreateBox('box', { size: 2 }, scene);
      
      // 创建材质
      const material = new BABYLON.StandardMaterial('boxMaterial', scene);
      material.diffuseColor = new BABYLON.Color3(1, 0.5, 0);
      box.material = material;

      // 添加动画
      const animationBox = new BABYLON.Animation(
        'boxAnimation',
        'rotation.y',
        30,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
      );

      const keys = [
        { frame: 0, value: 0 },
        { frame: 60, value: Math.PI * 2 }
      ];

      animationBox.setKeys(keys);
      box.animations.push(animationBox);
      scene.beginAnimation(box, 0, 60, true);

      // 渲染循环
      engine.runRenderLoop(() => scene.render());

      // 窗口大小调整
      const handleResize = () => engine.resize();
      window.addEventListener('resize', handleResize);

      // 清理函数
      return () => {
        window.removeEventListener('resize', handleResize);
        scene.dispose();
        engine.dispose();
      };
    };

    const cleanup = initBabylon();
    
    return () => {
      cleanup.then(cleanupFn => cleanupFn && cleanupFn());
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <canvas 
        ref={canvasRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          outline: 'none'
        }} 
      />
    </div>
  );
};

export default BabylonScene;
