# Next.js + Babylon.js 示例项目

这是一个完整的 Next.js 与 Babylon.js 集成示例项目，展示了如何在现代 React 框架中开发 3D Web 应用。

## 🚀 快速开始

```bash
# 1. 创建项目
npx create-next-app@latest babylon-nextjs-demo --typescript --tailwind --eslint
cd babylon-nextjs-demo

# 2. 安装 Babylon.js 依赖
npm install babylonjs babylonjs-loaders babylonjs-materials babylonjs-gui

# 3. 安装类型定义
npm install --save-dev @types/babylonjs

# 4. 启动开发服务器
npm run dev
```

## 📁 项目结构

```
babylon-nextjs-demo/
├── components/
│   ├── babylon/
│   │   ├── BabylonScene.tsx          # 核心 3D 场景组件
│   │   ├── SceneManager.tsx          # 场景管理器
│   │   ├── PerformanceMonitor.tsx    # 性能监控
│   │   └── UI/
│   │       ├── Controls.tsx          # 3D 场景控制界面
│   │       ├── LoadingScreen.tsx     # 加载屏幕
│   │       └── MaterialSelector.tsx  # 材质选择器
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Layout.tsx
│   └── ui/
│       ├── Button.tsx
│       └── Card.tsx
├── hooks/
│   ├── useBabylon.ts                 # Babylon.js 核心 Hook
│   ├── useSceneLoader.ts             # 模型加载 Hook
│   ├── useMaterial.ts                # 材质管理 Hook
│   └── useAnimation.ts               # 动画控制 Hook
├── lib/
│   ├── babylon/
│   │   ├── sceneSetup.ts             # 场景初始化工具
│   │   ├── materialManager.ts        # 材质管理器
│   │   ├── animationManager.ts       # 动画管理器
│   │   └── utils.ts                  # 工具函数
│   └── utils.ts
├── contexts/
│   ├── BabylonContext.tsx            # 3D 场景状态管理
│   └── ThemeContext.tsx              # 主题管理
├── pages/
│   ├── api/
│   │   └── models/
│   │       └── [id].ts               # 模型 API
│   ├── examples/
│   │   ├── basic-scene.tsx           # 基础场景示例
│   │   ├── interactive-scene.tsx     # 交互场景示例
│   │   ├── model-viewer.tsx          # 模型查看器
│   │   └── product-configurator.tsx  # 产品配置器
│   ├── _app.tsx
│   ├── _document.tsx
│   └── index.tsx
├── public/
│   ├── models/                       # 3D 模型文件
│   │   ├── chair.glb
│   │   ├── table.babylon
│   │   └── lamp.gltf
│   ├── textures/                     # 纹理文件
│   │   ├── wood.jpg
│   │   ├── metal.jpg
│   │   └── fabric.jpg
│   └── environments/                 # 环境贴图
│       ├── studio.hdr
│       └── outdoor.exr
├── styles/
│   ├── globals.css
│   ├── BabylonScene.module.css
│   └── components/
│       ├── Controls.module.css
│       └── UI.module.css
├── types/
│   ├── babylon.d.ts                  # Babylon.js 类型定义
│   └── global.d.ts                   # 全局类型定义
├── utils/
│   ├── babylonHelpers.ts             # Babylon.js 助手函数
│   ├── clientOnly.tsx                # 客户端渲染组件
│   └── constants.ts                  # 常量定义
├── next.config.js                    # Next.js 配置
├── tailwind.config.js               # Tailwind CSS 配置
├── tsconfig.json                    # TypeScript 配置
└── package.json
```

## 🎯 核心功能

### 1. 基础 3D 场景
- 场景初始化和渲染
- 摄像机控制
- 光源设置
- 基础几何体

### 2. 交互式场景
- 鼠标和键盘交互
- 物体选择和高亮
- 实时动画控制
- 用户界面集成

### 3. 模型查看器
- glTF/GLB 模型加载
- 材质切换
- 动画播放
- 环境切换

### 4. 产品配置器
- 实时产品定制
- 材质和颜色选择
- 360° 产品展示
- 配置保存和分享

## 🛠️ 技术栈

- **前端框架**: Next.js 13+ (App Router)
- **3D 引擎**: Babylon.js 6.x
- **类型系统**: TypeScript
- **样式方案**: Tailwind CSS + CSS Modules
- **状态管理**: React Context API + useReducer
- **构建工具**: SWC (Next.js 内置)
- **部署平台**: Vercel / Netlify

## 📱 响应式设计

- 桌面端完整功能
- 平板端适配优化
- 移动端触摸支持
- 性能自适应调节

## ⚡ 性能优化

### 代码分割
```typescript
// 动态导入避免 SSR 问题
const BabylonScene = dynamic(() => import('../components/babylon/BabylonScene'), {
  ssr: false,
  loading: () => <LoadingScreen />
});
```

### 资源优化
```typescript
// 模型压缩和优化
const optimizedModel = await SceneLoader.ImportMeshAsync(
  "",
  "/models/",
  "chair.glb",
  scene,
  (progress) => setLoadingProgress(progress)
);
```

### 内存管理
```typescript
// 组件卸载时清理资源
useEffect(() => {
  return () => {
    scene?.dispose();
    engine?.dispose();
  };
}, []);
```

## 🎨 UI/UX 设计

### 现代化界面
- 深色主题适配
- 玻璃态效果
- 平滑动画过渡
- 直观的控制界面

### 用户体验
- 加载状态反馈
- 错误处理机制
- 性能监控显示
- 帮助提示系统

## 🔧 开发工具

### 调试和测试
```typescript
// 开发环境调试
if (process.env.NODE_ENV === 'development') {
  scene.debugLayer.show();
}

// 性能监控
const stats = new BabylonStats();
stats.showPanel(0); // FPS
```

### 代码质量
- ESLint 配置
- Prettier 格式化
- TypeScript 严格模式
- 组件单元测试

## 🚀 部署指南

### Vercel 部署
```bash
# 1. 构建项目
npm run build

# 2. 部署到 Vercel
npx vercel --prod
```

### 环境变量配置
```env
# .env.local
NEXT_PUBLIC_BABYLON_DEBUG=false
NEXT_PUBLIC_CDN_BASE_URL=https://cdn.example.com
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
```

### 静态资源优化
- 模型文件 CDN 托管
- 纹理压缩和格式优化
- 环境贴图预处理
- 浏览器缓存策略

## 📚 学习路径

### 初级 (1-2周)
1. 学习 Next.js 基础概念
2. 了解 Babylon.js 核心 API
3. 实现基础 3D 场景
4. 掌握组件化开发

### 中级 (2-3周)
1. 深入理解 React + 3D 集成
2. 实现复杂交互功能
3. 学习性能优化技巧
4. 构建完整应用

### 高级 (3-4周)
1. 掌握高级渲染技术
2. 实现实时协作功能
3. 优化生产环境部署
4. 构建企业级应用

## 🤝 社区和支持

- **官方文档**: [Next.js Docs](https://nextjs.org/docs) + [Babylon.js Docs](https://doc.babylonjs.com/)
- **示例代码**: [GitHub Repository](https://github.com/example/babylon-nextjs-demo)
- **在线演示**: [Live Demo](https://babylon-nextjs-demo.vercel.app)
- **讨论社区**: [Discord](https://discord.gg/babylonjs)

## 📄 许可证

MIT License - 查看 [LICENSE](./LICENSE) 文件了解详情。

---

*这个示例项目展示了 Next.js 与 Babylon.js 集成的最佳实践，适合用作学习参考和项目起点。*
