# 3D 产品展示器项目

## 📱 项目概述

这是一个使用 Babylon.js 构建的交互式 3D 产品展示器，可以用于电商网站、产品目录或营销展示。用户可以 360° 查看产品、更换颜色/材质、查看产品细节等。

## ✨ 功能特点

- 🔄 360° 产品旋转查看
- 🎨 实时更换颜色和材质
- 🔍 产品细节放大查看
- 📱 移动端友好的触摸控制
- ⚡ 高性能渲染和加载
- 🛒 购物车集成接口
- 📊 用户行为数据收集

## 🎯 适用场景

- 电商产品展示页面
- 品牌官网产品介绍
- 虚拟展厅和展会
- 产品配置器
- 营销活动页面

---

## 🏗️ 项目结构

```
3d-product-viewer/
├── src/
│   ├── components/           # React 组件
│   │   ├── ProductViewer.tsx # 主要展示组件
│   │   ├── ConfigPanel.tsx  # 配置面板
│   │   ├── LoadingScreen.tsx # 加载屏幕
│   │   └── Controls.tsx     # 控制按钮
│   ├── babylon/             # Babylon.js 核心逻辑
│   │   ├── SceneManager.ts  # 场景管理器
│   │   ├── ProductLoader.ts # 产品模型加载
│   │   ├── MaterialSystem.ts # 材质系统
│   │   └── CameraController.ts # 摄像机控制
│   ├── utils/               # 工具函数
│   │   ├── performance.ts   # 性能优化
│   │   ├── analytics.ts     # 数据分析
│   │   └── helpers.ts       # 通用工具
│   └── types/               # TypeScript 类型定义
│       ├── Product.ts       # 产品数据类型
│       └── Config.ts        # 配置类型
├── public/
│   ├── models/              # 3D 模型文件
│   ├── textures/            # 纹理贴图
│   └── environments/        # 环境贴图
├── docs/                    # 项目文档
├── package.json
└── README.md
```

---

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install babylonjs babylonjs-loaders babylonjs-materials
npm install react react-dom typescript
npm install --save-dev @types/react @types/react-dom
```

### 2. 核心组件实现

#### ProductViewer.tsx
```tsx
import React, { useRef, useEffect, useState } from 'react';
import { SceneManager } from '../babylon/SceneManager';
import { ProductLoader } from '../babylon/ProductLoader';
import { ConfigPanel } from './ConfigPanel';
import { LoadingScreen } from './LoadingScreen';

interface Product {
  id: string;
  name: string;
  modelUrl: string;
  materials: Array<{
    id: string;
    name: string;
    previewColor: string;
    textures: {
      diffuse?: string;
      normal?: string;
      roughness?: string;
    };
  }>;
  variants: Array<{
    id: string;
    name: string;
    modelUrl: string;
  }>;
}

interface ProductViewerProps {
  product: Product;
  onConfigChange?: (config: any) => void;
  onPurchase?: (productId: string, config: any) => void;
}

