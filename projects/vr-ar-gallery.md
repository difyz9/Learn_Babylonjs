# VR/AR 虚拟展厅项目

## 🏛️ 项目概述

使用 Babylon.js 构建的沉浸式虚拟展厅应用，支持 VR/AR 设备，可用于艺术展览、博物馆、产品展示、房地产销售等场景。提供跨平台的3D虚拟现实体验。

## ✨ 核心功能

- 🥽 **VR 支持**: Oculus, HTC Vive, PICO 等设备
- 📱 **AR 模式**: 移动端 WebXR AR 体验
- 🚶 **虚拟漫游**: 自由移动和传送导航
- 🎨 **交互式展品**: 点击查看详情、3D 模型
- 🔊 **空间音效**: 3D 音频和语音导览
- 📐 **动态布局**: 可配置的展厅布局
- 👥 **多人协作**: 多用户同时访问
- 📊 **数据分析**: 访客行为热力图

## 🎯 应用场景

- 艺术画廊和博物馆虚拟展览
- 房地产虚拟看房
- 汽车展厅和产品发布会
- 教育培训和虚拟实验室
- 会议展览和商贸展示

---

## 🏗️ 项目架构

```
vr-gallery/
├── src/
│   ├── core/                    # 核心系统
│   │   ├── VRManager.ts         # VR/AR 管理器
│   │   ├── SceneManager.ts      # 场景管理
│   │   ├── NavigationSystem.ts  # 导航系统
│   │   └── InteractionSystem.ts # 交互系统
│   ├── components/              # 功能组件
│   │   ├── Gallery.tsx          # 主展厅组件
│   │   ├── ExhibitItem.tsx      # 展品组件
│   │   ├── VRController.tsx     # VR 控制器
│   │   └── AROverlay.tsx        # AR 界面覆盖
│   ├── exhibits/                # 展品系统
│   │   ├── ExhibitManager.ts    # 展品管理
│   │   ├── ArtworkLoader.ts     # 艺术品加载
│   │   └── InfoPanel.ts         # 信息面板
│   ├── audio/                   # 音频系统
│   │   ├── AudioManager.ts      # 音频管理
│   │   └── SpatialAudio.ts      # 空间音频
│   ├── networking/              # 网络功能
│   │   ├── MultiUser.ts         # 多用户支持
│   │   └── DataSync.ts          # 数据同步
│   └── analytics/               # 分析系统
│       ├── HeatmapTracker.ts    # 热力图追踪
│       └── VisitorAnalytics.ts  # 访客分析
├── assets/
│   ├── models/                  # 3D 模型
│   ├── textures/                # 纹理贴图
│   ├── audio/                   # 音频文件
│   └── exhibits/                # 展品数据
├── public/
│   ├── gallery-config.json      # 展厅配置
│   └── exhibits-data.json       # 展品数据
└── docs/                        # 项目文档
```

---

## 🚀 快速开始

### 1. 环境准备

```bash
npm install babylonjs babylonjs-loaders babylonjs-materials
npm install babylonjs-gltf2-interface babylonjs-post-process
npm install react react-dom typescript
npm install socket.io-client three-audio
```

### 2. VR/AR 管理器

