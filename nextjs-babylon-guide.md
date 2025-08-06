# Next.js + Babylon.js 集成开发指南

## 📚 目录

- [1. 项目初始化](#1-项目初始化)
- [2. Babylon.js 在 Next.js 中的集成](#2-babylonjs-在-nextjs-中的集成)
- [3. 组件化开发](#3-组件化开发)
- [4. 状态管理与数据绑定](#4-状态管理与数据绑定)
- [5. 服务端渲染 (SSR) 处理](#5-服务端渲染-ssr-处理)
- [6. 性能优化](#6-性能优化)
- [7. 完整项目示例](#7-完整项目示例)
- [8. 部署和生产环境](#8-部署和生产环境)

---

## 1. 项目初始化

### 1.1 创建 Next.js 项目

```bash
# 使用 create-next-app 创建项目
npx create-next-app@latest babylon-nextjs-app

# 进入项目目录
cd babylon-nextjs-app

# 安装 Babylon.js 相关依赖
npm install babylonjs babylonjs-loaders babylonjs-materials babylonjs-gui

# 安装开发依赖
npm install --save-dev @types/babylonjs
```

### 1.2 项目结构

```
babylon-nextjs-app/
├── components/
│   ├── BabylonScene.tsx
│   ├── SceneManager.tsx
│   └── UI/
│       ├── Controls.tsx
│       └── LoadingScreen.tsx
├── hooks/
│   ├── useBabylon.ts
│   └── useSceneLoader.ts
├── lib/
│   ├── babylonUtils.ts
│   └── sceneSetup.ts
├── pages/
│   ├── api/
│   ├── _app.tsx
│   ├── _document.tsx
│   └── index.tsx
├── public/
│   ├── models/
│   ├── textures/
│   └── environments/
├── styles/
│   ├── globals.css
│   └── BabylonScene.module.css
├── types/
│   └── babylon.d.ts
└── utils/
    └── babylonHelpers.ts
```

### 1.3 TypeScript 配置

**tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

---

## 2. Babylon.js 在 Next.js 中的集成

### 2.1 基础 Babylon.js 组件

**components/BabylonScene.tsx**
```tsx
import React, { useRef, useEffect, useState } from 'react';
import { Engine, Scene } from 'babylonjs';
import styles from '../styles/BabylonScene.module.css';

interface BabylonSceneProps {
  antialias?: boolean;
  engineOptions?: any;
  adaptToDeviceRatio?: boolean;
  sceneOptions?: any;
  onRender?: (scene: Scene) => void;
  onSceneReady: (scene: Scene) => void;
  width?: number;
  height?: number;
  id?: string;
}

const BabylonScene: React.FC<BabylonSceneProps> = ({
  antialias = true,
  engineOptions = {},
  adaptToDeviceRatio = true,
  sceneOptions = {},
  onRender,
  onSceneReady,
  id = 'babylon-canvas',
  ...rest
}) => {
  const reactCanvas = useRef<HTMLCanvasElement>(null);
  const [engine, setEngine] = useState<Engine | null>(null);
  const [scene, setScene] = useState<Scene | null>(null);

  useEffect(() => {
    const { current: canvas } = reactCanvas;

    if (!canvas) return;

    // 创建 Babylon.js 引擎
    const engine = new Engine(
      canvas,
      antialias,
      engineOptions,
      adaptToDeviceRatio
    );
    setEngine(engine);

    // 创建场景
    const scene = new Scene(engine, sceneOptions);
    setScene(scene);

    // 场景准备完成回调
    if (scene.isReady()) {
      onSceneReady(scene);
    } else {
      scene.onReadyObservable.addOnce((scene) => onSceneReady(scene));
    }

    // 渲染循环
    engine.runRenderLoop(() => {
      if (typeof onRender === 'function') onRender(scene);
      scene.render();
    });

    // 窗口大小调整
    const resize = () => {
      scene.getEngine().resize();
    };

    if (window) {
      window.addEventListener('resize', resize);
    }

    // 清理函数
    return () => {
      scene.getEngine().dispose();

      if (window) {
        window.removeEventListener('resize', resize);
      }
    };
  }, [
    antialias,
    engineOptions,
    adaptToDeviceRatio,
    sceneOptions,
    onRender,
    onSceneReady,
  ]);

  return (
    <canvas
      ref={reactCanvas}
      id={id}
      className={styles.babylonCanvas}
      {...rest}
    />
  );
};

export default BabylonScene;
```

### 2.2 样式文件

**styles/BabylonScene.module.css**
```css
.babylonCanvas {
  width: 100%;
  height: 100%;
  outline: none;
  display: block;
  touch-action: none;
}

.sceneContainer {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.loadingOverlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  color: white;
  font-size: 18px;
}

.controls {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.7);
  padding: 20px;
  border-radius: 8px;
  color: white;
  min-width: 200px;
}

.controlButton {
  width: 100%;
  padding: 8px 16px;
  margin: 4px 0;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.controlButton:hover {
  background: #45a049;
}

.controlButton:disabled {
  background: #666;
  cursor: not-allowed;
}
```

---

## 3. 组件化开发

### 3.1 自定义 Hook：useBabylon

**hooks/useBabylon.ts**
```typescript
import { useRef, useCallback, useEffect, useState } from 'react';
import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
} from 'babylonjs';

export interface UseBabylonOptions {
  antialias?: boolean;
  engineOptions?: any;
  adaptToDeviceRatio?: boolean;
}

export const useBabylon = (options: UseBabylonOptions = {}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [engine, setEngine] = useState<Engine | null>(null);
  const [scene, setScene] = useState<Scene | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setError('Canvas element not found');
      return;
    }

    try {
      // 创建引擎
      const newEngine = new Engine(
        canvas,
        options.antialias ?? true,
        options.engineOptions,
        options.adaptToDeviceRatio ?? true
      );

      // 创建场景
      const newScene = new Scene(newEngine);
      newScene.clearColor = new Color3(0.1, 0.1, 0.2);

      // 设置默认摄像机
      const camera = new ArcRotateCamera(
        'camera',
        -Math.PI / 2,
        Math.PI / 2.5,
        10,
        Vector3.Zero(),
        newScene
      );
      camera.attachToCanvas(canvas, true);

      // 设置默认光源
      const light = new HemisphericLight(
        'light',
        new Vector3(0, 1, 0),
        newScene
      );
      light.intensity = 0.7;

      setEngine(newEngine);
      setScene(newScene);
      setIsReady(true);
      setError(null);

      // 渲染循环
      newEngine.runRenderLoop(() => {
        newScene.render();
      });

      // 窗口大小调整
      const handleResize = () => newEngine.resize();
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        newEngine.dispose();
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [options]);

  useEffect(() => {
    if (canvasRef.current && !engine) {
      return createScene();
    }
  }, [createScene, engine]);

  const addMesh = useCallback((name: string, type: 'box' | 'sphere' | 'ground', options: any = {}) => {
    if (!scene) return null;

    let mesh;
    switch (type) {
      case 'box':
        mesh = MeshBuilder.CreateBox(name, options, scene);
        break;
      case 'sphere':
        mesh = MeshBuilder.CreateSphere(name, options, scene);
        break;
      case 'ground':
        mesh = MeshBuilder.CreateGround(name, options, scene);
        break;
      default:
        return null;
    }

    return mesh;
  }, [scene]);

  const createMaterial = useCallback((name: string, color: Color3) => {
    if (!scene) return null;

    const material = new StandardMaterial(name, scene);
    material.diffuseColor = color;
    return material;
  }, [scene]);

  return {
    canvasRef,
    engine,
    scene,
    isReady,
    error,
    addMesh,
    createMaterial,
  };
};
```

### 3.2 场景管理器组件

**components/SceneManager.tsx**
```tsx
import React, { useEffect, useState } from 'react';
import { Scene, Vector3, Animation, Color3 } from 'babylonjs';
import { useBabylon } from '../hooks/useBabylon';
import styles from '../styles/BabylonScene.module.css';

interface SceneManagerProps {
  onSceneReady?: (scene: Scene) => void;
}

const SceneManager: React.FC<SceneManagerProps> = ({ onSceneReady }) => {
  const { canvasRef, scene, isReady, error, addMesh, createMaterial } = useBabylon();
  const [meshes, setMeshes] = useState<any[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isReady && scene) {
      // 创建默认场景内容
      setupDefaultScene();
      onSceneReady?.(scene);
    }
  }, [isReady, scene]);

  const setupDefaultScene = () => {
    if (!scene) return;

    // 创建地面
    const ground = addMesh('ground', 'ground', { width: 10, height: 10 });
    if (ground) {
      const groundMaterial = createMaterial('groundMaterial', new Color3(0.3, 0.3, 0.3));
      if (groundMaterial) ground.material = groundMaterial;
    }

    // 创建立方体
    const box = addMesh('box', 'box', { size: 2 });
    if (box) {
      box.position.y = 1;
      const boxMaterial = createMaterial('boxMaterial', new Color3(1, 0.2, 0.2));
      if (boxMaterial) box.material = boxMaterial;
      setMeshes(prev => [...prev, box]);
    }

    // 创建球体
    const sphere = addMesh('sphere', 'sphere', { diameter: 2 });
    if (sphere) {
      sphere.position = new Vector3(3, 1, 0);
      const sphereMaterial = createMaterial('sphereMaterial', new Color3(0.2, 1, 0.2));
      if (sphereMaterial) sphere.material = sphereMaterial;
      setMeshes(prev => [...prev, sphere]);
    }
  };

  const toggleAnimation = () => {
    if (!scene || meshes.length === 0) return;

    if (isAnimating) {
      scene.stopAllAnimations();
      setIsAnimating(false);
    } else {
      meshes.forEach((mesh, index) => {
        const rotationAnimation = new Animation(
          `rotation_${index}`,
          'rotation.y',
          30,
          Animation.ANIMATIONTYPE_FLOAT,
          Animation.ANIMATIONLOOPMODE_CYCLE
        );

        const keys = [
          { frame: 0, value: 0 },
          { frame: 120, value: Math.PI * 2 }
        ];

        rotationAnimation.setKeys(keys);
        mesh.animations = [rotationAnimation];
        scene.beginAnimation(mesh, 0, 120, true);
      });
      setIsAnimating(true);
    }
  };

  const resetScene = () => {
    if (!scene) return;
    
    scene.stopAllAnimations();
    meshes.forEach(mesh => {
      mesh.rotation = Vector3.Zero();
      mesh.position.y = mesh.name === 'ground' ? 0 : 1;
    });
    setIsAnimating(false);
  };

  if (error) {
    return (
      <div className={styles.sceneContainer}>
        <div style={{ color: 'red', padding: '20px' }}>
          错误: {error}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.sceneContainer}>
      <canvas ref={canvasRef} className={styles.babylonCanvas} />
      
      {!isReady && (
        <div className={styles.loadingOverlay}>
          <div>加载 3D 场景中...</div>
        </div>
      )}

      {isReady && (
        <div className={styles.controls}>
          <h3>场景控制</h3>
          <button
            className={styles.controlButton}
            onClick={toggleAnimation}
          >
            {isAnimating ? '停止动画' : '开始动画'}
          </button>
          <button
            className={styles.controlButton}
            onClick={resetScene}
          >
            重置场景
          </button>
        </div>
      )}
    </div>
  );
};

export default SceneManager;
```

---

## 4. 状态管理与数据绑定

### 4.1 使用 Context 进行状态管理

**contexts/BabylonContext.tsx**
```tsx
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Scene, Mesh } from 'babylonjs';

interface BabylonState {
  scene: Scene | null;
  meshes: Mesh[];
  isLoading: boolean;
  selectedMesh: Mesh | null;
  cameraMode: 'arc' | 'free';
}

type BabylonAction =
  | { type: 'SET_SCENE'; payload: Scene }
  | { type: 'ADD_MESH'; payload: Mesh }
  | { type: 'REMOVE_MESH'; payload: string }
  | { type: 'SELECT_MESH'; payload: Mesh | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CAMERA_MODE'; payload: 'arc' | 'free' };

const initialState: BabylonState = {
  scene: null,
  meshes: [],
  isLoading: true,
  selectedMesh: null,
  cameraMode: 'arc',
};

const babylonReducer = (state: BabylonState, action: BabylonAction): BabylonState => {
  switch (action.type) {
    case 'SET_SCENE':
      return { ...state, scene: action.payload, isLoading: false };
    case 'ADD_MESH':
      return { ...state, meshes: [...state.meshes, action.payload] };
    case 'REMOVE_MESH':
      return {
        ...state,
        meshes: state.meshes.filter(mesh => mesh.name !== action.payload),
      };
    case 'SELECT_MESH':
      return { ...state, selectedMesh: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_CAMERA_MODE':
      return { ...state, cameraMode: action.payload };
    default:
      return state;
  }
};

const BabylonContext = createContext<{
  state: BabylonState;
  dispatch: React.Dispatch<BabylonAction>;
} | null>(null);

export const BabylonProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(babylonReducer, initialState);

  return (
    <BabylonContext.Provider value={{ state, dispatch }}>
      {children}
    </BabylonContext.Provider>
  );
};

export const useBabylonContext = () => {
  const context = useContext(BabylonContext);
  if (!context) {
    throw new Error('useBabylonContext must be used within a BabylonProvider');
  }
  return context;
};
```

### 4.2 模型加载 Hook

**hooks/useSceneLoader.ts**
```typescript
import { useState, useCallback } from 'react';
import { Scene, SceneLoader, ImportMeshOptions } from 'babylonjs';
import 'babylonjs-loaders';

export interface LoadModelOptions {
  path: string;
  filename: string;
  onProgress?: (event: any) => void;
  onError?: (error: any) => void;
}

export const useSceneLoader = (scene: Scene | null) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadModel = useCallback(async (options: LoadModelOptions) => {
    if (!scene) {
      setError('Scene not available');
      return null;
    }

    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      const result = await SceneLoader.ImportMeshAsync(
        '',
        options.path,
        options.filename,
        scene,
        (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            setProgress(percentComplete);
            options.onProgress?.(event);
          }
        }
      );

      setLoading(false);
      setProgress(100);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setLoading(false);
      options.onError?.(err);
      return null;
    }
  }, [scene]);

  const loadGLTF = useCallback((path: string, filename: string) => {
    return loadModel({ path, filename });
  }, [loadModel]);

  const loadBabylon = useCallback((path: string, filename: string) => {
    return loadModel({ path, filename });
  }, [loadModel]);

  return {
    loading,
    progress,
    error,
    loadModel,
    loadGLTF,
    loadBabylon,
  };
};
```

---

## 5. 服务端渲染 (SSR) 处理

### 5.1 动态导入避免 SSR 问题

**components/BabylonWrapper.tsx**
```tsx
import React from 'react';
import dynamic from 'next/dynamic';

// 动态导入 Babylon 组件，禁用 SSR
const BabylonScene = dynamic(() => import('./BabylonScene'), {
  ssr: false,
  loading: () => (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      background: '#1a1a1a',
      color: 'white'
    }}>
      正在加载 3D 场景...
    </div>
  ),
});

interface BabylonWrapperProps {
  [key: string]: any;
}

const BabylonWrapper: React.FC<BabylonWrapperProps> = (props) => {
  return <BabylonScene {...props} />;
};

export default BabylonWrapper;
```

### 5.2 客户端检测工具

**utils/clientOnly.tsx**
```tsx
import React, { useState, useEffect, ReactNode } from 'react';

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const ClientOnly: React.FC<ClientOnlyProps> = ({ children, fallback = null }) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default ClientOnly;
```

### 5.3 使用示例

**pages/3d-scene.tsx**
```tsx
import React from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { BabylonProvider } from '../contexts/BabylonContext';
import ClientOnly from '../utils/clientOnly';

const SceneManager = dynamic(() => import('../components/SceneManager'), {
  ssr: false,
});

const Scene3DPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>3D Scene - Babylon.js + Next.js</title>
        <meta name="description" content="Interactive 3D scene built with Babylon.js and Next.js" />
      </Head>
      
      <BabylonProvider>
        <ClientOnly
          fallback={
            <div style={{ 
              height: '100vh', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              background: '#000',
              color: 'white'
            }}>
              Loading 3D Environment...
            </div>
          }
        >
          <SceneManager />
        </ClientOnly>
      </BabylonProvider>
    </>
  );
};

export default Scene3DPage;
```

---

## 6. 性能优化

### 6.1 代码分割和懒加载

**utils/babylonLoader.ts**
```typescript
// 动态导入 Babylon.js 模块
export const loadBabylonCore = async () => {
  const BABYLON = await import('babylonjs');
  return BABYLON;
};

export const loadBabylonLoaders = async () => {
  await import('babylonjs-loaders');
};

export const loadBabylonMaterials = async () => {
  const materials = await import('babylonjs-materials');
  return materials;
};

export const loadBabylonGUI = async () => {
  const gui = await import('babylonjs-gui');
  return gui;
};

// 按需加载的 Hook
export const useBabylonModules = () => {
  const [modules, setModules] = useState<{
    core?: any;
    loaders?: boolean;
    materials?: any;
    gui?: any;
  }>({});

  const loadCore = async () => {
    if (!modules.core) {
      const core = await loadBabylonCore();
      setModules(prev => ({ ...prev, core }));
      return core;
    }
    return modules.core;
  };

  const loadLoaders = async () => {
    if (!modules.loaders) {
      await loadBabylonLoaders();
      setModules(prev => ({ ...prev, loaders: true }));
    }
  };

  return { modules, loadCore, loadLoaders };
};
```

### 6.2 内存管理

**hooks/useSceneCleanup.ts**
```typescript
import { useEffect, useRef } from 'react';
import { Scene, Engine } from 'babylonjs';

export const useSceneCleanup = (scene: Scene | null, engine: Engine | null) => {
  const cleanupRef = useRef<(() => void)[]>([]);

  const addCleanupFunction = (fn: () => void) => {
    cleanupRef.current.push(fn);
  };

  useEffect(() => {
    return () => {
      // 执行所有清理函数
      cleanupRef.current.forEach(fn => fn());
      
      // 清理场景和引擎
      if (scene) {
        scene.dispose();
      }
      if (engine) {
        engine.dispose();
      }
    };
  }, [scene, engine]);

  return { addCleanupFunction };
};
```

### 6.3 性能监控组件

**components/PerformanceMonitor.tsx**
```tsx
import React, { useState, useEffect } from 'react';
import { Scene } from 'babylonjs';

interface PerformanceMonitorProps {
  scene: Scene | null;
  engine: any;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ scene, engine }) => {
  const [fps, setFps] = useState(0);
  const [drawCalls, setDrawCalls] = useState(0);
  const [meshCount, setMeshCount] = useState(0);

  useEffect(() => {
    if (!scene || !engine) return;

    const interval = setInterval(() => {
      setFps(Math.round(engine.getFps()));
      setDrawCalls(scene.getEngine().getGlInfo().drawCalls || 0);
      setMeshCount(scene.meshes.length);
    }, 1000);

    return () => clearInterval(interval);
  }, [scene, engine]);

  if (!scene) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 10,
      left: 10,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontFamily: 'monospace',
      fontSize: '12px',
      zIndex: 1000
    }}>
      <div>FPS: {fps}</div>
      <div>Draw Calls: {drawCalls}</div>
      <div>Meshes: {meshCount}</div>
    </div>
  );
};

export default PerformanceMonitor;
```

---

## 7. 完整项目示例

### 7.1 主页面

**pages/index.tsx**
```tsx
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Home.module.css';

const Home: React.FC = () => {
  return (
    <>
      <Head>
        <title>Babylon.js + Next.js 示例</title>
        <meta name="description" content="Babylon.js integration with Next.js examples" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <span className={styles.highlight}>Babylon.js</span> + Next.js
        </h1>

        <p className={styles.description}>
          探索 3D 网页开发的强大组合
        </p>

        <div className={styles.grid}>
          <Link href="/basic-scene" className={styles.card}>
            <h2>基础场景 &rarr;</h2>
            <p>学习如何创建基础的 3D 场景</p>
          </Link>

          <Link href="/interactive-scene" className={styles.card}>
            <h2>交互场景 &rarr;</h2>
            <p>添加用户交互和动画效果</p>
          </Link>

          <Link href="/model-viewer" className={styles.card}>
            <h2>模型查看器 &rarr;</h2>
            <p>加载和展示 3D 模型文件</p>
          </Link>

          <Link href="/product-configurator" className={styles.card}>
            <h2>产品配置器 &rarr;</h2>
            <p>构建交互式产品展示应用</p>
          </Link>
        </div>
      </main>
    </>
  );
};

export default Home;
```

### 7.2 交互式场景页面

**pages/interactive-scene.tsx**
```tsx
import React, { useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { BabylonProvider } from '../contexts/BabylonContext';

const InteractiveScene = dynamic(() => import('../components/InteractiveScene'), {
  ssr: false,
});

const InteractiveScenePage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Interactive Scene - Babylon.js + Next.js</title>
      </Head>
      
      <BabylonProvider>
        <InteractiveScene />
      </BabylonProvider>
    </>
  );
};

export default InteractiveScenePage;
```

### 7.3 交互式场景组件

**components/InteractiveScene.tsx**
```tsx
import React, { useEffect, useState } from 'react';
import { Scene, Vector3, Color3, PointerEventTypes } from 'babylonjs';
import { useBabylon } from '../hooks/useBabylon';
import { useBabylonContext } from '../contexts/BabylonContext';
import PerformanceMonitor from './PerformanceMonitor';
import styles from '../styles/InteractiveScene.module.css';

const InteractiveScene: React.FC = () => {
  const { canvasRef, scene, engine, isReady, addMesh, createMaterial } = useBabylon();
  const { state, dispatch } = useBabylonContext();
  const [selectedMeshName, setSelectedMeshName] = useState<string>('');

  useEffect(() => {
    if (isReady && scene) {
      setupInteractiveScene();
    }
  }, [isReady, scene]);

  const setupInteractiveScene = () => {
    if (!scene) return;

    // 创建多个可交互的物体
    const colors = [
      new Color3(1, 0.2, 0.2), // 红色
      new Color3(0.2, 1, 0.2), // 绿色
      new Color3(0.2, 0.2, 1), // 蓝色
      new Color3(1, 1, 0.2),   // 黄色
      new Color3(1, 0.2, 1),   // 品红
    ];

    for (let i = 0; i < 5; i++) {
      const mesh = addMesh(`mesh_${i}`, i % 2 === 0 ? 'box' : 'sphere', {
        size: 1.5,
        diameter: 1.5,
      });

      if (mesh) {
        mesh.position = new Vector3(i * 3 - 6, 1, 0);
        const material = createMaterial(`material_${i}`, colors[i]);
        if (material) {
          material.emissiveColor = colors[i].scale(0.1);
          mesh.material = material;
        }
        dispatch({ type: 'ADD_MESH', payload: mesh });
      }
    }

    // 添加地面
    const ground = addMesh('ground', 'ground', { width: 20, height: 20 });
    if (ground) {
      const groundMaterial = createMaterial('groundMaterial', new Color3(0.3, 0.3, 0.3));
      if (groundMaterial) ground.material = groundMaterial;
    }

    // 设置点击事件
    scene.onPointerObservable.add((pointerInfo) => {
      switch (pointerInfo.type) {
        case PointerEventTypes.POINTERDOWN:
          if (pointerInfo.pickInfo?.hit && pointerInfo.pickInfo.pickedMesh) {
            const pickedMesh = pointerInfo.pickInfo.pickedMesh;
            if (pickedMesh.name.startsWith('mesh_')) {
              dispatch({ type: 'SELECT_MESH', payload: pickedMesh as any });
              setSelectedMeshName(pickedMesh.name);
              
              // 高亮选中的物体
              highlightMesh(pickedMesh as any);
            }
          }
          break;
      }
    });

    dispatch({ type: 'SET_SCENE', payload: scene });
  };

  const highlightMesh = (mesh: any) => {
    // 重置所有网格的缩放
    state.meshes.forEach(m => {
      m.scaling = Vector3.One();
    });

    // 放大选中的网格
    mesh.scaling = new Vector3(1.2, 1.2, 1.2);
  };

  const animateSelected = () => {
    if (!state.selectedMesh || !scene) return;

    const mesh = state.selectedMesh;
    const originalY = mesh.position.y;

    // 创建跳跃动画
    const jumpAnimation = scene.beginAnimation(mesh, 0, 60, false);
    // 这里可以添加具体的动画逻辑
  };

  const changeColor = (color: Color3) => {
    if (!state.selectedMesh) return;

    const material = state.selectedMesh.material as any;
    if (material) {
      material.diffuseColor = color;
      material.emissiveColor = color.scale(0.1);
    }
  };

  if (!isReady) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>加载交互式 3D 场景中...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} />
      
      <PerformanceMonitor scene={scene} engine={engine} />
      
      <div className={styles.controls}>
        <h3>场景控制</h3>
        
        <div className={styles.section}>
          <p><strong>选中物体:</strong> {selectedMeshName || '无'}</p>
          <p><strong>提示:</strong> 点击物体来选择它们</p>
        </div>

        {state.selectedMesh && (
          <div className={styles.section}>
            <h4>物体操作</h4>
            <button
              className={styles.button}
              onClick={animateSelected}
            >
              跳跃动画
            </button>
            
            <h4>颜色选择</h4>
            <div className={styles.colorPalette}>
              {[
                new Color3(1, 0, 0),
                new Color3(0, 1, 0),
                new Color3(0, 0, 1),
                new Color3(1, 1, 0),
                new Color3(1, 0, 1),
                new Color3(0, 1, 1),
              ].map((color, index) => (
                <button
                  key={index}
                  className={styles.colorButton}
                  style={{
                    backgroundColor: `rgb(${color.r * 255}, ${color.g * 255}, ${color.b * 255})`
                  }}
                  onClick={() => changeColor(color)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveScene;
```

---

## 8. 部署和生产环境

### 8.1 Next.js 配置优化

**next.config.js**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // 优化 Babylon.js 打包
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // 客户端特定配置
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    
    return config;
  },
  
  // 静态资源优化
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // 实验性功能
  experimental: {
    optimizeCss: true,
  },
};

module.exports = nextConfig;
```

### 8.2 环境变量配置

**.env.local**
```env
# 开发环境
NEXT_PUBLIC_BABYLON_DEBUG=true
NEXT_PUBLIC_MODELS_PATH=/models
NEXT_PUBLIC_TEXTURES_PATH=/textures

# API 配置
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

**.env.production**
```env
# 生产环境
NEXT_PUBLIC_BABYLON_DEBUG=false
NEXT_PUBLIC_MODELS_PATH=https://cdn.example.com/models
NEXT_PUBLIC_TEXTURES_PATH=https://cdn.example.com/textures

NEXT_PUBLIC_API_BASE_URL=https://api.example.com
```

### 8.3 部署脚本

**package.json**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "analyze": "ANALYZE=true next build",
    "export": "next export",
    "deploy": "npm run build && npm run export"
  }
}
```

### 8.4 性能优化检查清单

- [ ] 使用动态导入避免 SSR 问题
- [ ] 优化 Babylon.js 模块加载
- [ ] 实现代码分割和懒加载
- [ ] 压缩和优化 3D 资源
- [ ] 添加加载状态和错误处理
- [ ] 实现内存管理和清理
- [ ] 配置 CDN 和缓存策略
- [ ] 监控性能指标

---

## 总结

这份学习笔记涵盖了 Next.js 与 Babylon.js 集成的核心概念和实践方法：

1. **项目设置**: 正确配置 TypeScript、依赖和项目结构
2. **组件化开发**: 创建可复用的 3D 组件和自定义 Hook
3. **SSR 处理**: 解决服务端渲染兼容性问题
4. **状态管理**: 使用 Context API 管理 3D 场景状态
5. **性能优化**: 代码分割、懒加载和内存管理
6. **实际应用**: 构建交互式 3D Web 应用

## 完整项目示例

在 `examples/nextjs-babylon-demo/` 目录中，我们提供了一个完整的工作示例：

### 项目特点
- ✅ **SSR 兼容**: 使用动态导入避免服务器端渲染问题
- ✅ **TypeScript 支持**: 完整的类型定义和类型安全
- ✅ **响应式设计**: 自动适应不同屏幕尺寸
- ✅ **交互功能**: 鼠标控制、点击事件、动画效果
- ✅ **性能优化**: 代码分割、资源懒加载
- ✅ **错误处理**: 完善的错误边界和加载状态
- ✅ **开发友好**: 热重载、调试工具、性能监控

### 核心文件结构
```
nextjs-babylon-demo/
├── package.json          # 项目依赖和脚本配置
├── next.config.js        # Next.js 和 Webpack 优化配置
├── tsconfig.json         # TypeScript 编译配置
├── next-env.d.ts         # Next.js 和 Babylon.js 类型声明
├── pages/
│   ├── _app.js          # 应用程序全局配置
│   ├── _document.js     # HTML 文档结构和 WebGL 检测
│   └── index.js         # 主页面和动态导入设置
├── components/
│   └── BabylonScene.js  # 核心 3D 场景组件
└── README.md            # 项目文档和使用说明
```

### 快速开始

1. **进入示例目录**
```bash
cd examples/nextjs-babylon-demo
```

2. **安装依赖**
```bash
npm install
```

3. **启动开发服务器**
```bash
npm run dev
```

4. **打开浏览器访问**
```
http://localhost:3000
```

### 示例功能展示

- **3D 场景渲染**: 立方体、球体、地面等基础几何体
- **实时动画**: 自动旋转和浮动效果
- **用户交互**: 鼠标拖拽视角、滚轮缩放、点击物体
- **材质系统**: 不同颜色和光照效果
- **性能监控**: FPS 显示和场景统计信息
- **加载状态**: 优雅的加载动画和错误处理

这个示例项目可以作为你开发更复杂 3D Web 应用的起点，展示了 Next.js 和 Babylon.js 集成的最佳实践。

## 后续学习方向

基于这个基础，你可以继续探索：

- **高级渲染**: PBR 材质、后期处理、阴影和反射
- **物理模拟**: 碰撞检测、重力系统、粒子效果
- **模型加载**: GLTF/GLB 文件、纹理贴图、骨骼动画
- **用户界面**: 2D GUI 覆盖、HUD 元素、控制面板
- **数据可视化**: 图表渲染、科学可视化、交互式数据展示
- **游戏开发**: 角色控制、场景管理、音频集成

通过这个学习指南和示例项目，你已经掌握了使用 Next.js 和 Babylon.js 构建现代 3D Web 应用的核心技能！
2. **组件化**: 创建可复用的 3D 组件和自定义 Hook
3. **状态管理**: 使用 Context API 管理 3D 场景状态
4. **SSR 处理**: 解决服务端渲染的兼容性问题
5. **性能优化**: 实现代码分割、内存管理和监控
6. **实战应用**: 构建完整的交互式 3D 应用

通过这些技术，您可以构建现代化的、高性能的 3D Web 应用程序。

---

*最后更新: 2025年8月6日*
