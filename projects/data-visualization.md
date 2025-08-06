# 数据可视化平台项目

## 📊 项目概述

基于 Babylon.js 构建的 3D 数据可视化平台，将复杂的多维数据转换为直观的三维图表和交互式可视化场景。支持实时数据更新、多种图表类型、数据钻取等高级功能。

## ✨ 核心功能

- 📈 **3D 图表**: 柱状图、散点图、表面图、网络图
- 🔄 **实时数据**: WebSocket 实时数据流
- 🎯 **交互式分析**: 数据钻取、筛选、缩放
- 🎨 **自定义主题**: 多种视觉风格和配色方案
- 📱 **响应式设计**: 自适应不同屏幕尺寸
- 🔍 **数据探索**: VR/AR 模式下的沉浸式分析
- 📊 **仪表板**: 多图表组合展示
- 💾 **数据导出**: 支持多种格式导出

## 🎯 适用场景

- 商业智能和数据分析
- 科学研究数据可视化
- 金融数据监控平台
- IoT 传感器数据展示
- 社交网络分析
- 地理信息系统 (GIS)

---

## 🏗️ 项目架构

```
data-visualization/
├── src/
│   ├── core/                    # 核心可视化引擎
│   │   ├── VisualizationEngine.ts # 主引擎
│   │   ├── SceneManager.ts      # 场景管理
│   │   ├── DataProcessor.ts     # 数据处理
│   │   └── RenderPipeline.ts    # 渲染管线
│   ├── charts/                  # 图表组件
│   │   ├── BarChart3D.ts        # 3D 柱状图
│   │   ├── ScatterPlot3D.ts     # 3D 散点图
│   │   ├── SurfaceChart.ts      # 表面图
│   │   ├── NetworkGraph.ts      # 网络关系图
│   │   └── HeatmapVolume.ts     # 体积热力图
│   ├── interactions/            # 交互系统
│   │   ├── CameraController.ts  # 摄像机控制
│   │   ├── DataSelector.ts      # 数据选择
│   │   ├── TooltipManager.ts    # 提示框管理
│   │   └── DrillDownHandler.ts  # 数据钻取
│   ├── data/                    # 数据管理
│   │   ├── DataManager.ts       # 数据管理器
│   │   ├── DataSource.ts        # 数据源接口
│   │   ├── RealTimeStream.ts    # 实时数据流
│   │   └── DataCache.ts         # 数据缓存
│   ├── themes/                  # 主题系统
│   │   ├── ThemeManager.ts      # 主题管理
│   │   ├── ColorSchemes.ts      # 配色方案
│   │   └── MaterialLibrary.ts   # 材质库
│   ├── ui/                      # 用户界面
│   │   ├── Dashboard.tsx        # 仪表板
│   │   ├── ControlPanel.tsx     # 控制面板
│   │   ├── DataTable.tsx        # 数据表格
│   │   └── ExportDialog.tsx     # 导出对话框
│   ├── utils/                   # 工具函数
│   │   ├── DataTransformers.ts  # 数据转换
│   │   ├── MathUtils.ts         # 数学工具
│   │   └── PerformanceUtils.ts  # 性能工具
│   └── examples/                # 示例数据
│       ├── SalesData.ts         # 销售数据示例
│       ├── SensorData.ts        # 传感器数据
│       └── NetworkData.ts       # 网络数据
├── assets/
│   ├── textures/                # 纹理资源
│   ├── shaders/                 # 自定义着色器
│   └── fonts/                   # 字体文件
├── docs/                        # 项目文档
└── examples/                    # 使用示例
```

---

## 🚀 核心系统实现

### 1. 可视化引擎核心