#### VRManager.ts
```typescript
import {
  Scene,
  WebXRDefaultExperience,
  WebXRFeatureName,
  Vector3,
  Camera,
  WebXRCamera,
  Ray,
  PickingInfo
} from 'babylonjs';

export class VRManager {
  private scene: Scene;
  private xrExperience?: WebXRDefaultExperience;
  private onSelectionCallback?: (pickInfo: PickingInfo) => void;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  async initializeVR(): Promise<boolean> {
    try {
      // 检查 WebXR 支持
      const supported = await WebXRDefaultExperience.IsWebXRSupportedAsync();
      if (!supported) {
        console.warn('WebXR not supported on this device');
        return false;
      }

      // 创建 WebXR 体验
      this.xrExperience = await this.scene.createDefaultXRExperienceAsync({
        floorMeshes: [], // 将在场景设置后添加
        optionalFeatures: true
      });

      await this.setupVRFeatures();
      this.setupVRInteractions();
      
      return true;
    } catch (error) {
      console.error('VR initialization failed:', error);
      return false;
    }
  }

  private async setupVRFeatures(): Promise<void> {
    if (!this.xrExperience) return;

    const featureManager = this.xrExperience.featuresManager;

    // 启用手部追踪
    if (featureManager.isFeatureSupported(WebXRFeatureName.HAND_TRACKING)) {
      const handTracking = featureManager.enableFeature(
        WebXRFeatureName.HAND_TRACKING,
        'latest'
      );
    }

    // 启用传送移动
    if (featureManager.isFeatureSupported(WebXRFeatureName.TELEPORTATION)) {
      const teleportation = featureManager.enableFeature(
        WebXRFeatureName.TELEPORTATION,
        'stable',
        {
          xrInput: this.xrExperience.input,
          floorMeshes: [], // 稍后设置
          timeToTeleport: 3000,
          useMainComponentOnly: true
        }
      );
    }

    // 启用物理移动
    if (featureManager.isFeatureSupported(WebXRFeatureName.MOVEMENT)) {
      const movement = featureManager.enableFeature(
        WebXRFeatureName.MOVEMENT,
        'stable',
        {
          xrInput: this.xrExperience.input,
          movementOrientationFollowsViewerPose: true,
          movementSpeed: 1.0
        }
      );
    }

    // 启用点选交互
    if (featureManager.isFeatureSupported(WebXRFeatureName.POINTER_SELECTION)) {
      const pointerSelection = featureManager.enableFeature(
        WebXRFeatureName.POINTER_SELECTION,
        'stable',
        {
          xrInput: this.xrExperience.input,
          enablePointerSelectionOnAllControllers: true
        }
      );
    }
  }

  private setupVRInteractions(): void {
    if (!this.xrExperience) return;

    // 监听控制器选择事件
    this.xrExperience.input.onControllerAddedObservable.add((controller) => {
      controller.onMotionControllerInitObservable.add((motionController) => {
        // 主按钮（触发器）
        const triggerComponent = motionController.getMainComponent();
        if (triggerComponent) {
          triggerComponent.onButtonStateChangedObservable.add((component) => {
            if (component.pressed) {
              this.handleVRSelection();
            }
          });
        }

        // 侧面按钮（菜单）
        const menuComponent = motionController.getComponent('menu');
        if (menuComponent) {
          menuComponent.onButtonStateChangedObservable.add((component) => {
            if (component.pressed) {
              this.toggleMenu();
            }
          });
        }
      });
    });
  }

  private handleVRSelection(): void {
    if (!this.xrExperience) return;

    // 从控制器发射射线
    const camera = this.xrExperience.camera;
    const ray = new Ray(camera.position, camera.getForwardRay().direction);
    
    const pickInfo = this.scene.pickWithRay(ray);
    if (pickInfo?.hit && this.onSelectionCallback) {
      this.onSelectionCallback(pickInfo);
    }
  }

  private toggleMenu(): void {
    // 显示/隐藏 VR 菜单
    console.log('Toggle VR menu');
  }

  public setSelectionCallback(callback: (pickInfo: PickingInfo) => void): void {
    this.onSelectionCallback = callback;
  }

  public isInVR(): boolean {
    return this.xrExperience?.baseExperience.state === 'IN_XR';
  }

  public exitVR(): void {
    this.xrExperience?.baseExperience.exitXRAsync();
  }

  public dispose(): void {
    this.xrExperience?.dispose();
  }
}
```

### 3. 虚拟展厅场景