export const ProductViewer: React.FC<ProductViewerProps> = ({
  product,
  onConfigChange,
  onPurchase
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sceneManager, setSceneManager] = useState<SceneManager | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMaterial, setCurrentMaterial] = useState(product.materials[0]);
  const [currentVariant, setCurrentVariant] = useState(product.variants[0]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const initScene = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 初始化场景管理器
        const manager = new SceneManager(canvasRef.current);
        await manager.initialize();

        // 加载产品模型
        const loader = new ProductLoader(manager.scene);
        await loader.loadProduct(currentVariant.modelUrl);

        // 应用初始材质
        loader.applyMaterial(currentMaterial);

        setSceneManager(manager);
        setIsLoading(false);

      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
        setIsLoading(false);
      }
    };

    initScene();

    return () => {
      sceneManager?.dispose();
    };
  }, []);

  const handleMaterialChange = async (material: typeof currentMaterial) => {
    if (!sceneManager) return;

    try {
      setCurrentMaterial(material);
      const loader = new ProductLoader(sceneManager.scene);
      await loader.applyMaterial(material);
      
      onConfigChange?.({
        materialId: material.id,
        variantId: currentVariant.id
      });
    } catch (err) {
      console.error('材质切换失败:', err);
    }
  };

  const handleVariantChange = async (variant: typeof currentVariant) => {
    if (!sceneManager) return;

    try {
      setIsLoading(true);
      setCurrentVariant(variant);
      
      const loader = new ProductLoader(sceneManager.scene);
      await loader.loadProduct(variant.modelUrl);
      await loader.applyMaterial(currentMaterial);
      
      setIsLoading(false);
      
      onConfigChange?.({
        materialId: currentMaterial.id,
        variantId: variant.id
      });
    } catch (err) {
      console.error('变体切换失败:', err);
      setIsLoading(false);
    }
  };

  const handlePurchase = () => {
    onPurchase?.(product.id, {
      materialId: currentMaterial.id,
      variantId: currentVariant.id
    });
  };

  if (error) {
    return (
      <div className="error-container">
        <h3>加载失败</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          重新加载
        </button>
      </div>
    );
  }

  return (
    <div className="product-viewer">
      <div className="canvas-container">
        <canvas ref={canvasRef} className="babylon-canvas" />
        {isLoading && <LoadingScreen />}
      </div>
      
      <ConfigPanel
        materials={product.materials}
        variants={product.variants}
        currentMaterial={currentMaterial}
        currentVariant={currentVariant}
        onMaterialChange={handleMaterialChange}
        onVariantChange={handleVariantChange}
        onPurchase={handlePurchase}
      />
    </div>
  );
};
```

#### SceneManager.ts
```typescript
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  DirectionalLight,
  Color3,
  Environment,
  DefaultRenderingPipeline
} from 'babylonjs';

export class SceneManager {
  public engine: Engine;
  public scene: Scene;
  public camera: ArcRotateCamera;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.engine = new Engine(canvas, true, {
      antialias: true,
      stencil: true,
      preserveDrawingBuffer: true
    });
  }

  async initialize(): Promise<void> {
    // 创建场景
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color3(0.9, 0.9, 0.9);

    // 设置摄像机
    this.setupCamera();
    
    // 设置光照
    this.setupLighting();
    
    // 设置环境
    await this.setupEnvironment();
    
    // 设置后期处理
    this.setupPostProcessing();
    
    // 启动渲染循环
    this.startRenderLoop();
    
    // 设置窗口大小调整
    this.setupResize();
  }

  private setupCamera(): void {
    this.camera = new ArcRotateCamera(
      'camera',
      -Math.PI / 2,
      Math.PI / 2.5,
      5,
      Vector3.Zero(),
      this.scene
    );

    // 设置摄像机限制
    this.camera.lowerRadiusLimit = 2;
    this.camera.upperRadiusLimit = 10;
    this.camera.lowerBetaLimit = 0.1;
    this.camera.upperBetaLimit = Math.PI - 0.1;

    // 启用控制
    this.camera.attachToCanvas(this.canvas, true);
    
    // 平滑控制
    this.camera.useFramingBehavior = true;
    this.camera.framingBehavior!.radiusScale = 1.2;
    this.camera.framingBehavior!.framingTime = 1500;
  }

  private setupLighting(): void {
    // 环境光
    const hemisphericLight = new HemisphericLight(
      'hemisphericLight',
      new Vector3(0, 1, 0),
      this.scene
    );
    hemisphericLight.intensity = 0.4;

    // 主光源
    const directionalLight = new DirectionalLight(
      'directionalLight',
      new Vector3(-1, -1, -1),
      this.scene
    );
    directionalLight.intensity = 0.8;
    directionalLight.position = new Vector3(5, 5, 5);

    // 补光
    const fillLight = new DirectionalLight(
      'fillLight',
      new Vector3(1, -0.5, 1),
      this.scene
    );
    fillLight.intensity = 0.3;
  }

  private async setupEnvironment(): Promise<void> {
    try {
      // 使用 HDR 环境贴图
      const environmentTexture = this.scene.createDefaultEnvironment({
        environmentTexture: './environments/studio.hdr',
        createSkybox: false,
        createGround: false
      });

      this.scene.environmentIntensity = 0.5;
    } catch (error) {
      console.warn('环境贴图加载失败，使用默认环境:', error);
      this.scene.createDefaultEnvironment();
    }
  }

  private setupPostProcessing(): void {
    // 默认渲染管线
    const pipeline = new DefaultRenderingPipeline(
      'defaultPipeline',
      true,
      this.scene
    );

    // 启用抗锯齿
    pipeline.fxaaEnabled = true;
    
    // 色调映射
    pipeline.imageProcessingEnabled = true;
    if (pipeline.imageProcessing) {
      pipeline.imageProcessing.toneMappingEnabled = true;
      pipeline.imageProcessing.toneMappingType = 1; // ACES
      pipeline.imageProcessing.exposure = 1.0;
    }
  }

  private startRenderLoop(): void {
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  private setupResize(): void {
    window.addEventListener('resize', () => {
      this.engine.resize();
    });
  }

  public dispose(): void {
    this.engine.dispose();
  }
}
```

#### ProductLoader.ts
```typescript
import {
  Scene,
  SceneLoader,
  AbstractMesh,
  PBRMaterial,
  Texture,
  Vector3
} from 'babylonjs';
import 'babylonjs-loaders';