#### VisualizationEngine.ts
```typescript
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  DirectionalLight,
  Color3,
  GUI3DManager,
  AdvancedDynamicTexture
} from 'babylonjs';
import { DataManager } from '../data/DataManager';
import { ThemeManager } from '../themes/ThemeManager';
import { InteractionSystem } from '../interactions/InteractionSystem';

interface VisualizationConfig {
  container: HTMLCanvasElement;
  theme: string;
  responsive: boolean;
  enableVR: boolean;
  enableAR: boolean;
  performance: 'low' | 'medium' | 'high';
}

export class VisualizationEngine {
  private engine: Engine;
  private scene: Scene;
  private camera: ArcRotateCamera;
  private dataManager: DataManager;
  private themeManager: ThemeManager;
  private interactionSystem: InteractionSystem;
  private gui3DManager: GUI3DManager;
  private gui2D: AdvancedDynamicTexture;

  private charts = new Map<string, any>();
  private isInitialized = false;

  constructor(config: VisualizationConfig) {
    this.engine = new Engine(config.container, true, {
      antialias: config.performance !== 'low',
      stencil: true,
      preserveDrawingBuffer: true
    });

    this.setupScene();
    this.dataManager = new DataManager();
    this.themeManager = new ThemeManager();
    this.interactionSystem = new InteractionSystem(this.scene, this.camera);
  }

  private setupScene(): void {
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color3(0.1, 0.1, 0.1);

    // 设置摄像机
    this.camera = new ArcRotateCamera(
      'camera',
      -Math.PI / 2,
      Math.PI / 2.5,
      20,
      Vector3.Zero(),
      this.scene
    );
    this.camera.attachToCanvas(this.engine.getRenderingCanvas()!, true);
    this.camera.setTarget(Vector3.Zero());

    // 设置光照
    this.setupLighting();
    
    // 设置 GUI
    this.setupGUI();
    
    // 启动渲染循环
    this.startRenderLoop();
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
    directionalLight.position = new Vector3(10, 10, 5);

    // 补光
    const fillLight = new DirectionalLight(
      'fillLight',
      new Vector3(1, -0.5, 1),
      this.scene
    );
    fillLight.intensity = 0.3;
  }

  private setupGUI(): void {
    // 3D GUI 管理器
    this.gui3DManager = new GUI3DManager(this.scene);
    
    // 2D GUI 覆盖层
    this.gui2D = AdvancedDynamicTexture.CreateFullscreenUI('UI');
  }

  private startRenderLoop(): void {
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });

    // 窗口大小调整
    window.addEventListener('resize', () => {
      this.engine.resize();
    });
  }

  public async initialize(): Promise<void> {
    await this.themeManager.initialize();
    await this.interactionSystem.initialize();
    this.isInitialized = true;
    console.log('Visualization Engine initialized');
  }

  public createChart(type: string, data: any[], options: any): string {
    if (!this.isInitialized) {
      throw new Error('Engine not initialized');
    }

    const chartId = `chart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    switch (type) {
      case 'bar3d':
        this.charts.set(chartId, new BarChart3D(this.scene, data, options));
        break;
      case 'scatter3d':
        this.charts.set(chartId, new ScatterPlot3D(this.scene, data, options));
        break;
      case 'surface':
        this.charts.set(chartId, new SurfaceChart(this.scene, data, options));
        break;
      case 'network':
        this.charts.set(chartId, new NetworkGraph(this.scene, data, options));
        break;
      case 'heatmap':
        this.charts.set(chartId, new HeatmapVolume(this.scene, data, options));
        break;
      default:
        throw new Error(`Unsupported chart type: ${type}`);
    }

    return chartId;
  }

  public updateChart(chartId: string, data: any[]): void {
    const chart = this.charts.get(chartId);
    if (chart && chart.updateData) {
      chart.updateData(data);
    }
  }

  public removeChart(chartId: string): void {
    const chart = this.charts.get(chartId);
    if (chart && chart.dispose) {
      chart.dispose();
      this.charts.delete(chartId);
    }
  }

  public setTheme(themeName: string): void {
    this.themeManager.applyTheme(themeName);
    // 更新所有图表的主题
    this.charts.forEach(chart => {
      if (chart.applyTheme) {
        chart.applyTheme(this.themeManager.currentTheme);
      }
    });
  }

  public exportScene(format: 'png' | 'jpeg' | 'webp'): string {
    return this.engine.captureScreenshot(format);
  }

  public dispose(): void {
    this.charts.forEach(chart => chart.dispose?.());
    this.charts.clear();
    this.interactionSystem?.dispose();
    this.gui3DManager?.dispose();
    this.gui2D?.dispose();
    this.scene?.dispose();
    this.engine?.dispose();
  }
}
```

### 2. 3D 柱状图组件

#### BarChart3D.ts
```typescript
import {
  Scene,
  Mesh,
  Vector3,
  Color3,
  StandardMaterial,
  Animation,
  AnimationGroup,
  CreateBox,
  CreateGround,
  CreateCylinder,
  DynamicTexture
} from 'babylonjs';

interface BarChartData {
  label: string;
  value: number;
  category?: string;
  color?: string;
}

interface BarChart3DOptions {
  title?: string;
  width?: number;
  depth?: number;
  maxHeight?: number;
  spacing?: number;
  colors?: string[];
  showLabels?: boolean;
  showGrid?: boolean;
  animationDuration?: number;
  groupBy?: string;
}

export class BarChart3D {
  private scene: Scene;
  private data: BarChartData[];
  private options: BarChart3DOptions;
  private bars: Mesh[] = [];
  private labels: Mesh[] = [];
  private container: Mesh;

  constructor(scene: Scene, data: BarChartData[], options: BarChart3DOptions = {}) {
    this.scene = scene;
    this.data = data;
    this.options = {
      width: 10,
      depth: 10,
      maxHeight: 8,
      spacing: 1.2,
      colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b'],
      showLabels: true,
      showGrid: true,
      animationDuration: 1000,
      ...options
    };

    this.container = new Mesh('barChart3D', scene);
    this.createChart();
  }