#### Gallery.tsx
```tsx
import React, { useRef, useEffect, useState } from 'react';
import { SceneManager } from '../core/SceneManager';
import { VRManager } from '../core/VRManager';
import { ExhibitManager } from '../exhibits/ExhibitManager';
import { AudioManager } from '../audio/AudioManager';

interface ExhibitData {
  id: string;
  title: string;
  description: string;
  type: 'painting' | '3d-model' | 'video' | 'interactive';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  mediaUrl: string;
  audioUrl?: string;
  metadata: Record<string, any>;
}

interface GalleryConfig {
  id: string;
  name: string;
  description: string;
  environment: {
    skybox: string;
    lighting: 'natural' | 'gallery' | 'dramatic';
    floorTexture: string;
    wallTexture: string;
  };
  layout: {
    rooms: Array<{
      id: string;
      name: string;
      bounds: {
        min: [number, number, number];
        max: [number, number, number];
      };
      exhibits: string[];
    }>;
  };
  audio: {
    backgroundMusic?: string;
    spatialAudio: boolean;
    volume: number;
  };
}

interface GalleryProps {
  config: GalleryConfig;
  exhibits: ExhibitData[];
  enableVR?: boolean;
  enableAR?: boolean;
  onExhibitSelect?: (exhibit: ExhibitData) => void;
}

export const Gallery: React.FC<GalleryProps> = ({
  config,
  exhibits,
  enableVR = true,
  enableAR = false,
  onExhibitSelect
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sceneManager, setSceneManager] = useState<SceneManager | null>(null);
  const [vrManager, setVRManager] = useState<VRManager | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVRSupported, setIsVRSupported] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(config.layout.rooms[0]);
  const [selectedExhibit, setSelectedExhibit] = useState<ExhibitData | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const initGallery = async () => {
      try {
        setIsLoading(true);

        // 初始化场景管理器
        const sceneMgr = new SceneManager(canvasRef.current!);
        await sceneMgr.initialize();
        
        // 构建展厅环境
        await buildGalleryEnvironment(sceneMgr, config);
        
        // 加载展品
        const exhibitMgr = new ExhibitManager(sceneMgr.scene);
        await exhibitMgr.loadExhibits(exhibits);
        
        // 设置交互
        setupInteractions(sceneMgr, exhibitMgr);
        
        // 初始化音频
        const audioMgr = new AudioManager(sceneMgr.scene);
        await audioMgr.initialize(config.audio);
        
        // 初始化 VR（如果支持）
        if (enableVR) {
          const vrMgr = new VRManager(sceneMgr.scene);
          const vrSupported = await vrMgr.initializeVR();
          
          if (vrSupported) {
            setIsVRSupported(true);
            setVRManager(vrMgr);
            vrMgr.setSelectionCallback(handleVRSelection);
          }
        }

        setSceneManager(sceneMgr);
        setIsLoading(false);

      } catch (error) {
        console.error('Gallery initialization failed:', error);
        setIsLoading(false);
      }
    };

    initGallery();

    return () => {
      sceneManager?.dispose();
      vrManager?.dispose();
    };
  }, [config, exhibits]);

  const buildGalleryEnvironment = async (
    sceneMgr: SceneManager, 
    config: GalleryConfig
  ) => {
    // 构建展厅环境的详细实现
    await sceneMgr.loadEnvironment(config.environment);
    await sceneMgr.createRooms(config.layout.rooms);
  };

  const setupInteractions = (
    sceneMgr: SceneManager, 
    exhibitMgr: ExhibitManager
  ) => {
    // 鼠标/触摸交互
    sceneMgr.scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.pickInfo?.hit) {
        const mesh = pointerInfo.pickInfo.pickedMesh;
        const exhibit = exhibitMgr.getExhibitByMesh(mesh);
        
        if (exhibit) {
          handleExhibitSelection(exhibit);
        }
      }
    });
  };

  const handleVRSelection = (pickInfo: any) => {
    // VR 选择处理
    console.log('VR selection:', pickInfo);
  };

  const handleExhibitSelection = (exhibit: ExhibitData) => {
    setSelectedExhibit(exhibit);
    onExhibitSelect?.(exhibit);
  };

  const enterVR = async () => {
    if (vrManager) {
      // VR 模式已在 VRManager 中处理
      console.log('Entering VR mode...');
    }
  };

  const navigateToRoom = (roomId: string) => {
    const room = config.layout.rooms.find(r => r.id === roomId);
    if (room && sceneManager) {
      setCurrentRoom(room);
      sceneManager.navigateToRoom(room);
    }
  };

  return (
    <div className="gallery-container">
      <canvas ref={canvasRef} className="gallery-canvas" />
      
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>加载虚拟展厅中...</p>
        </div>
      )}

      {/* VR 控制面板 */}
      {isVRSupported && (
        <div className="vr-controls">
          <button onClick={enterVR} className="vr-button">
            🥽 进入 VR 模式
          </button>
        </div>
      )}

      {/* 房间导航 */}
      <div className="room-navigation">
        <h3>展厅导航</h3>
        {config.layout.rooms.map(room => (
          <button
            key={room.id}
            onClick={() => navigateToRoom(room.id)}
            className={`room-button ${currentRoom.id === room.id ? 'active' : ''}`}
          >
            {room.name}
          </button>
        ))}
      </div>

      {/* 展品信息面板 */}
      {selectedExhibit && (
        <div className="exhibit-info-panel">
          <h3>{selectedExhibit.title}</h3>
          <p>{selectedExhibit.description}</p>
          <div className="exhibit-metadata">
            {Object.entries(selectedExhibit.metadata).map(([key, value]) => (
              <div key={key}>
                <strong>{key}:</strong> {value}
              </div>
            ))}
          </div>
          <button onClick={() => setSelectedExhibit(null)}>
            关闭
          </button>
        </div>
      )}
    </div>
  );
};
```

### 4. 展品管理系统