interface MaterialConfig {
  id: string;
  name: string;
  textures: {
    diffuse?: string;
    normal?: string;
    roughness?: string;
    metallic?: string;
  };
  properties?: {
    metallicFactor?: number;
    roughnessFactor?: number;
    baseColor?: [number, number, number];
  };
}

export class ProductLoader {
  private scene: Scene;
  private currentMeshes: AbstractMesh[] = [];
  private materialCache = new Map<string, PBRMaterial>();

  constructor(scene: Scene) {
    this.scene = scene;
  }

  async loadProduct(modelUrl: string): Promise<AbstractMesh[]> {
    // 清除之前的模型
    this.clearCurrentMeshes();

    try {
      const result = await SceneLoader.ImportMeshAsync(
        '',
        '',
        modelUrl,
        this.scene,
        (progress) => {
          const percentage = (progress.loaded / progress.total) * 100;
          console.log(`加载进度: ${percentage.toFixed(1)}%`);
        }
      );

      this.currentMeshes = result.meshes;
      
      // 优化模型
      this.optimizeMeshes();
      
      // 居中模型
      this.centerModel();

      return this.currentMeshes;
    } catch (error) {
      console.error('模型加载失败:', error);
      throw new Error(`模型加载失败: ${error}`);
    }
  }

  async applyMaterial(config: MaterialConfig): Promise<void> {
    const material = await this.getMaterial(config);
    
    this.currentMeshes.forEach(mesh => {
      if (mesh.material) {
        mesh.material = material;
      }
    });
  }

  private async getMaterial(config: MaterialConfig): Promise<PBRMaterial> {
    if (this.materialCache.has(config.id)) {
      return this.materialCache.get(config.id)!;
    }

    const material = new PBRMaterial(config.name, this.scene);
    
    // 设置基础属性
    if (config.properties) {
      material.metallicFactor = config.properties.metallicFactor ?? 0;
      material.roughnessFactor = config.properties.roughnessFactor ?? 0.5;
      
      if (config.properties.baseColor) {
        material.baseColor.fromArray(config.properties.baseColor);
      }
    }

    // 加载纹理
    if (config.textures.diffuse) {
      material.baseTexture = new Texture(config.textures.diffuse, this.scene);
    }
    
    if (config.textures.normal) {
      material.bumpTexture = new Texture(config.textures.normal, this.scene);
    }
    
    if (config.textures.roughness) {
      material.metallicRoughnessTexture = new Texture(config.textures.roughness, this.scene);
    }

    this.materialCache.set(config.id, material);
    return material;
  }

  private optimizeMeshes(): void {
    this.currentMeshes.forEach(mesh => {
      // 启用实例化
      mesh.isPickable = true;
      
      // 优化渲染
      if (mesh.geometry) {
        mesh.freezeWorldMatrix();
      }
    });
  }

  private centerModel(): void {
    if (this.currentMeshes.length === 0) return;

    // 计算包围盒
    let min = Vector3.One().scale(Number.MAX_VALUE);
    let max = Vector3.One().scale(-Number.MAX_VALUE);

    this.currentMeshes.forEach(mesh => {
      const boundingInfo = mesh.getBoundingInfo();
      Vector3.MinimizeInPlace(min, boundingInfo.boundingBox.minimumWorld);
      Vector3.MaximizeInPlace(max, boundingInfo.boundingBox.maximumWorld);
    });

    // 计算中心点和缩放
    const center = Vector3.Center(min, max);
    const size = max.subtract(min);
    const maxSize = Math.max(size.x, size.y, size.z);
    const scale = 2 / maxSize; // 标准化到2个单位大小

    this.currentMeshes.forEach(mesh => {
      mesh.position.subtractInPlace(center);
      mesh.scaling.scaleInPlace(scale);
    });
  }