  private createChart(): void {
    this.createBase();
    this.createBars();
    
    if (this.options.showLabels) {
      this.createLabels();
    }
    
    if (this.options.showGrid) {
      this.createGrid();
    }

    this.animateIn();
  }

  private createBase(): void {
    const ground = CreateGround(
      'chartBase',
      {
        width: this.options.width! + 2,
        height: this.options.depth! + 2
      },
      this.scene
    );

    const baseMaterial = new StandardMaterial('baseMaterial', this.scene);
    baseMaterial.diffuseColor = new Color3(0.2, 0.2, 0.2);
    baseMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
    ground.material = baseMaterial;
    ground.parent = this.container;
  }

  private createBars(): void {
    const maxValue = Math.max(...this.data.map(d => d.value));
    const barWidth = this.options.width! / this.data.length * 0.8;
    const startX = -(this.options.width! / 2) + (barWidth / 2);

    this.data.forEach((item, index) => {
      const height = (item.value / maxValue) * this.options.maxHeight!;
      const positionX = startX + (index * this.options.spacing!);

      // 创建柱体
      const bar = CreateBox(
        `bar_${index}`,
        {
          width: barWidth,
          height: height,
          depth: barWidth
        },
        this.scene
      );

      bar.position = new Vector3(positionX, height / 2, 0);

      // 创建材质
      const material = new StandardMaterial(`barMaterial_${index}`, this.scene);
      const colorIndex = index % this.options.colors!.length;
      const color = this.hexToColor3(this.options.colors![colorIndex]);
      
      material.diffuseColor = color;
      material.specularColor = color.scale(0.5);
      material.emissiveColor = color.scale(0.1);
      
      bar.material = material;
      bar.parent = this.container;

      // 存储数据引用
      bar.metadata = {
        data: item,
        originalHeight: height
      };

      this.bars.push(bar);

      // 添加交互
      this.setupBarInteraction(bar, item);
    });
  }

  private createLabels(): void {
    this.data.forEach((item, index) => {
      const positionX = -(this.options.width! / 2) + ((index + 0.5) * this.options.spacing!);
      
      // 创建标签纹理
      const labelTexture = new DynamicTexture(
        `labelTexture_${index}`,
        { width: 256, height: 64 },
        this.scene
      );

      labelTexture.drawText(
        item.label,
        null,
        null,
        'bold 24px Arial',
        '#ffffff',
        'transparent',
        true
      );

      // 创建标签平面
      const labelPlane = CreateGround(
        `label_${index}`,
        { width: 2, height: 0.5 },
        this.scene
      );

      const labelMaterial = new StandardMaterial(`labelMaterial_${index}`, this.scene);
      labelMaterial.diffuseTexture = labelTexture;
      labelMaterial.emissiveTexture = labelTexture;
      labelMaterial.backFaceCulling = false;

      labelPlane.material = labelMaterial;
      labelPlane.position = new Vector3(positionX, -0.8, this.options.depth! / 2 + 0.5);
      labelPlane.rotation.x = -Math.PI / 2;
      labelPlane.parent = this.container;

      this.labels.push(labelPlane);
    });
  }

  private createGrid(): void {
    const gridMaterial = new StandardMaterial('gridMaterial', this.scene);
    gridMaterial.diffuseColor = new Color3(0.3, 0.3, 0.3);
    gridMaterial.wireframe = true;

    // 创建网格线
    for (let i = 0; i <= 5; i++) {
      const height = (i / 5) * this.options.maxHeight!;
      
      const gridLine = CreateBox(
        `gridLine_${i}`,
        {
          width: this.options.width! + 1,
          height: 0.02,
          depth: this.options.depth! + 1
        },
        this.scene
      );

      gridLine.position.y = height;
      gridLine.material = gridMaterial;
      gridLine.parent = this.container;
    }
  }

  private setupBarInteraction(bar: Mesh, data: BarChartData): void {
    bar.actionManager = new ActionManager(this.scene);

    // 鼠标悬停效果
    bar.actionManager.registerAction(
      new ExecuteCodeAction(
        ActionManager.OnPointerOverTrigger,
        () => {
          this.highlightBar(bar, true);
          this.showTooltip(bar, data);
        }
      )
    );

    bar.actionManager.registerAction(
      new ExecuteCodeAction(
        ActionManager.OnPointerOutTrigger,
        () => {
          this.highlightBar(bar, false);
          this.hideTooltip();
        }
      )
    );

    // 点击事件
    bar.actionManager.registerAction(
      new ExecuteCodeAction(
        ActionManager.OnPickTrigger,
        () => {
          this.onBarClick(data);
        }
      )
    );
  }