#### ExhibitManager.ts
```typescript
import {
  Scene,
  AbstractMesh,
  Vector3,
  SceneLoader,
  StandardMaterial,
  Texture,
  PlaneBuilder,
  VideoTexture,
  ActionManager,
  ExecuteCodeAction,
  ActionEvent
} from 'babylonjs';

interface ExhibitData {
  id: string;
  title: string;
  description: string;
  type: 'painting' | '3d-model' | 'video' | 'interactive';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  mediaUrl: string;
  audioUrl?: string;
  metadata: Record<string, any>;
}

export class ExhibitManager {
  private scene: Scene;
  private exhibits = new Map<string, AbstractMesh>();
  private exhibitData = new Map<AbstractMesh, ExhibitData>();
  private onExhibitClick?: (exhibit: ExhibitData) => void;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  async loadExhibits(exhibits: ExhibitData[]): Promise<void> {
    for (const exhibit of exhibits) {
      await this.loadExhibit(exhibit);
    }
  }

  private async loadExhibit(data: ExhibitData): Promise<AbstractMesh | null> {
    let mesh: AbstractMesh | null = null;

    try {
      switch (data.type) {
        case 'painting':
          mesh = await this.createPaintingExhibit(data);
          break;
        case '3d-model':
          mesh = await this.create3DModelExhibit(data);
          break;
        case 'video':
          mesh = await this.createVideoExhibit(data);
          break;
        case 'interactive':
          mesh = await this.createInteractiveExhibit(data);
          break;
      }

      if (mesh) {
        // 设置位置、旋转、缩放
        mesh.position = Vector3.FromArray(data.position);
        mesh.rotation = Vector3.FromArray(data.rotation);
        mesh.scaling = Vector3.FromArray(data.scale);

        // 添加交互
        this.setupExhibitInteraction(mesh, data);

        // 存储引用
        this.exhibits.set(data.id, mesh);
        this.exhibitData.set(mesh, data);
      }

      return mesh;
    } catch (error) {
      console.error(`Failed to load exhibit ${data.id}:`, error);
      return null;
    }
  }

  private async createPaintingExhibit(data: ExhibitData): Promise<AbstractMesh> {
    // 创建画框
    const frame = PlaneBuilder.CreatePlane(
      `painting-${data.id}`,
      { width: 2, height: 1.5 },
      this.scene
    );

    // 创建材质并加载图片
    const material = new StandardMaterial(`material-${data.id}`, this.scene);
    material.diffuseTexture = new Texture(data.mediaUrl, this.scene);
    material.emissiveTexture = material.diffuseTexture;
    material.emissiveColor.setAll(0.1); // 轻微发光效果

    frame.material = material;

    // 创建相框边框
    const frameThickness = 0.1;
    const frameBorder = PlaneBuilder.CreatePlane(
      `frame-${data.id}`,
      { width: 2.2, height: 1.7 },
      this.scene
    );
    
    const frameMaterial = new StandardMaterial(`frame-material-${data.id}`, this.scene);
    frameMaterial.diffuseColor.setAll(0.8); // 金色相框
    frameBorder.material = frameMaterial;
    frameBorder.position.z = -0.01; // 稍微后移

    // 合并为一个物体
    frame.parent = frameBorder;
    return frameBorder;
  }

  private async create3DModelExhibit(data: ExhibitData): Promise<AbstractMesh> {
    const result = await SceneLoader.ImportMeshAsync(
      '',
      '',
      data.mediaUrl,
      this.scene
    );

    if (result.meshes.length === 0) {
      throw new Error('No meshes found in 3D model');
    }

    // 创建容器
    const container = result.meshes[0];
    container.name = `exhibit-${data.id}`;

    // 优化模型
    result.meshes.forEach(mesh => {
      mesh.isPickable = true;
      mesh.checkCollisions = false; // 除非需要碰撞检测
    });

    return container;
  }

  private async createVideoExhibit(data: ExhibitData): Promise<AbstractMesh> {
    // 创建视频屏幕
    const screen = PlaneBuilder.CreatePlane(
      `video-${data.id}`,
      { width: 3, height: 2 },
      this.scene
    );

    // 创建视频纹理
    const videoTexture = new VideoTexture(
      `video-texture-${data.id}`,
      data.mediaUrl,
      this.scene,
      {
        autoPlay: false,
        loop: true,
        muted: true
      }
    );

    const material = new StandardMaterial(`video-material-${data.id}`, this.scene);
    material.diffuseTexture = videoTexture;
    material.emissiveTexture = videoTexture;
    material.emissiveColor.setAll(0.8);

    screen.material = material;

    // 添加播放控制
    this.setupVideoControls(screen, videoTexture, data);

    return screen;
  }

  private async createInteractiveExhibit(data: ExhibitData): Promise<AbstractMesh> {
    // 创建交互式展品（可以是模型+信息面板的组合）
    const container = new AbstractMesh(`interactive-${data.id}`, this.scene);

    // 根据具体需求实现交互逻辑
    // 这里可以加载复杂的交互式内容

    return container;
  }

  private setupExhibitInteraction(mesh: AbstractMesh, data: ExhibitData): void {
    mesh.actionManager = new ActionManager(this.scene);

    // 点击事件
    mesh.actionManager.registerAction(
      new ExecuteCodeAction(
        ActionManager.OnPickTrigger,
        (evt: ActionEvent) => {
          this.handleExhibitClick(data);
        }
      )
    );

    // 悬停效果
    mesh.actionManager.registerAction(
      new ExecuteCodeAction(
        ActionManager.OnPointerOverTrigger,
        (evt: ActionEvent) => {
          this.highlightExhibit(mesh, true);
        }
      )
    );

    mesh.actionManager.registerAction(
      new ExecuteCodeAction(
        ActionManager.OnPointerOutTrigger,
        (evt: ActionEvent) => {
          this.highlightExhibit(mesh, false);
        }
      )
    );
  }

  private setupVideoControls(
    screen: AbstractMesh,
    videoTexture: VideoTexture,
    data: ExhibitData
  ): void {
    // 添加视频播放控制逻辑
    let isPlaying = false;

    screen.actionManager = new ActionManager(this.scene);
    screen.actionManager.registerAction(
      new ExecuteCodeAction(
        ActionManager.OnPickTrigger,
        (evt: ActionEvent) => {
          if (isPlaying) {
            videoTexture.video.pause();
          } else {
            videoTexture.video.play();
          }
          isPlaying = !isPlaying;
        }
      )
    );
  }

  private highlightExhibit(mesh: AbstractMesh, highlight: boolean): void {
    // 实现高亮效果
    if (mesh.material && 'emissiveColor' in mesh.material) {
      const material = mesh.material as StandardMaterial;
      if (highlight) {
        material.emissiveColor.setAll(0.3);
      } else {
        material.emissiveColor.setAll(0.1);
      }
    }
  }

  private handleExhibitClick(data: ExhibitData): void {
    console.log('Exhibit clicked:', data.title);
    this.onExhibitClick?.(data);
  }

  public setOnExhibitClick(callback: (exhibit: ExhibitData) => void): void {
    this.onExhibitClick = callback;
  }

  public getExhibitByMesh(mesh: AbstractMesh | null): ExhibitData | null {
    if (!mesh) return null;
    return this.exhibitData.get(mesh) || null;
  }

  public getExhibitById(id: string): AbstractMesh | null {
    return this.exhibits.get(id) || null;
  }

  public dispose(): void {
    this.exhibits.forEach(mesh => mesh.dispose());
    this.exhibits.clear();
    this.exhibitData.clear();
  }
}
```

