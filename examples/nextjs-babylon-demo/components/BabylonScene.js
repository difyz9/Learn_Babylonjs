import { useEffect, useRef } from 'react';

const BabylonScene = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    // 动态导入 Babylon.js
    const initBabylon = async () => {
      try {
        // 动态导入避免 SSR 问题
        const BABYLON = await import('babylonjs');
        
        const canvas = canvasRef.current;
        if (!canvas) return;

        // 创建引擎
        const engine = new BABYLON.Engine(canvas, true, {
          antialias: true,
          stencil: true,
          preserveDrawingBuffer: true,
        });

        // 创建场景
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color3(0.1, 0.1, 0.2);

        // 创建摄像机
        const camera = new BABYLON.ArcRotateCamera(
          'mainCamera',
          -Math.PI / 2,
          Math.PI / 2.5,
          10,
          BABYLON.Vector3.Zero(),
          scene
        );
        
        // 允许用户控制摄像机
        camera.attachToCanvas(canvas, true);
        camera.lowerRadiusLimit = 2;
        camera.upperRadiusLimit = 50;

        // 创建光源
        const hemisphericLight = new BABYLON.HemisphericLight(
          'hemisphericLight',
          new BABYLON.Vector3(0, 1, 0),
          scene
        );
        hemisphericLight.intensity = 0.7;

        const directionalLight = new BABYLON.DirectionalLight(
          'directionalLight',
          new BABYLON.Vector3(-1, -1, -1),
          scene
        );
        directionalLight.intensity = 0.5;

        // 创建地面
        const ground = BABYLON.MeshBuilder.CreateGround(
          'ground',
          { width: 10, height: 10 },
          scene
        );
        
        const groundMaterial = new BABYLON.StandardMaterial('groundMaterial', scene);
        groundMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        ground.material = groundMaterial;

        // 创建旋转的立方体
        const box = BABYLON.MeshBuilder.CreateBox(
          'mainBox',
          { size: 2 },
          scene
        );
        box.position.y = 1;

        // 创建立方体材质
        const boxMaterial = new BABYLON.StandardMaterial('boxMaterial', scene);
        boxMaterial.diffuseColor = new BABYLON.Color3(1, 0.5, 0);
        boxMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        box.material = boxMaterial;

        // 创建球体
        const sphere = BABYLON.MeshBuilder.CreateSphere(
          'sphere',
          { diameter: 1.5 },
          scene
        );
        sphere.position = new BABYLON.Vector3(3, 1, 0);

        // 创建球体材质
        const sphereMaterial = new BABYLON.StandardMaterial('sphereMaterial', scene);
        sphereMaterial.diffuseColor = new BABYLON.Color3(0, 0.7, 1);
        sphereMaterial.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        sphere.material = sphereMaterial;

        // 创建立方体旋转动画
        const boxRotationAnimation = new BABYLON.Animation(
          'boxRotation',
          'rotation.y',
          30,
          BABYLON.Animation.ANIMATIONTYPE_FLOAT,
          BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );

        const boxKeys = [
          { frame: 0, value: 0 },
          { frame: 60, value: Math.PI * 2 }
        ];

        boxRotationAnimation.setKeys(boxKeys);
        box.animations.push(boxRotationAnimation);
        scene.beginAnimation(box, 0, 60, true);

        // 创建球体上下浮动动画
        const sphereFloatAnimation = new BABYLON.Animation(
          'sphereFloat',
          'position.y',
          30,
          BABYLON.Animation.ANIMATIONTYPE_FLOAT,
          BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );

        const sphereKeys = [
          { frame: 0, value: 1 },
          { frame: 30, value: 2.5 },
          { frame: 60, value: 1 }
        ];

        sphereFloatAnimation.setKeys(sphereKeys);
        sphere.animations.push(sphereFloatAnimation);
        scene.beginAnimation(sphere, 0, 60, true);

        // 添加点击事件
        scene.onPointerObservable.add((pointerInfo) => {
          if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
            if (pointerInfo.pickInfo.hit && pointerInfo.pickInfo.pickedMesh) {
              const pickedMesh = pointerInfo.pickInfo.pickedMesh;
              console.log('点击了:', pickedMesh.name);
              
              // 简单的点击效果
              const originalScale = pickedMesh.scaling.clone();
              pickedMesh.scaling = originalScale.scale(1.2);
              
              setTimeout(() => {
                pickedMesh.scaling = originalScale;
              }, 200);
            }
          }
        });

        // 渲染循环
        engine.runRenderLoop(() => {
          scene.render();
        });

        // 窗口大小调整
        const handleResize = () => {
          engine.resize();
        };
        
        window.addEventListener('resize', handleResize);

        // 清理函数
        return () => {
          window.removeEventListener('resize', handleResize);
          scene.dispose();
          engine.dispose();
        };

      } catch (error) {
        console.error('初始化 Babylon.js 失败:', error);
      }
    };

    let cleanup;
    initBabylon().then(cleanupFn => {
      cleanup = cleanupFn;
    });

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <canvas 
        ref={canvasRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          outline: 'none',
          display: 'block'
        }} 
      />
      
      {/* 控制说明 */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        background: 'rgba(0, 0, 0, 0.7)',
        padding: '10px',
        borderRadius: '5px',
        pointerEvents: 'none'
      }}>
        <div>🖱️ 鼠标拖拽：旋转视角</div>
        <div>🔍 滚轮：缩放</div>
        <div>👆 点击物体：缩放效果</div>
      </div>
    </div>
  );
};

export default BabylonScene;