  private highlightBar(bar: Mesh, highlight: boolean): void {
    const material = bar.material as StandardMaterial;
    if (highlight) {
      material.emissiveColor.scaleInPlace(2);
      bar.scaling.y = 1.1;
    } else {
      material.emissiveColor.scaleInPlace(0.5);
      bar.scaling.y = 1.0;
    }
  }

  private showTooltip(bar: Mesh, data: BarChartData): void {
    // 实现工具提示显示
    console.log(`Tooltip: ${data.label} - ${data.value}`);
  }

  private hideTooltip(): void {
    // 隐藏工具提示
  }

  private onBarClick(data: BarChartData): void {
    console.log(`Bar clicked: ${data.label}`);
    // 触发数据钻取或其他交互
  }

  private animateIn(): void {
    this.bars.forEach((bar, index) => {
      // 初始化为0高度
      const targetHeight = bar.metadata.originalHeight;
      bar.scaling.y = 0;
      bar.position.y = 0;

      // 创建动画
      const animationHeight = Animation.CreateAndStartAnimation(
        `barGrowth_${index}`,
        bar,
        'scaling.y',
        30,
        30,
        0,
        1,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );

      const animationPosition = Animation.CreateAndStartAnimation(
        `barPosition_${index}`,
        bar,
        'position.y',
        30,
        30,
        0,
        targetHeight / 2,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );

      // 延迟启动以创建波浪效果
      setTimeout(() => {
        animationHeight?.restart();
        animationPosition?.restart();
      }, index * 100);
    });
  }

  public updateData(newData: BarChartData[]): void {
    this.data = newData;
    
    // 清除现有的柱体
    this.bars.forEach(bar => bar.dispose());
    this.labels.forEach(label => label.dispose());
    this.bars = [];
    this.labels = [];

    // 重新创建
    this.createBars();
    if (this.options.showLabels) {
      this.createLabels();
    }
  }

  public applyTheme(theme: any): void {
    // 应用主题样式
    this.options.colors = theme.colors || this.options.colors;
    this.updateData(this.data);
  }

  private hexToColor3(hex: string): Color3 {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? new Color3(
          parseInt(result[1], 16) / 255,
          parseInt(result[2], 16) / 255,
          parseInt(result[3], 16) / 255
        )
      : new Color3(1, 1, 1);
  }

  public dispose(): void {
    this.bars.forEach(bar => bar.dispose());
    this.labels.forEach(label => label.dispose());
    this.container.dispose();
  }
}
```

### 3. 3D 散点图组件

#### ScatterPlot3D.ts
```typescript
import {
  Scene,
  Mesh,
  Vector3,
  Color3,
  StandardMaterial,
  CreateSphere,
  InstancedMesh,
  Matrix
} from 'babylonjs';

interface ScatterPoint {
  x: number;
  y: number;
  z: number;
  size?: number;
  color?: string;
  label?: string;
  metadata?: Record<string, any>;
}

interface ScatterPlot3DOptions {
  pointSize?: number;
  colorScheme?: string[];
  showAxes?: boolean;
  axisLabels?: { x: string; y: string; z: string };
  pointShape?: 'sphere' | 'cube' | 'diamond';
  sizeMapping?: 'fixed' | 'data';
  colorMapping?: 'fixed' | 'data' | 'category';
}

export class ScatterPlot3D {
  private scene: Scene;
  private data: ScatterPoint[];
  private options: ScatterPlot3DOptions;
  private points: InstancedMesh[] = [];
  private baseMesh: Mesh;
  private container: Mesh;

  constructor(scene: Scene, data: ScatterPoint[], options: ScatterPlot3DOptions = {}) {
    this.scene = scene;
    this.data = data;
    this.options = {
      pointSize: 0.1,
      colorScheme: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24'],
      showAxes: true,
      axisLabels: { x: 'X Axis', y: 'Y Axis', z: 'Z Axis' },
      pointShape: 'sphere',
      sizeMapping: 'fixed',
      colorMapping: 'data',
      ...options
    };

    this.container = new Mesh('scatterPlot3D', scene);
    this.createChart();
  }

  private createChart(): void {
    this.createBaseMesh();
    this.createPoints();
    
    if (this.options.showAxes) {
      this.createAxes();
    }
  }

  private createBaseMesh(): void {
    switch (this.options.pointShape) {
      case 'sphere':
        this.baseMesh = CreateSphere('pointBase', { diameter: 1 }, this.scene);
        break;
      case 'cube':
        this.baseMesh = CreateBox('pointBase', { size: 1 }, this.scene);
        break;
      default:
        this.baseMesh = CreateSphere('pointBase', { diameter: 1 }, this.scene);
    }

    this.baseMesh.setEnabled(false); // 作为模板使用
  }