---

## 🔊 空间音频系统

### AudioManager.ts
```typescript
import {
  Scene,
  Sound,
  Vector3,
  TransformNode,
  Observer
} from 'babylonjs';

interface AudioConfig {
  backgroundMusic?: string;
  spatialAudio: boolean;
  volume: number;
}

interface SpatialSoundConfig {
  id: string;
  url: string;
  position: Vector3;
  maxDistance: number;
  volume: number;
  loop: boolean;
  autoPlay: boolean;
}

export class AudioManager {
  private scene: Scene;
  private backgroundMusic?: Sound;
  private spatialSounds = new Map<string, Sound>();
  private globalVolume = 1.0;
  private enabled = true;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  async initialize(config: AudioConfig): Promise<void> {
    this.globalVolume = config.volume;

    // 加载背景音乐
    if (config.backgroundMusic) {
      await this.loadBackgroundMusic(config.backgroundMusic);
    }

    // 设置 Web Audio API 上下文
    if (config.spatialAudio) {
      this.setupSpatialAudio();
    }
  }

  private async loadBackgroundMusic(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.backgroundMusic = new Sound(
        'backgroundMusic',
        url,
        this.scene,
        () => {
          resolve();
        },
        {
          loop: true,
          autoplay: false,
          volume: this.globalVolume * 0.3,
          spatialSound: false
        }
      );
    });
  }

  private setupSpatialAudio(): void {
    // 启用场景的空间音频
    if (this.scene.audioEnabled) {
      // Web Audio API 已经通过 Babylon.js 自动设置
      console.log('Spatial audio enabled');
    }
  }

  public addSpatialSound(config: SpatialSoundConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      const sound = new Sound(
        config.id,
        config.url,
        this.scene,
        () => {
          resolve();
        },
        {
          loop: config.loop,
          autoplay: config.autoPlay,
          volume: config.volume * this.globalVolume,
          spatialSound: true,
          maxDistance: config.maxDistance,
          panningModel: 'HRTF',
          distanceModel: 'exponential'
        }
      );

      // 设置音频位置
      sound.setPosition(config.position);
      
      this.spatialSounds.set(config.id, sound);
    });
  }

  public attachSoundToMesh(soundId: string, mesh: TransformNode): void {
    const sound = this.spatialSounds.get(soundId);
    if (sound) {
      sound.attachToMesh(mesh);
    }
  }

  public playBackgroundMusic(): void {
    if (this.backgroundMusic && this.enabled) {
      this.backgroundMusic.play();
    }
  }

  public stopBackgroundMusic(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.stop();
    }
  }

  public playSpatialSound(id: string): void {
    const sound = this.spatialSounds.get(id);
    if (sound && this.enabled) {
      sound.play();
    }
  }

  public stopSpatialSound(id: string): void {
    const sound = this.spatialSounds.get(id);
    if (sound) {
      sound.stop();
    }
  }

  public setGlobalVolume(volume: number): void {
    this.globalVolume = Math.max(0, Math.min(1, volume));
    
    if (this.backgroundMusic) {
      this.backgroundMusic.setVolume(this.globalVolume * 0.3);
    }

    this.spatialSounds.forEach(sound => {
      const originalVolume = sound.metadata?.originalVolume || 1;
      sound.setVolume(originalVolume * this.globalVolume);
    });
  }

  public toggleAudio(): void {
    this.enabled = !this.enabled;
    
    if (this.enabled) {
      this.playBackgroundMusic();
    } else {
      this.stopBackgroundMusic();
      this.spatialSounds.forEach(sound => sound.stop());
    }
  }

  public dispose(): void {
    this.backgroundMusic?.dispose();
    this.spatialSounds.forEach(sound => sound.dispose());
    this.spatialSounds.clear();
  }
}
```