  private clearCurrentMeshes(): void {
    this.currentMeshes.forEach(mesh => {
      mesh.dispose();
    });
    this.currentMeshes = [];
  }

  public dispose(): void {
    this.clearCurrentMeshes();
    this.materialCache.forEach(material => material.dispose());
    this.materialCache.clear();
  }
}
```

---

## 🎨 样式设计

### CSS 样式
```css
.product-viewer {
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.canvas-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.babylon-canvas {
  width: 100%;
  height: 100%;
  outline: none;
  touch-action: none;
}

.config-panel {
  width: 320px;
  background: white;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  padding: 20px;
}

.material-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin: 20px 0;
}

.material-option {
  aspect-ratio: 1;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.material-option:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.material-option.active {
  border-color: #007bff;
  box-shadow: 0 0 0 4px rgba(0, 123, 255, 0.25);
}

.purchase-button {
  width: 100%;
  padding: 15px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s ease;
}

.purchase-button:hover {
  background: #218838;
}

.loading-screen {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .product-viewer {
    flex-direction: column;
  }
  
  .config-panel {
    width: 100%;
    height: 200px;
    order: 2;
  }
  
  .canvas-container {
    order: 1;
    height: calc(100vh - 200px);
  }
  
  .material-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}
```

---

## 📱 移动端优化

### 触摸控制增强
```typescript
class TouchController {
  private scene: Scene;
  private camera: ArcRotateCamera;
  private canvas: HTMLCanvasElement;

  constructor(scene: Scene, camera: ArcRotateCamera, canvas: HTMLCanvasElement) {
    this.scene = scene;
    this.camera = camera;
    this.canvas = canvas;
    this.setupTouchControls();
  }

  private setupTouchControls(): void {
    // 禁用默认触摸行为
    this.canvas.style.touchAction = 'none';

    // 双击缩放
    let lastTap = 0;
    this.canvas.addEventListener('touchend', (e) => {
      const currentTime = Date.now();
      const tapLength = currentTime - lastTap;
      
      if (tapLength < 500 && tapLength > 0) {
        // 双击检测
        this.handleDoubleTap(e);
      }
      lastTap = currentTime;
    });

    // 捏合缩放
    let initialDistance = 0;
    let lastScale = 1;

    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        initialDistance = this.getDistance(e.touches[0], e.touches[1]);
        lastScale = this.camera.radius;
      }
    });

    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
        const scale = currentDistance / initialDistance;
        
        this.camera.radius = lastScale / scale;
        this.camera.radius = Math.max(
          this.camera.lowerRadiusLimit,
          Math.min(this.camera.upperRadiusLimit, this.camera.radius)
        );
      }
    });
  }

  private handleDoubleTap(e: TouchEvent): void {
    // 重置摄像机到默认位置
    this.camera.setTarget(Vector3.Zero());
    this.camera.alpha = -Math.PI / 2;
    this.camera.beta = Math.PI / 2.5;
    this.camera.radius = 5;
  }

  private getDistance(touch1: Touch, touch2: Touch): number {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
```

---

## 📊 数据分析集成

### 用户行为追踪
```typescript
class AnalyticsTracker {
  private productId: string;
  private sessionId: string;
  private events: Array<{
    type: string;
    timestamp: number;
    data: any;
  }> = [];

  constructor(productId: string) {
    this.productId = productId;
    this.sessionId = this.generateSessionId();
  }

  trackProductView(): void {
    this.trackEvent('product_view', {
      productId: this.productId
    });
  }

  trackMaterialChange(materialId: string): void {
    this.trackEvent('material_change', {
      productId: this.productId,
      materialId
    });
  }

  trackCameraInteraction(type: 'rotate' | 'zoom' | 'pan'): void {
    this.trackEvent('camera_interaction', {
      productId: this.productId,
      interactionType: type
    });
  }

  trackPurchaseIntent(): void {
    this.trackEvent('purchase_intent', {
      productId: this.productId,
      sessionDuration: Date.now() - this.events[0]?.timestamp
    });
  }

  private trackEvent(type: string, data: any): void {
    const event = {
      type,
      timestamp: Date.now(),
      data: {
        ...data,
        sessionId: this.sessionId,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    };

    this.events.push(event);
    
    // 发送到分析服务
    this.sendToAnalytics(event);
  }

  private sendToAnalytics(event: any): void {
    // 集成 Google Analytics, Mixpanel 等
    if (typeof gtag !== 'undefined') {
      gtag('event', event.type, event.data);
    }
    
    // 或发送到自定义分析端点
    fetch('/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    }).catch(err => console.warn('Analytics error:', err));
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
```

---

## 🛒 电商集成

### 购物车接口
```typescript
interface CartItem {
  productId: string;
  variantId: string;
  materialId: string;
  quantity: number;
  price: number;
  customizations?: Record<string, any>;
}

class EcommerceIntegration {
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string) {
    this.apiBaseUrl = apiBaseUrl;
  }

  async addToCart(item: CartItem): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(item)
      });

      return response.ok;
    } catch (error) {
      console.error('添加到购物车失败:', error);
      return false;
    }
  }

  async getProductConfig(productId: string): Promise<Product> {
    const response = await fetch(`${this.apiBaseUrl}/products/${productId}/3d-config`);
    return response.json();
  }

  async getPrice(productId: string, config: any): Promise<number> {
    const response = await fetch(`${this.apiBaseUrl}/products/${productId}/price`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    });
    
    const data = await response.json();
    return data.price;
  }

  private getAuthToken(): string {
    return localStorage.getItem('auth_token') || '';
  }
}
```

---

## 🎯 使用示例

### 基础集成
```tsx
import React from 'react';
import { ProductViewer } from './src/components/ProductViewer';