  private createPoints(): void {
    // 标准化数据范围
    const bounds = this.calculateBounds();
    const normalizedData = this.normalizeData(bounds);

    normalizedData.forEach((point, index) => {
      const instance = this.baseMesh.createInstance(`point_${index}`);
      
      // 设置位置
      instance.position = new Vector3(point.x, point.y, point.z);
      
      // 设置大小
      const size = this.calculatePointSize(point, index);
      instance.scaling = new Vector3(size, size, size);
      
      // 设置材质和颜色
      const material = this.createPointMaterial(point, index);
      instance.material = material;
      
      // 存储原始数据
      instance.metadata = {
        originalData: this.data[index],
        index: index
      };

      instance.parent = this.container;
      this.points.push(instance);

      // 添加交互
      this.setupPointInteraction(instance);
    });
  }

  private calculateBounds(): { min: Vector3; max: Vector3 } {
    const min = new Vector3(
      Math.min(...this.data.map(p => p.x)),
      Math.min(...this.data.map(p => p.y)),
      Math.min(...this.data.map(p => p.z))
    );

    const max = new Vector3(
      Math.max(...this.data.map(p => p.x)),
      Math.max(...this.data.map(p => p.y)),
      Math.max(...this.data.map(p => p.z))
    );

    return { min, max };
  }

  private normalizeData(bounds: { min: Vector3; max: Vector3 }): ScatterPoint[] {
    const range = bounds.max.subtract(bounds.min);
    const scale = 10; // 将数据映射到 -5 到 5 的范围

    return this.data.map(point => ({
      ...point,
      x: ((point.x - bounds.min.x) / range.x - 0.5) * scale,
      y: ((point.y - bounds.min.y) / range.y - 0.5) * scale,
      z: ((point.z - bounds.min.z) / range.z - 0.5) * scale
    }));
  }

  private calculatePointSize(point: ScatterPoint, index: number): number {
    const baseSize = this.options.pointSize!;
    
    if (this.options.sizeMapping === 'data' && point.size !== undefined) {
      // 根据数据值调整大小
      const maxSize = Math.max(...this.data.map(p => p.size || 1));
      return baseSize * (point.size / maxSize) * 3;
    }
    
    return baseSize;
  }

  private createPointMaterial(point: ScatterPoint, index: number): StandardMaterial {
    const material = new StandardMaterial(`pointMaterial_${index}`, this.scene);
    
    let color: Color3;
    
    if (this.options.colorMapping === 'data' && point.color) {
      color = this.hexToColor3(point.color);
    } else {
      const colorIndex = index % this.options.colorScheme!.length;
      color = this.hexToColor3(this.options.colorScheme![colorIndex]);
    }
    
    material.diffuseColor = color;
    material.specularColor = color.scale(0.5);
    material.emissiveColor = color.scale(0.1);
    
    return material;
  }

  private createAxes(): void {
    const axisLength = 6;
    const axisThickness = 0.02;

    // X 轴 (红色)
    const xAxis = CreateBox('xAxis', {
      width: axisLength,
      height: axisThickness,
      depth: axisThickness
    }, this.scene);
    
    const xAxisMaterial = new StandardMaterial('xAxisMaterial', this.scene);
    xAxisMaterial.diffuseColor = new Color3(1, 0, 0);
    xAxis.material = xAxisMaterial;
    xAxis.parent = this.container;

    // Y 轴 (绿色)
    const yAxis = CreateBox('yAxis', {
      width: axisThickness,
      height: axisLength,
      depth: axisThickness
    }, this.scene);
    
    const yAxisMaterial = new StandardMaterial('yAxisMaterial', this.scene);
    yAxisMaterial.diffuseColor = new Color3(0, 1, 0);
    yAxis.material = yAxisMaterial;
    yAxis.parent = this.container;

    // Z 轴 (蓝色)
    const zAxis = CreateBox('zAxis', {
      width: axisThickness,
      height: axisThickness,
      depth: axisLength
    }, this.scene);
    
    const zAxisMaterial = new StandardMaterial('zAxisMaterial', this.scene);
    zAxisMaterial.diffuseColor = new Color3(0, 0, 1);
    zAxis.material = zAxisMaterial;
    zAxis.parent = this.container;

    // 轴标签
    this.createAxisLabels();
  }

  private createAxisLabels(): void {
    // 实现轴标签的创建
    // 这里可以使用 GUI 系统创建文本标签
  }

  private setupPointInteraction(point: InstancedMesh): void {
    point.actionManager = new ActionManager(this.scene);

    // 悬停效果
    point.actionManager.registerAction(
      new ExecuteCodeAction(
        ActionManager.OnPointerOverTrigger,
        () => {
          this.highlightPoint(point, true);
          this.showPointTooltip(point);
        }
      )
    );

    point.actionManager.registerAction(
      new ExecuteCodeAction(
        ActionManager.OnPointerOutTrigger,
        () => {
          this.highlightPoint(point, false);
          this.hidePointTooltip();
        }
      )
    );

    // 点击事件
    point.actionManager.registerAction(
      new ExecuteCodeAction(
        ActionManager.OnPickTrigger,
        () => {
          this.onPointClick(point.metadata.originalData);
        }
      )
    );
  }