---

## 👥 多用户协作

### MultiUser.ts
```typescript
import { Scene, AbstractMesh, Vector3, Color3 } from 'babylonjs';
import { io, Socket } from 'socket.io-client';

interface UserData {
  id: string;
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
  color: [number, number, number];
  isVR: boolean;
}

interface ChatMessage {
  userId: string;
  username: string;
  message: string;
  timestamp: number;
}

export class MultiUserManager {
  private scene: Scene;
  private socket: Socket;
  private users = new Map<string, UserData>();
  private userAvatars = new Map<string, AbstractMesh>();
  private onChatMessage?: (message: ChatMessage) => void;

  constructor(scene: Scene, serverUrl: string) {
    this.scene = scene;
    this.socket = io(serverUrl);
    this.setupSocketEvents();
  }

  private setupSocketEvents(): void {
    // 用户加入
    this.socket.on('user-joined', (userData: UserData) => {
      this.addUser(userData);
    });

    // 用户离开
    this.socket.on('user-left', (userId: string) => {
      this.removeUser(userId);
    });

    // 用户位置更新
    this.socket.on('user-moved', (userData: UserData) => {
      this.updateUserPosition(userData);
    });

    // 聊天消息
    this.socket.on('chat-message', (message: ChatMessage) => {
      this.onChatMessage?.(message);
    });

    // 展品交互同步
    this.socket.on('exhibit-interaction', (data: any) => {
      this.handleRemoteExhibitInteraction(data);
    });
  }

  public joinRoom(roomId: string, userData: Partial<UserData>): void {
    this.socket.emit('join-room', {
      roomId,
      userData: {
        name: userData.name || 'Anonymous',
        position: userData.position || [0, 0, 0],
        rotation: userData.rotation || [0, 0, 0],
        color: userData.color || [Math.random(), Math.random(), Math.random()],
        isVR: userData.isVR || false
      }
    });
  }

  public updatePosition(position: Vector3, rotation: Vector3): void {
    this.socket.emit('user-move', {
      position: position.asArray(),
      rotation: rotation.asArray()
    });
  }

  public sendChatMessage(message: string): void {
    this.socket.emit('chat-message', { message });
  }

  public syncExhibitInteraction(exhibitId: string, action: string, data?: any): void {
    this.socket.emit('exhibit-interaction', {
      exhibitId,
      action,
      data
    });
  }

  private addUser(userData: UserData): void {
    this.users.set(userData.id, userData);
    this.createUserAvatar(userData);
  }

  private removeUser(userId: string): void {
    const avatar = this.userAvatars.get(userId);
    if (avatar) {
      avatar.dispose();
      this.userAvatars.delete(userId);
    }
    this.users.delete(userId);
  }

  private updateUserPosition(userData: UserData): void {
    const avatar = this.userAvatars.get(userData.id);
    if (avatar) {
      avatar.position = Vector3.FromArray(userData.position);
      avatar.rotation = Vector3.FromArray(userData.rotation);
    }
    this.users.set(userData.id, userData);
  }

  private createUserAvatar(userData: UserData): void {
    // 创建简单的用户头像（球体 + 名称标签）
    const avatar = this.scene.createDefaultSphere(
      `user-${userData.id}`,
      {
        diameter: 0.3,
        segments: 16
      }
    );

    avatar.position = Vector3.FromArray(userData.position);
    avatar.material = this.scene.createDefaultMaterial(
      `user-material-${userData.id}`,
      {}
    );
    
    if (avatar.material) {
      (avatar.material as any).diffuseColor = Color3.FromArray(userData.color);
    }

    // 添加名称标签
    this.createNameTag(avatar, userData.name);

    this.userAvatars.set(userData.id, avatar);
  }

  private createNameTag(avatar: AbstractMesh, name: string): void {
    // 实现名称标签（可以使用 GUI 或者 3D 文本）
    // 这里简化处理
    console.log(`Created name tag for ${name}`);
  }

  private handleRemoteExhibitInteraction(data: any): void {
    // 处理其他用户的展品交互
    console.log('Remote exhibit interaction:', data);
  }

  public setChatMessageCallback(callback: (message: ChatMessage) => void): void {
    this.onChatMessage = callback;
  }

  public dispose(): void {
    this.socket.disconnect();
    this.userAvatars.forEach(avatar => avatar.dispose());
    this.userAvatars.clear();
    this.users.clear();
  }
}
```