const App: React.FC = () => {
  const sampleProduct = {
    id: 'sneaker-001',
    name: 'Classic Sneaker',
    modelUrl: './models/sneaker.glb',
    materials: [
      {
        id: 'white-leather',
        name: '白色皮革',
        previewColor: '#ffffff',
        textures: {
          diffuse: './textures/white-leather-diffuse.jpg',
          normal: './textures/leather-normal.jpg',
          roughness: './textures/leather-roughness.jpg'
        }
      },
      {
        id: 'black-leather',
        name: '黑色皮革',
        previewColor: '#333333',
        textures: {
          diffuse: './textures/black-leather-diffuse.jpg',
          normal: './textures/leather-normal.jpg',
          roughness: './textures/leather-roughness.jpg'
        }
      }
    ],
    variants: [
      {
        id: 'size-42',
        name: '42码',
        modelUrl: './models/sneaker-42.glb'
      },
      {
        id: 'size-43',
        name: '43码',
        modelUrl: './models/sneaker-43.glb'
      }
    ]
  };

  const handleConfigChange = (config: any) => {
    console.log('配置变更:', config);
    // 更新价格、库存等信息
  };

  const handlePurchase = (productId: string, config: any) => {
    console.log('购买产品:', productId, config);
    // 跳转到结算页面
  };

  return (
    <div className="App">
      <ProductViewer
        product={sampleProduct}
        onConfigChange={handleConfigChange}
        onPurchase={handlePurchase}
      />
    </div>
  );
};

export default App;
```

---

## 🚀 部署和优化

### 性能优化建议
1. **模型优化**: 使用 Draco 压缩，控制多边形数量
2. **纹理优化**: 合理尺寸，使用压缩格式
3. **加载优化**: 实现渐进式加载和预缓存
4. **移动端优化**: 降低渲染质量，简化材质

### 部署配置
```javascript
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        babylon: {
          test: /[\\/]node_modules[\\/]babylonjs/,
          name: 'babylon',
          chunks: 'all'
        }
      }
    }
  },
  module: {
    rules: [
      {
        test: /\.(glb|gltf|babylon)$/,
        use: {
          loader: 'file-loader',
          options: {
            outputPath: 'models/'
          }
        }
      }
    ]
  }
};
```

这个 3D 产品展示器项目提供了完整的电商级 3D 展示解决方案，可以根据具体需求进行定制和扩展。