  private highlightPoint(point: InstancedMesh, highlight: boolean): void {
    if (highlight) {
      point.scaling.scaleInPlace(1.5);
      const material = point.material as StandardMaterial;
      material.emissiveColor.scaleInPlace(3);
    } else {
      point.scaling.scaleInPlace(1 / 1.5);
      const material = point.material as StandardMaterial;
      material.emissiveColor.scaleInPlace(1 / 3);
    }
  }

  private showPointTooltip(point: InstancedMesh): void {
    const data = point.metadata.originalData;
    console.log(`Point: (${data.x}, ${data.y}, ${data.z})`);
    // 实现工具提示显示
  }

  private hidePointTooltip(): void {
    // 隐藏工具提示
  }

  private onPointClick(data: ScatterPoint): void {
    console.log('Point clicked:', data);
    // 触发点击事件处理
  }

  public updateData(newData: ScatterPoint[]): void {
    // 清除现有点
    this.points.forEach(point => point.dispose());
    this.points = [];
    
    this.data = newData;
    this.createPoints();
  }

  public filterData(predicate: (point: ScatterPoint) => boolean): void {
    this.points.forEach((point, index) => {
      const shouldShow = predicate(this.data[index]);
      point.setEnabled(shouldShow);
    });
  }

  public setColorScheme(colors: string[]): void {
    this.options.colorScheme = colors;
    
    this.points.forEach((point, index) => {
      const colorIndex = index % colors.length;
      const color = this.hexToColor3(colors[colorIndex]);
      const material = point.material as StandardMaterial;
      material.diffuseColor = color;
      material.specularColor = color.scale(0.5);
      material.emissiveColor = color.scale(0.1);
    });
  }

  private hexToColor3(hex: string): Color3 {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? new Color3(
          parseInt(result[1], 16) / 255,
          parseInt(result[2], 16) / 255,
          parseInt(result[3], 16) / 255
        )
      : new Color3(1, 1, 1);
  }

  public dispose(): void {
    this.points.forEach(point => point.dispose());
    this.baseMesh.dispose();
    this.container.dispose();
  }
}
```

---

## 📊 数据管理系统

### DataManager.ts
```typescript
interface DataSource {
  id: string;
  name: string;
  type: 'static' | 'api' | 'websocket' | 'file';
  config: any;
}

interface DataQuery {
  source: string;
  query?: string;
  filters?: Record<string, any>;
  aggregation?: string;
  timeRange?: { start: Date; end: Date };
}

export class DataManager {
  private sources = new Map<string, DataSource>();
  private cache = new Map<string, any>();
  private realTimeConnections = new Map<string, WebSocket>();

  public registerDataSource(source: DataSource): void {
    this.sources.set(source.id, source);
    
    if (source.type === 'websocket') {
      this.setupWebSocketConnection(source);
    }
  }

  public async queryData(query: DataQuery): Promise<any[]> {
    const cacheKey = this.generateCacheKey(query);
    
    // 检查缓存
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const source = this.sources.get(query.source);
    if (!source) {
      throw new Error(`Data source not found: ${query.source}`);
    }

    let data: any[];
    
    switch (source.type) {
      case 'static':
        data = await this.queryStaticData(source, query);
        break;
      case 'api':
        data = await this.queryAPIData(source, query);
        break;
      case 'file':
        data = await this.queryFileData(source, query);
        break;
      default:
        throw new Error(`Unsupported data source type: ${source.type}`);
    }

    // 缓存结果
    this.cache.set(cacheKey, data);
    
    return data;
  }

  private async queryAPIData(source: DataSource, query: DataQuery): Promise<any[]> {
    const url = this.buildAPIUrl(source.config.endpoint, query);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...source.config.headers
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const result = await response.json();
    return this.transformData(result, source.config.transform);
  }

  private async queryFileData(source: DataSource, query: DataQuery): Promise<any[]> {
    const response = await fetch(source.config.url);
    const text = await response.text();
    
    switch (source.config.format) {
      case 'csv':
        return this.parseCSV(text);
      case 'json':
        return JSON.parse(text);
      default:
        throw new Error(`Unsupported file format: ${source.config.format}`);
    }
  }

  private setupWebSocketConnection(source: DataSource): void {
    const ws = new WebSocket(source.config.url);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleRealTimeData(source.id, data);
    };

    ws.onerror = (error) => {
      console.error(`WebSocket error for ${source.id}:`, error);
    };