---

## 📊 访客行为分析

### VisitorAnalytics.ts
```typescript
interface VisitorEvent {
  type: 'enter' | 'exit' | 'exhibit_view' | 'exhibit_interact' | 'room_change';
  timestamp: number;
  data: any;
  position?: [number, number, number];
  deviceType: 'desktop' | 'mobile' | 'vr' | 'ar';
}

export class VisitorAnalytics {
  private events: VisitorEvent[] = [];
  private sessionStart: number;
  private currentRoom: string = '';
  private visitedExhibits = new Set<string>();
  private deviceType: 'desktop' | 'mobile' | 'vr' | 'ar';

  constructor() {
    this.sessionStart = Date.now();
    this.deviceType = this.detectDeviceType();
  }

  private detectDeviceType(): 'desktop' | 'mobile' | 'vr' | 'ar' {
    if (navigator.userAgent.includes('Mobile')) return 'mobile';
    if ('xr' in navigator) return 'vr';
    return 'desktop';
  }

  public trackGalleryEnter(): void {
    this.addEvent('enter', {
      galleryId: 'main',
      userAgent: navigator.userAgent,
      screenSize: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    });
  }

  public trackExhibitView(exhibitId: string, duration: number): void {
    this.visitedExhibits.add(exhibitId);
    this.addEvent('exhibit_view', {
      exhibitId,
      duration,
      firstView: !this.visitedExhibits.has(exhibitId)
    });
  }

  public trackExhibitInteraction(exhibitId: string, interactionType: string): void {
    this.addEvent('exhibit_interact', {
      exhibitId,
      interactionType
    });
  }

  public trackRoomChange(fromRoom: string, toRoom: string): void {
    this.currentRoom = toRoom;
    this.addEvent('room_change', {
      fromRoom,
      toRoom,
      timeInPreviousRoom: Date.now() - this.sessionStart
    });
  }

  public trackPosition(position: [number, number, number]): void {
    // 记录访客位置（用于生成热力图）
    this.addEvent('position', {}, position);
  }

  private addEvent(type: VisitorEvent['type'], data: any, position?: [number, number, number]): void {
    this.events.push({
      type,
      timestamp: Date.now(),
      data,
      position,
      deviceType: this.deviceType
    });

    // 定期发送数据到服务器
    if (this.events.length >= 10) {
      this.sendAnalytics();
    }
  }

  private async sendAnalytics(): void {
    if (this.events.length === 0) return;

    try {
      await fetch('/api/analytics/visitor-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: this.getSessionId(),
          events: this.events
        })
      });

      this.events = []; // 清空已发送的事件
    } catch (error) {
      console.warn('Failed to send analytics:', error);
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('gallery-session-id');
    if (!sessionId) {
      sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      sessionStorage.setItem('gallery-session-id', sessionId);
    }
    return sessionId;
  }

  public getSessionSummary() {
    return {
      sessionDuration: Date.now() - this.sessionStart,
      visitedExhibits: this.visitedExhibits.size,
      totalInteractions: this.events.filter(e => e.type === 'exhibit_interact').length,
      deviceType: this.deviceType,
      currentRoom: this.currentRoom
    };
  }

  public dispose(): void {
    // 发送剩余数据
    this.sendAnalytics();
  }
}
```

