import { useRef, useEffect, useCallback, useState } from 'react';
import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  DirectionalLight,
  Vector3,
  Color3,
  MeshBuilder,
  StandardMaterial,
  PBRMaterial,
  Animation,
  PointerEventTypes,
  Mesh,
} from 'babylonjs';

export interface UseBabylonOptions {
  antialias?: boolean;
  engineOptions?: any;
  adaptToDeviceRatio?: boolean;
  enablePhysics?: boolean;
  enablePostProcessing?: boolean;
}

export interface BabylonMesh extends Mesh {
  userData?: any;
}

export const useBabylon = (options: UseBabylonOptions = {}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<ArcRotateCamera | null>(null);
  
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const [meshes, setMeshes] = useState<BabylonMesh[]>([]);
  const [selectedMesh, setSelectedMesh] = useState<BabylonMesh | null>(null);

  // 初始化 Babylon.js 场景
  const initializeScene = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setError('Canvas 元素未找到');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 创建引擎
      const engine = new Engine(
        canvas,
        options.antialias ?? true,
        options.engineOptions,
        options.adaptToDeviceRatio ?? true
      );
      engineRef.current = engine;

      // 创建场景
      const scene = new Scene(engine);
      sceneRef.current = scene;

      // 设置场景背景色
      scene.clearColor = new Color3(0.1, 0.1, 0.2);

      // 创建弧形旋转摄像机
      const camera = new ArcRotateCamera(
        'camera',
        -Math.PI / 2,
        Math.PI / 2.5,
        10,
        Vector3.Zero(),
        scene
      );
      camera.attachToCanvas(canvas, true);
      camera.lowerRadiusLimit = 2;
      camera.upperRadiusLimit = 50;
      camera.lowerBetaLimit = 0.1;
      camera.upperBetaLimit = Math.PI - 0.1;
      cameraRef.current = camera;

      // 创建光源
      const hemisphericLight = new HemisphericLight(
        'hemisphericLight',
        new Vector3(0, 1, 0),
        scene
      );
      hemisphericLight.intensity = 0.6;

      const directionalLight = new DirectionalLight(
        'directionalLight',
        new Vector3(-1, -1, -1),
        scene
      );
      directionalLight.intensity = 0.8;
      directionalLight.position = new Vector3(5, 5, 5);

      // 设置指针事件
      scene.onPointerObservable.add((pointerInfo) => {
        switch (pointerInfo.type) {
          case PointerEventTypes.POINTERDOWN:
            if (pointerInfo.pickInfo?.hit && pointerInfo.pickInfo.pickedMesh) {
              const pickedMesh = pointerInfo.pickInfo.pickedMesh as BabylonMesh;
              setSelectedMesh(pickedMesh);
              onMeshSelect?.(pickedMesh);
            }
            break;
        }
      });

      // 启用物理引擎（可选）
      if (options.enablePhysics) {
        const { CannonJSPlugin } = await import('babylonjs');
        scene.enablePhysics(new Vector3(0, -9.81, 0), new CannonJSPlugin());
      }

      // 启用后期处理（可选）
      if (options.enablePostProcessing) {
        const { DefaultRenderingPipeline } = await import('babylonjs');
        const pipeline = new DefaultRenderingPipeline('defaultPipeline', true, scene);
        pipeline.fxaaEnabled = true;
        pipeline.imageProcessingEnabled = true;
      }

      // 渲染循环
      engine.runRenderLoop(() => {
        scene.render();
        
        // 更新 FPS
        const currentFps = Math.round(engine.getFps());
        if (currentFps !== fps) {
          setFps(currentFps);
        }
      });

      // 窗口大小调整
      const handleResize = () => engine.resize();
      window.addEventListener('resize', handleResize);

      setIsReady(true);
      setIsLoading(false);

      // 清理函数
      return () => {
        window.removeEventListener('resize', handleResize);
        scene.dispose();
        engine.dispose();
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '初始化失败';
      setError(errorMessage);
      setIsLoading(false);
    }
  }, [options, fps]);

  // 组件挂载时初始化场景
  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      return initializeScene();
    }
  }, [initializeScene]);

  // 创建网格的通用方法
  const createMesh = useCallback((
    name: string,
    type: 'box' | 'sphere' | 'cylinder' | 'plane' | 'ground',
    options: any = {},
    material?: StandardMaterial | PBRMaterial
  ): BabylonMesh | null => {
    const scene = sceneRef.current;
    if (!scene) return null;

    let mesh: Mesh;

    switch (type) {
      case 'box':
        mesh = MeshBuilder.CreateBox(name, options, scene);
        break;
      case 'sphere':
        mesh = MeshBuilder.CreateSphere(name, options, scene);
        break;
      case 'cylinder':
        mesh = MeshBuilder.CreateCylinder(name, options, scene);
        break;
      case 'plane':
        mesh = MeshBuilder.CreatePlane(name, options, scene);
        break;
      case 'ground':
        mesh = MeshBuilder.CreateGround(name, options, scene);
        break;
      default:
        return null;
    }

    const babylonMesh = mesh as BabylonMesh;

    // 应用材质
    if (material) {
      babylonMesh.material = material;
    }

    // 添加到网格列表
    setMeshes(prev => [...prev, babylonMesh]);

    return babylonMesh;
  }, []);

  // 创建材质
  const createStandardMaterial = useCallback((
    name: string,
    color: Color3,
    options: {
      specularColor?: Color3;
      emissiveColor?: Color3;
      alpha?: number;
    } = {}
  ): StandardMaterial | null => {
    const scene = sceneRef.current;
    if (!scene) return null;

    const material = new StandardMaterial(name, scene);
    material.diffuseColor = color;

    if (options.specularColor) {
      material.specularColor = options.specularColor;
    }
    if (options.emissiveColor) {
      material.emissiveColor = options.emissiveColor;
    }
    if (options.alpha !== undefined) {
      material.alpha = options.alpha;
    }

    return material;
  }, []);

  // 创建 PBR 材质
  const createPBRMaterial = useCallback((
    name: string,
    baseColor: Color3,
    options: {
      metallicFactor?: number;
      roughnessFactor?: number;
      alpha?: number;
    } = {}
  ): PBRMaterial | null => {
    const scene = sceneRef.current;
    if (!scene) return null;

    const material = new PBRMaterial(name, scene);
    material.baseColor = baseColor;
    material.metallicFactor = options.metallicFactor ?? 0.0;
    material.roughnessFactor = options.roughnessFactor ?? 0.5;

    if (options.alpha !== undefined) {
      material.alpha = options.alpha;
    }

    return material;
  }, []);

  // 创建动画
  const createAnimation = useCallback((
    target: any,
    property: string,
    keys: Array<{ frame: number; value: any }>,
    options: {
      frameRate?: number;
      loopMode?: number;
      easingFunction?: any;
    } = {}
  ) => {
    const scene = sceneRef.current;
    if (!scene) return null;

    const animation = new Animation(
      `${target.name}_${property}`,
      property,
      options.frameRate ?? 30,
      Animation.ANIMATIONTYPE_FLOAT,
      options.loopMode ?? Animation.ANIMATIONLOOPMODE_CYCLE
    );

    animation.setKeys(keys);

    if (options.easingFunction) {
      animation.setEasingFunction(options.easingFunction);
    }

    target.animations = target.animations || [];
    target.animations.push(animation);

    return scene.beginAnimation(target, keys[0].frame, keys[keys.length - 1].frame, true);
  }, []);

  // 移除网格
  const removeMesh = useCallback((meshOrName: BabylonMesh | string) => {
    const scene = sceneRef.current;
    if (!scene) return;

    const meshToRemove = typeof meshOrName === 'string' 
      ? scene.getMeshByName(meshOrName) as BabylonMesh
      : meshOrName;

    if (meshToRemove) {
      meshToRemove.dispose();
      setMeshes(prev => prev.filter(m => m !== meshToRemove));
      
      if (selectedMesh === meshToRemove) {
        setSelectedMesh(null);
      }
    }
  }, [selectedMesh]);

  // 清空场景
  const clearScene = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    meshes.forEach(mesh => mesh.dispose());
    setMeshes([]);
    setSelectedMesh(null);
  }, [meshes]);

  // 重置摄像机
  const resetCamera = useCallback(() => {
    const camera = cameraRef.current;
    if (!camera) return;

    camera.alpha = -Math.PI / 2;
    camera.beta = Math.PI / 2.5;
    camera.radius = 10;
    camera.setTarget(Vector3.Zero());
  }, []);

  // 事件回调
  const onMeshSelect = useCallback((mesh: BabylonMesh) => {
    // 可以在这里添加选中效果
    console.log('Mesh selected:', mesh.name);
  }, []);

  return {
    // 引用
    canvasRef,
    engine: engineRef.current,
    scene: sceneRef.current,
    camera: cameraRef.current,
    
    // 状态
    isReady,
    isLoading,
    error,
    fps,
    meshes,
    selectedMesh,
    
    // 方法
    createMesh,
    createStandardMaterial,
    createPBRMaterial,
    createAnimation,
    removeMesh,
    clearScene,
    resetCamera,
    
    // 设置器
    setSelectedMesh,
  };
};

export default useBabylon;