    this.realTimeConnections.set(source.id, ws);
  }

  private handleRealTimeData(sourceId: string, data: any): void {
    // 触发实时数据更新事件
    this.emit('realTimeData', { sourceId, data });
  }

  private generateCacheKey(query: DataQuery): string {
    return `${query.source}_${JSON.stringify(query)}`;
  }

  private parseCSV(csvText: string): any[] {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header.trim()] = values[index]?.trim();
      });
      return obj;
    });
  }

  // 简单的事件发射器
  private listeners = new Map<string, Function[]>();

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event) || [];
    eventListeners.forEach(listener => listener(data));
  }

  public on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  public dispose(): void {
    this.realTimeConnections.forEach(ws => ws.close());
    this.realTimeConnections.clear();
    this.cache.clear();
    this.listeners.clear();
  }
}
```

---

## 🎨 主题和样式系统

### ThemeManager.ts
```typescript
interface Theme {
  name: string;
  colors: {
    primary: string[];
    background: string;
    text: string;
    grid: string;
    axis: string;
  };
  materials: {
    metallic: number;
    roughness: number;
    opacity: number;
  };
  lighting: {
    ambient: number;
    directional: number;
  };
}

export class ThemeManager {
  public currentTheme: Theme;
  private themes = new Map<string, Theme>();

  constructor() {
    this.loadDefaultThemes();
    this.currentTheme = this.themes.get('default')!;
  }

  private loadDefaultThemes(): void {
    // 默认主题
    this.themes.set('default', {
      name: 'Default',
      colors: {
        primary: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b'],
        background: '#1a1a1a',
        text: '#ffffff',
        grid: '#333333',
        axis: '#666666'
      },
      materials: {
        metallic: 0.2,
        roughness: 0.8,
        opacity: 0.9
      },
      lighting: {
        ambient: 0.4,
        directional: 0.8
      }
    });

    // 商务主题
    this.themes.set('business', {
      name: 'Business',
      colors: {
        primary: ['#2c3e50', '#34495e', '#3498db', '#e74c3c', '#f39c12'],
        background: '#ecf0f1',
        text: '#2c3e50',
        grid: '#bdc3c7',
        axis: '#95a5a6'
      },
      materials: {
        metallic: 0.1,
        roughness: 0.9,
        opacity: 0.95
      },
      lighting: {
        ambient: 0.6,
        directional: 0.6
      }
    });

    // 科技主题
    this.themes.set('tech', {
      name: 'Tech',
      colors: {
        primary: ['#00ffff', '#ff00ff', '#ffff00', '#00ff00', '#ff0080'],
        background: '#000000',
        text: '#00ffff',
        grid: '#004040',
        axis: '#008080'
      },
      materials: {
        metallic: 0.8,
        roughness: 0.2,
        opacity: 0.85
      },
      lighting: {
        ambient: 0.2,
        directional: 1.0
      }
    });
  }

  public applyTheme(themeName: string): void {
    const theme = this.themes.get(themeName);
    if (!theme) {
      console.warn(`Theme not found: ${themeName}`);
      return;
    }

    this.currentTheme = theme;
    console.log(`Applied theme: ${theme.name}`);
  }

  public getAvailableThemes(): string[] {
    return Array.from(this.themes.keys());
  }

  public createCustomTheme(name: string, theme: Theme): void {
    this.themes.set(name, theme);
  }
}
```

---

## 🖥️ 用户界面

### Dashboard.tsx
```tsx
import React, { useState, useEffect } from 'react';
import { VisualizationEngine } from '../core/VisualizationEngine';
import { DataManager } from '../data/DataManager';

interface DashboardProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export const Dashboard: React.FC<DashboardProps> = ({ canvasRef }) => {
  const [engine, setEngine] = useState<VisualizationEngine | null>(null);
  const [charts, setCharts] = useState<string[]>([]);
  const [currentTheme, setCurrentTheme] = useState('default');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (canvasRef.current && !engine) {
      const vizEngine = new VisualizationEngine({
        container: canvasRef.current,
        theme: 'default',
        responsive: true,
        enableVR: false,
        enableAR: false,
        performance: 'high'
      });

      vizEngine.initialize().then(() => {
        setEngine(vizEngine);
      });
    }