---

## 🎨 样式和界面

### 展厅 CSS 样式
```css
.gallery-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #000;
}

.gallery-canvas {
  width: 100%;
  height: 100%;
  outline: none;
  touch-action: none;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  z-index: 1000;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid #333;
  border-top: 4px solid #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* VR 控制面板 */
.vr-controls {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 100;
}

.vr-button {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.vr-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

/* 房间导航 */
.room-navigation {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 20px;
  max-width: 250px;
  z-index: 100;
}

.room-navigation h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 18px;
}

.room-button {
  display: block;
  width: 100%;
  padding: 10px 15px;
  margin-bottom: 8px;
  background: transparent;
  border: 2px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.room-button:hover {
  border-color: #007bff;
  background: rgba(0, 123, 255, 0.1);
}

.room-button.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

/* 展品信息面板 */
.exhibit-info-panel {
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(15px);
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  z-index: 100;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.exhibit-info-panel h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 24px;
  line-height: 1.3;
}

.exhibit-info-panel p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 20px;
}

.exhibit-metadata {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 20px;
}

.exhibit-metadata div {
  margin-bottom: 8px;
  font-size: 14px;
}

.exhibit-metadata strong {
  color: #333;
  margin-right: 8px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .room-navigation {
    top: auto;
    bottom: 100px;
    left: 10px;
    right: 10px;
    max-width: none;
  }

  .exhibit-info-panel {
    left: 10px;
    right: 10px;
    bottom: 10px;
    max-width: none;
  }

  .vr-controls {
    top: auto;
    bottom: 20px;
    right: 10px;
  }
}

/* VR 模式样式 */
body.vr-mode .room-navigation,
body.vr-mode .vr-controls,
body.vr-mode .exhibit-info-panel {
  display: none;
}
```

---

## 🚀 部署和使用

### 配置文件示例

#### gallery-config.json
```json
{
  "id": "art-gallery-2024",
  "name": "现代艺术虚拟展厅",
  "description": "探索当代艺术的数字空间",
  "environment": {
    "skybox": "./environments/gallery.env",
    "lighting": "gallery",
    "floorTexture": "./textures/marble-floor.jpg",
    "wallTexture": "./textures/white-wall.jpg"
  },
  "layout": {
    "rooms": [
      {
        "id": "entrance",
        "name": "入口大厅",
        "bounds": {
          "min": [-10, 0, -10],
          "max": [10, 5, 10]
        },
        "exhibits": ["welcome-001", "intro-002"]
      },
      {
        "id": "main-hall",
        "name": "主展厅",
        "bounds": {
          "min": [-20, 0, -15],
          "max": [20, 6, 15]
        },
        "exhibits": ["painting-001", "sculpture-002", "video-003"]
      }
    ]
  },
  "audio": {
    "backgroundMusic": "./audio/ambient-gallery.mp3",
    "spatialAudio": true,
    "volume": 0.7
  }
}
```

### 使用示例
```tsx
import React from 'react';
import { Gallery } from './src/components/Gallery';
import galleryConfig from './public/gallery-config.json';
import exhibitsData from './public/exhibits-data.json';

const App: React.FC = () => {
  const handleExhibitSelect = (exhibit: any) => {
    console.log('选中展品:', exhibit.title);
  };

  return (
    <div className="App">
      <Gallery
        config={galleryConfig}
        exhibits={exhibitsData}
        enableVR={true}
        enableAR={false}
        onExhibitSelect={handleExhibitSelect}
      />
    </div>
  );
};

export default App;
```

这个 VR/AR 虚拟展厅项目提供了完整的沉浸式展览解决方案，支持多平台访问和丰富的交互功能。可以根据具体的展览需求进行定制和扩展。