    return () => {
      engine?.dispose();
    };
  }, [canvasRef.current]);

  const createBarChart = () => {
    if (!engine) return;

    setIsLoading(true);
    
    // 示例数据
    const data = [
      { label: 'Q1', value: 120 },
      { label: 'Q2', value: 150 },
      { label: 'Q3', value: 180 },
      { label: 'Q4', value: 200 }
    ];

    const chartId = engine.createChart('bar3d', data, {
      title: 'Quarterly Sales',
      showLabels: true,
      showGrid: true
    });

    setCharts(prev => [...prev, chartId]);
    setIsLoading(false);
  };

  const createScatterPlot = () => {
    if (!engine) return;

    setIsLoading(true);

    // 生成随机散点数据
    const data = Array.from({ length: 100 }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      z: Math.random() * 100,
      size: Math.random() * 10 + 1
    }));

    const chartId = engine.createChart('scatter3d', data, {
      pointSize: 0.2,
      showAxes: true,
      sizeMapping: 'data'
    });

    setCharts(prev => [...prev, chartId]);
    setIsLoading(false);
  };

  const changeTheme = (themeName: string) => {
    if (!engine) return;
    
    engine.setTheme(themeName);
    setCurrentTheme(themeName);
  };

  const exportScene = () => {
    if (!engine) return;
    
    const dataUrl = engine.exportScene('png');
    const link = document.createElement('a');
    link.download = 'visualization.png';
    link.href = dataUrl;
    link.click();
  };

  const clearAll = () => {
    if (!engine) return;

    charts.forEach(chartId => {
      engine.removeChart(chartId);
    });
    setCharts([]);
  };

  return (
    <div className="dashboard">
      <div className="control-panel">
        <h2>数据可视化控制台</h2>
        
        <div className="section">
          <h3>创建图表</h3>
          <div className="button-group">
            <button onClick={createBarChart} disabled={isLoading}>
              📊 柱状图
            </button>
            <button onClick={createScatterPlot} disabled={isLoading}>
              🔵 散点图
            </button>
          </div>
        </div>

        <div className="section">
          <h3>主题设置</h3>
          <select 
            value={currentTheme} 
            onChange={(e) => changeTheme(e.target.value)}
          >
            <option value="default">默认</option>
            <option value="business">商务</option>
            <option value="tech">科技</option>
          </select>
        </div>

        <div className="section">
          <h3>操作</h3>
          <div className="button-group">
            <button onClick={exportScene}>
              💾 导出场景
            </button>
            <button onClick={clearAll}>
              🗑️ 清除所有
            </button>
          </div>
        </div>

        <div className="section">
          <h3>统计信息</h3>
          <p>图表数量: {charts.length}</p>
          <p>当前主题: {currentTheme}</p>
        </div>
      </div>

      <div className="canvas-container">
        <canvas ref={canvasRef} className="visualization-canvas" />
        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>正在创建图表...</p>
          </div>
        )}
      </div>
    </div>
  );
};
```

### 样式文件
```css
.dashboard {
  display: flex;
  height: 100vh;
  background: #f5f5f5;
}

.control-panel {
  width: 300px;
  background: white;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  padding: 20px;
  overflow-y: auto;
}

.control-panel h2 {
  margin-top: 0;
  color: #333;
  border-bottom: 2px solid #007bff;
  padding-bottom: 10px;
}

.section {
  margin-bottom: 30px;
}

.section h3 {
  color: #555;
  margin-bottom: 15px;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.button-group button {
  padding: 12px 15px;
  border: none;
  border-radius: 5px;
  background: #007bff;
  color: white;
  cursor: pointer;
  transition: background 0.3s ease;
}

.button-group button:hover {
  background: #0056b3;
}

.button-group button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.canvas-container {
  flex: 1;
  position: relative;
  background: #000;
}

.visualization-canvas {
  width: 100%;
  height: 100%;
  outline: none;
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
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #333;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dashboard {
    flex-direction: column;
  }
  
  .control-panel {
    width: 100%;
    height: 200px;
    order: 2;
  }
  
  .canvas-container {
    order: 1;
    height: calc(100vh - 200px);
  }
}
```

---

## 🚀 使用示例

### 基础使用
```tsx
import React, { useRef, useEffect } from 'react';
import { Dashboard } from './src/ui/Dashboard';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <div className="App">
      <Dashboard canvasRef={canvasRef} />
    </div>
  );
};

export default App;
```

### 高级数据集成
```typescript
// 配置数据源
const dataManager = new DataManager();

dataManager.registerDataSource({
  id: 'sales_api',
  name: 'Sales API',
  type: 'api',
  config: {
    endpoint: 'https://api.example.com/sales',
    headers: {
      'Authorization': 'Bearer your-token'
    }
  }
});

// 实时数据源
dataManager.registerDataSource({
  id: 'sensor_stream',
  name: 'Sensor Data Stream',
  type: 'websocket',
  config: {
    url: 'wss://sensors.example.com/stream'
  }
});

// 查询和可视化数据
const salesData = await dataManager.queryData({
  source: 'sales_api',
  filters: { year: 2024 },
  aggregation: 'monthly'
});

const chartId = engine.createChart('bar3d', salesData, {
  title: '2024年月度销售数据',
  showLabels: true
});
```

这个数据可视化平台项目提供了完整的 3D 数据可视化解决方案，支持多种数据源、图表类型和交互功能，可以满足各种数据分析和展示需求。
