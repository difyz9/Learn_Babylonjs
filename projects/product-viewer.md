# 项目实战 1: 3D 产品展示器

## 项目概述

创建一个交互式的 3D 产品展示器，用户可以：
- 360° 旋转查看产品
- 缩放产品查看细节
- 切换不同的材质和颜色
- 查看产品信息
- 切换不同的环境背景

## 技术栈
- Babylon.js 核心库
- Babylon.js GUI
- HTML5/CSS3
- JavaScript ES6+

## 项目结构
```
product-viewer/
├── index.html
├── js/
│   ├── main.js
│   ├── productLoader.js
│   ├── materialManager.js
│   └── uiController.js
├── css/
│   └── style.css
├── assets/
│   ├── models/
│   ├── textures/
│   └── environments/
└── README.md
```

## 开发步骤

### 第1步：项目基础架构

**index.html**
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>3D 产品展示器</title>
    
    <!-- Babylon.js -->
    <script src="https://cdn.babylonjs.com/babylon.js"></script>
    <script src="https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js"></script>
    <script src="https://cdn.babylonjs.com/gui/babylon.gui.min.js"></script>
    
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div id="loading-screen">
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <p>正在加载产品模型...</p>
        </div>
    </div>
    
    <canvas id="renderCanvas"></canvas>
    
    <div id="ui-panel">
        <div class="panel-section">
            <h3>产品信息</h3>
            <div id="product-info">
                <h4 id="product-name">选择一个产品</h4>
                <p id="product-description">产品描述将在这里显示</p>
                <p id="product-price">¥ 0.00</p>
            </div>
        </div>
        
        <div class="panel-section">
            <h3>产品选择</h3>
            <div id="product-selector">
                <button class="product-btn active" data-product="chair">椅子</button>
                <button class="product-btn" data-product="table">桌子</button>
                <button class="product-btn" data-product="lamp">台灯</button>
            </div>
        </div>
        
        <div class="panel-section">
            <h3>材质选择</h3>
            <div id="material-selector">
                <button class="material-btn active" data-material="wood">木质</button>
                <button class="material-btn" data-material="metal">金属</button>
                <button class="material-btn" data-material="leather">皮革</button>
                <button class="material-btn" data-material="fabric">布料</button>
            </div>
        </div>
        
        <div class="panel-section">
            <h3>颜色选择</h3>
            <div id="color-selector">
                <div class="color-option active" data-color="brown" style="background: #8B4513;"></div>
                <div class="color-option" data-color="black" style="background: #2C2C2C;"></div>
                <div class="color-option" data-color="white" style="background: #F5F5F5;"></div>
                <div class="color-option" data-color="red" style="background: #DC143C;"></div>
                <div class="color-option" data-color="blue" style="background: #4169E1;"></div>
            </div>
        </div>
        
        <div class="panel-section">
            <h3>环境设置</h3>
            <div id="environment-selector">
                <button class="env-btn active" data-env="studio">工作室</button>
                <button class="env-btn" data-env="outdoor">户外</button>
                <button class="env-btn" data-env="showroom">展厅</button>
            </div>
        </div>
        
        <div class="panel-section">
            <h3>查看选项</h3>
            <div id="view-options">
                <button id="wireframe-toggle">线框模式</button>
                <button id="fullscreen-toggle">全屏查看</button>
                <button id="reset-camera">重置视角</button>
                <button id="auto-rotate">自动旋转</button>
            </div>
        </div>
    </div>
    
    <div id="info-tooltip" class="tooltip hidden">
        <div class="tooltip-content">
            <h4 id="tooltip-title"></h4>
            <p id="tooltip-text"></p>
        </div>
    </div>
    
    <script src="js/productLoader.js"></script>
    <script src="js/materialManager.js"></script>
    <script src="js/uiController.js"></script>
    <script src="js/main.js"></script>
</body>
</html>
```

**css/style.css**
```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Arial', sans-serif;
    background: #1a1a1a;
    color: white;
    overflow: hidden;
}

#renderCanvas {
    width: 100vw;
    height: 100vh;
    display: block;
    touch-action: none;
}

/* 加载屏幕 */
#loading-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    transition: opacity 0.5s ease-out;
}

.loading-content {
    text-align: center;
    color: white;
}

.loading-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(255,255,255,0.3);
    border-top: 4px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* UI 面板 */
#ui-panel {
    position: fixed;
    top: 20px;
    right: 20px;
    width: 320px;
    max-height: calc(100vh - 40px);
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    padding: 20px;
    overflow-y: auto;
    z-index: 100;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.panel-section {
    margin-bottom: 25px;
}

.panel-section h3 {
    color: #4CAF50;
    margin-bottom: 15px;
    font-size: 16px;
    font-weight: 600;
    border-bottom: 2px solid #4CAF50;
    padding-bottom: 5px;
}

/* 产品信息 */
#product-info {
    background: rgba(255, 255, 255, 0.05);
    padding: 15px;
    border-radius: 8px;
    border-left: 4px solid #4CAF50;
}

#product-name {
    color: #fff;
    font-size: 18px;
    margin-bottom: 8px;
}

#product-description {
    color: #ccc;
    font-size: 14px;
    line-height: 1.4;
    margin-bottom: 10px;
}

#product-price {
    color: #4CAF50;
    font-size: 20px;
    font-weight: bold;
}

/* 按钮样式 */
.product-btn, .material-btn, .env-btn {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 2px solid transparent;
    padding: 8px 16px;
    margin: 4px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 14px;
}

.product-btn:hover, .material-btn:hover, .env-btn:hover {
    background: rgba(76, 175, 80, 0.2);
    border-color: #4CAF50;
}

.product-btn.active, .material-btn.active, .env-btn.active {
    background: #4CAF50;
    border-color: #4CAF50;
}

/* 颜色选择器 */
#color-selector {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.color-option {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    border: 3px solid transparent;
    transition: all 0.3s ease;
    position: relative;
}

.color-option:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.color-option.active {
    border-color: #4CAF50;
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.3);
}

/* 查看选项按钮 */
#view-options button {
    display: block;
    width: 100%;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 10px;
    margin: 5px 0;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 14px;
}

#view-options button:hover {
    background: rgba(76, 175, 80, 0.2);
    border-color: #4CAF50;
}

#view-options button.active {
    background: #4CAF50;
    border-color: #4CAF50;
}

/* 工具提示 */
.tooltip {
    position: fixed;
    background: rgba(0, 0, 0, 0.9);
    padding: 10px 15px;
    border-radius: 6px;
    pointer-events: none;
    z-index: 1000;
    transition: opacity 0.3s ease;
    max-width: 200px;
}

.tooltip.hidden {
    opacity: 0;
    pointer-events: none;
}

.tooltip-content h4 {
    color: #4CAF50;
    margin-bottom: 5px;
    font-size: 14px;
}

.tooltip-content p {
    color: #ccc;
    font-size: 12px;
    line-height: 1.3;
}

/* 滚动条样式 */
#ui-panel::-webkit-scrollbar {
    width: 6px;
}

#ui-panel::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
}

#ui-panel::-webkit-scrollbar-thumb {
    background: #4CAF50;
    border-radius: 3px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    #ui-panel {
        position: fixed;
        top: auto;
        bottom: 0;
        right: 0;
        left: 0;
        width: 100%;
        max-height: 50vh;
        border-radius: 20px 20px 0 0;
    }
    
    .panel-section {
        margin-bottom: 20px;
    }
    
    #color-selector {
        justify-content: center;
    }
}
```

### 第2步：核心功能实现

**js/main.js**
```javascript
class ProductViewer {
    constructor() {
        this.canvas = document.getElementById('renderCanvas');
        this.engine = new BABYLON.Engine(this.canvas, true, {
            preserveDrawingBuffer: true,
            stencil: true
        });
        
        this.scene = null;
        this.camera = null;
        this.currentProduct = null;
        this.isAutoRotating = false;
        this.autoRotateAnimation = null;
        
        this.productLoader = new ProductLoader(this);
        this.materialManager = new MaterialManager(this);
        this.uiController = new UIController(this);
        
        this.init();
    }
    
    async init() {
        await this.createScene();
        this.setupCamera();
        this.setupLighting();
        this.setupEnvironment();
        this.setupEventListeners();
        this.startRenderLoop();
        
        // 加载默认产品
        await this.loadProduct('chair');
        this.hideLoadingScreen();
    }
    
    async createScene() {
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.clearColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        
        // 启用后期处理
        const pipeline = new BABYLON.DefaultRenderingPipeline("defaultPipeline", true, this.scene);
        pipeline.fxaaEnabled = true;
        pipeline.imageProcessingEnabled = true;
        
        return this.scene;
    }
    
    setupCamera() {
        this.camera = new BABYLON.ArcRotateCamera(
            "camera",
            -Math.PI / 2,
            Math.PI / 2.5,
            8,
            BABYLON.Vector3.Zero(),
            this.scene
        );
        
        this.camera.attachToCanvas(this.canvas, true);
        this.camera.lowerRadiusLimit = 3;
        this.camera.upperRadiusLimit = 20;
        this.camera.lowerBetaLimit = 0.1;
        this.camera.upperBetaLimit = Math.PI - 0.1;
        
        // 平滑的摄像机移动
        this.camera.inertia = 0.9;
        this.camera.angularSensibilityX = 1000;
        this.camera.angularSensibilityY = 1000;
        this.camera.wheelPrecision = 50;
    }
    
    setupLighting() {
        // 环境光
        const hemiLight = new BABYLON.HemisphericLight(
            "hemiLight",
            new BABYLON.Vector3(0, 1, 0),
            this.scene
        );
        hemiLight.intensity = 0.4;
        hemiLight.diffuse = new BABYLON.Color3(0.8, 0.8, 1);
        
        // 主光源
        const dirLight = new BABYLON.DirectionalLight(
            "dirLight",
            new BABYLON.Vector3(-1, -1, -1),
            this.scene
        );
        dirLight.position = new BABYLON.Vector3(5, 5, 5);
        dirLight.intensity = 1.2;
        dirLight.diffuse = new BABYLON.Color3(1, 0.95, 0.8);
        
        // 补光
        const fillLight = new BABYLON.DirectionalLight(
            "fillLight",
            new BABYLON.Vector3(1, 0, 1),
            this.scene
        );
        fillLight.intensity = 0.3;
        fillLight.diffuse = new BABYLON.Color3(0.8, 0.9, 1);
        
        // 边缘光
        const rimLight = new BABYLON.DirectionalLight(
            "rimLight",
            new BABYLON.Vector3(0, 0, -1),
            this.scene
        );
        rimLight.intensity = 0.5;
        rimLight.diffuse = new BABYLON.Color3(1, 1, 1);
    }
    
    setupEnvironment() {
        // 创建地面
        const ground = BABYLON.MeshBuilder.CreateGround(
            "ground",
            { width: 20, height: 20 },
            this.scene
        );
        ground.position.y = -2;
        
        const groundMaterial = new BABYLON.StandardMaterial("groundMat", this.scene);
        groundMaterial.diffuseColor = new BABYLON.Color3(0.15, 0.15, 0.18);
        groundMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        ground.material = groundMaterial;
        ground.receiveShadows = true;
        
        // 创建环境球
        this.createEnvironmentSphere();
    }
    
    createEnvironmentSphere() {
        const envSphere = BABYLON.MeshBuilder.CreateSphere(
            "envSphere",
            { diameter: 50 },
            this.scene
        );
        
        const envMaterial = new BABYLON.StandardMaterial("envMat", this.scene);
        envMaterial.backFaceCulling = false;
        envMaterial.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.1);
        envMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        envSphere.material = envMaterial;
        envSphere.infiniteDistance = true;
    }
    
    setupEventListeners() {
        // 窗口大小调整
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
        
        // 键盘事件
        window.addEventListener('keydown', (event) => {
            this.handleKeyDown(event);
        });
        
        // 触摸设备支持
        this.canvas.addEventListener('touchstart', (event) => {
            event.preventDefault();
        });
    }
    
    handleKeyDown(event) {
        switch(event.code) {
            case 'Space':
                event.preventDefault();
                this.toggleAutoRotate();
                break;
            case 'KeyR':
                this.resetCamera();
                break;
            case 'KeyW':
                this.toggleWireframe();
                break;
            case 'KeyF':
                this.toggleFullscreen();
                break;
        }
    }
    
    startRenderLoop() {
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    }
    
    async loadProduct(productType) {
        await this.productLoader.loadProduct(productType);
    }
    
    changeMaterial(materialType) {
        this.materialManager.changeMaterial(materialType);
    }
    
    changeColor(color) {
        this.materialManager.changeColor(color);
    }
    
    changeEnvironment(envType) {
        // 环境切换逻辑
        console.log('Changing environment to:', envType);
    }
    
    toggleAutoRotate() {
        this.isAutoRotating = !this.isAutoRotating;
        
        if (this.isAutoRotating) {
            this.startAutoRotate();
        } else {
            this.stopAutoRotate();
        }
        
        this.uiController.updateAutoRotateButton(this.isAutoRotating);
    }
    
    startAutoRotate() {
        if (this.autoRotateAnimation) {
            this.scene.stopAnimation(this.camera);
        }
        
        const rotationAnimation = new BABYLON.Animation(
            "cameraRotation",
            "alpha",
            30,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );
        
        const keys = [
            { frame: 0, value: this.camera.alpha },
            { frame: 300, value: this.camera.alpha + Math.PI * 2 }
        ];
        
        rotationAnimation.setKeys(keys);
        
        this.autoRotateAnimation = this.scene.beginAnimation(
            this.camera,
            0,
            300,
            true
        );
    }
    
    stopAutoRotate() {
        if (this.autoRotateAnimation) {
            this.scene.stopAnimation(this.camera);
            this.autoRotateAnimation = null;
        }
    }
    
    resetCamera() {
        this.stopAutoRotate();
        this.isAutoRotating = false;
        this.uiController.updateAutoRotateButton(false);
        
        const targetPosition = {
            alpha: -Math.PI / 2,
            beta: Math.PI / 2.5,
            radius: 8
        };
        
        this.animateCamera(targetPosition);
    }
    
    animateCamera(targetPosition, duration = 1000) {
        const startAlpha = this.camera.alpha;
        const startBeta = this.camera.beta;
        const startRadius = this.camera.radius;
        
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 使用缓动函数
            const easeProgress = this.easeInOutCubic(progress);
            
            this.camera.alpha = startAlpha + (targetPosition.alpha - startAlpha) * easeProgress;
            this.camera.beta = startBeta + (targetPosition.beta - startBeta) * easeProgress;
            this.camera.radius = startRadius + (targetPosition.radius - startRadius) * easeProgress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    toggleWireframe() {
        if (this.currentProduct) {
            const isWireframe = this.currentProduct.material.wireframe;
            this.currentProduct.material.wireframe = !isWireframe;
        }
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }
    
    dispose() {
        if (this.engine) {
            this.engine.dispose();
        }
    }
}

// 启动应用
window.addEventListener('DOMContentLoaded', () => {
    const viewer = new ProductViewer();
    
    // 处理页面卸载
    window.addEventListener('beforeunload', () => {
        viewer.dispose();
    });
});
```

### 第3步：产品加载器

**js/productLoader.js**
```javascript
class ProductLoader {
    constructor(viewer) {
        this.viewer = viewer;
        this.products = {
            chair: {
                name: "现代办公椅",
                description: "符合人体工程学设计的高品质办公椅，采用优质材料制作，提供出色的舒适性和支撑性。",
                price: 2299.00,
                modelUrl: null, // 将使用程序化生成
                scale: 1
            },
            table: {
                name: "实木餐桌",
                description: "精选优质木材制作的餐桌，简约现代的设计风格，适合各种家居环境。",
                price: 3899.00,
                modelUrl: null,
                scale: 1
            },
            lamp: {
                name: "LED台灯",
                description: "现代简约设计的LED台灯，可调节亮度和色温，护眼设计，适合办公和学习使用。",
                price: 599.00,
                modelUrl: null,
                scale: 1
            }
        };
    }
    
    async loadProduct(productType) {
        if (!this.products[productType]) {
            console.error('Product type not found:', productType);
            return;
        }
        
        // 清除当前产品
        this.clearCurrentProduct();
        
        // 创建新产品
        const product = await this.createProduct(productType);
        
        if (product) {
            this.viewer.currentProduct = product;
            this.viewer.uiController.updateProductInfo(this.products[productType]);
            
            // 调整摄像机到合适的位置
            this.adjustCameraForProduct(productType);
        }
    }
    
    clearCurrentProduct() {
        if (this.viewer.currentProduct) {
            this.viewer.currentProduct.dispose();
            this.viewer.currentProduct = null;
        }
    }
    
    async createProduct(productType) {
        switch (productType) {
            case 'chair':
                return this.createChair();
            case 'table':
                return this.createTable();
            case 'lamp':
                return this.createLamp();
            default:
                console.error('Unknown product type:', productType);
                return null;
        }
    }
    
    createChair() {
        const scene = this.viewer.scene;
        
        // 椅子座面
        const seat = BABYLON.MeshBuilder.CreateBox("chairSeat", {
            width: 1.8,
            height: 0.15,
            depth: 1.6
        }, scene);
        seat.position.y = 1;
        
        // 椅背
        const backrest = BABYLON.MeshBuilder.CreateBox("chairBack", {
            width: 1.8,
            height: 1.5,
            depth: 0.15
        }, scene);
        backrest.position.y = 1.75;
        backrest.position.z = -0.7;
        
        // 扶手
        const armrest1 = BABYLON.MeshBuilder.CreateBox("armrest1", {
            width: 0.15,
            height: 0.8,
            depth: 1.2
        }, scene);
        armrest1.position.set(0.8, 1.4, -0.2);
        
        const armrest2 = armrest1.clone("armrest2");
        armrest2.position.x = -0.8;
        
        // 椅子腿
        const legs = [];
        const legPositions = [
            [0.7, 0.5, 0.6],
            [-0.7, 0.5, 0.6],
            [0.7, 0.5, -0.6],
            [-0.7, 0.5, -0.6]
        ];
        
        legPositions.forEach((pos, index) => {
            const leg = BABYLON.MeshBuilder.CreateCylinder(`chairLeg${index}`, {
                height: 1,
                diameter: 0.1
            }, scene);
            leg.position.set(pos[0], pos[1], pos[2]);
            legs.push(leg);
        });
        
        // 合并所有部件
        const chairParts = [seat, backrest, armrest1, armrest2, ...legs];
        const chair = BABYLON.Mesh.MergeMeshes(chairParts);
        chair.name = "chair";
        
        // 应用默认材质
        this.viewer.materialManager.applyDefaultMaterial(chair);
        
        return chair;
    }
    
    createTable() {
        const scene = this.viewer.scene;
        
        // 桌面
        const tabletop = BABYLON.MeshBuilder.CreateBox("tableTop", {
            width: 3,
            height: 0.15,
            depth: 1.5
        }, scene);
        tabletop.position.y = 1.5;
        
        // 桌腿
        const legs = [];
        const legPositions = [
            [1.3, 0.75, 0.6],
            [-1.3, 0.75, 0.6],
            [1.3, 0.75, -0.6],
            [-1.3, 0.75, -0.6]
        ];
        
        legPositions.forEach((pos, index) => {
            const leg = BABYLON.MeshBuilder.CreateBox(`tableLeg${index}`, {
                width: 0.1,
                height: 1.5,
                depth: 0.1
            }, scene);
            leg.position.set(pos[0], pos[1], pos[2]);
            legs.push(leg);
        });
        
        // 合并所有部件
        const tableParts = [tabletop, ...legs];
        const table = BABYLON.Mesh.MergeMeshes(tableParts);
        table.name = "table";
        
        this.viewer.materialManager.applyDefaultMaterial(table);
        
        return table;
    }
    
    createLamp() {
        const scene = this.viewer.scene;
        
        // 灯座
        const base = BABYLON.MeshBuilder.CreateCylinder("lampBase", {
            height: 0.3,
            diameter: 1.2
        }, scene);
        base.position.y = 0.15;
        
        // 灯杆
        const pole = BABYLON.MeshBuilder.CreateCylinder("lampPole", {
            height: 2,
            diameter: 0.08
        }, scene);
        pole.position.y = 1.3;
        
        // 灯罩
        const shade = BABYLON.MeshBuilder.CreateSphere("lampShade", {
            diameter: 1.2,
            segments: 16
        }, scene);
        shade.position.y = 2.5;
        
        // 调整灯罩形状
        const shadeVertices = shade.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        for (let i = 0; i < shadeVertices.length; i += 3) {
            if (shadeVertices[i + 1] < 0) {
                shadeVertices[i] *= 0.7;
                shadeVertices[i + 2] *= 0.7;
            }
        }
        shade.updateVerticesData(BABYLON.VertexBuffer.PositionKind, shadeVertices);
        
        // 合并所有部件
        const lampParts = [base, pole, shade];
        const lamp = BABYLON.Mesh.MergeMeshes(lampParts);
        lamp.name = "lamp";
        
        this.viewer.materialManager.applyDefaultMaterial(lamp);
        
        return lamp;
    }
    
    adjustCameraForProduct(productType) {
        let targetPosition;
        
        switch (productType) {
            case 'chair':
                targetPosition = {
                    alpha: -Math.PI / 2,
                    beta: Math.PI / 2.5,
                    radius: 6
                };
                break;
            case 'table':
                targetPosition = {
                    alpha: -Math.PI / 3,
                    beta: Math.PI / 2.2,
                    radius: 8
                };
                break;
            case 'lamp':
                targetPosition = {
                    alpha: -Math.PI / 4,
                    beta: Math.PI / 2.8,
                    radius: 5
                };
                break;
            default:
                targetPosition = {
                    alpha: -Math.PI / 2,
                    beta: Math.PI / 2.5,
                    radius: 8
                };
        }
        
        this.viewer.animateCamera(targetPosition, 1500);
    }
}
```

### 第4步：材质管理器

**js/materialManager.js**
```javascript
class MaterialManager {
    constructor(viewer) {
        this.viewer = viewer;
        this.currentMaterialType = 'wood';
        this.currentColor = 'brown';
        
        this.materialConfigs = {
            wood: {
                name: "木质材质",
                baseColor: { r: 0.6, g: 0.4, b: 0.2 },
                metallic: 0.0,
                roughness: 0.8,
                specularIntensity: 0.2
            },
            metal: {
                name: "金属材质",
                baseColor: { r: 0.7, g: 0.7, b: 0.8 },
                metallic: 1.0,
                roughness: 0.1,
                specularIntensity: 1.0
            },
            leather: {
                name: "皮革材质",
                baseColor: { r: 0.4, g: 0.2, b: 0.1 },
                metallic: 0.0,
                roughness: 0.7,
                specularIntensity: 0.3
            },
            fabric: {
                name: "布料材质",
                baseColor: { r: 0.5, g: 0.5, b: 0.6 },
                metallic: 0.0,
                roughness: 0.9,
                specularIntensity: 0.1
            }
        };
        
        this.colorConfigs = {
            brown: { r: 1.0, g: 0.6, b: 0.3 },
            black: { r: 0.1, g: 0.1, b: 0.1 },
            white: { r: 0.9, g: 0.9, b: 0.9 },
            red: { r: 0.8, g: 0.2, b: 0.2 },
            blue: { r: 0.2, g: 0.4, b: 0.8 }
        };
    }
    
    applyDefaultMaterial(mesh) {
        this.changeMaterial(this.currentMaterialType, mesh);
    }
    
    changeMaterial(materialType, targetMesh = null) {
        this.currentMaterialType = materialType;
        const mesh = targetMesh || this.viewer.currentProduct;
        
        if (!mesh) return;
        
        const config = this.materialConfigs[materialType];
        if (!config) {
            console.error('Material type not found:', materialType);
            return;
        }
        
        // 使用 PBR 材质
        const material = new BABYLON.PBRMaterial(`${materialType}_material`, this.viewer.scene);
        
        // 应用材质配置
        this.applyMaterialConfig(material, config);
        
        // 应用当前颜色
        this.applyColor(material, this.currentColor);
        
        // 根据材质类型添加特殊效果
        this.addMaterialEffects(material, materialType);
        
        mesh.material = material;
        
        // 添加材质切换动画
        this.animateMaterialTransition(mesh);
    }
    
    applyMaterialConfig(material, config) {
        material.baseColor = new BABYLON.Color3(
            config.baseColor.r,
            config.baseColor.g,
            config.baseColor.b
        );
        material.metallicFactor = config.metallic;
        material.roughnessFactor = config.roughness;
        material.environmentIntensity = 1.0;
        
        if (config.specularIntensity !== undefined) {
            material.directIntensity = config.specularIntensity;
        }
    }
    
    changeColor(color) {
        this.currentColor = color;
        const mesh = this.viewer.currentProduct;
        
        if (!mesh || !mesh.material) return;
        
        this.applyColor(mesh.material, color);
        this.animateColorTransition(mesh.material, color);
    }
    
    applyColor(material, color) {
        const colorConfig = this.colorConfigs[color];
        if (!colorConfig) {
            console.error('Color not found:', color);
            return;
        }
        
        // 根据材质类型调整颜色
        const materialConfig = this.materialConfigs[this.currentMaterialType];
        
        material.baseColor = new BABYLON.Color3(
            colorConfig.r * materialConfig.baseColor.r,
            colorConfig.g * materialConfig.baseColor.g,
            colorConfig.b * materialConfig.baseColor.b
        );
    }
    
    addMaterialEffects(material, materialType) {
        switch (materialType) {
            case 'wood':
                this.addWoodTexture(material);
                break;
            case 'metal':
                this.addMetalReflection(material);
                break;
            case 'leather':
                this.addLeatherTexture(material);
                break;
            case 'fabric':
                this.addFabricTexture(material);
                break;
        }
    }
    
    addWoodTexture(material) {
        // 创建木纹纹理
        const texture = new BABYLON.DynamicTexture("woodTexture", 512, this.viewer.scene);
        const ctx = texture.getContext();
        
        // 绘制木纹
        const gradient = ctx.createLinearGradient(0, 0, 512, 0);
        gradient.addColorStop(0, '#8B4513');
        gradient.addColorStop(0.3, '#A0522D');
        gradient.addColorStop(0.6, '#8B4513');
        gradient.addColorStop(1, '#654321');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);
        
        // 添加木纹细节
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        for (let i = 0; i < 20; i++) {
            ctx.beginPath();
            ctx.moveTo(0, Math.random() * 512);
            ctx.bezierCurveTo(
                128, Math.random() * 512,
                384, Math.random() * 512,
                512, Math.random() * 512
            );
            ctx.stroke();
        }
        
        texture.update();
        material.baseTexture = texture;
    }
    
    addMetalReflection(material) {
        material.environmentIntensity = 1.5;
        material.metallicFactor = 1.0;
        material.roughnessFactor = 0.05;
        
        // 添加金属光泽
        material.clearCoat.isEnabled = true;
        material.clearCoat.intensity = 0.3;
    }
    
    addLeatherTexture(material) {
        // 创建皮革纹理
        const texture = new BABYLON.DynamicTexture("leatherTexture", 512, this.viewer.scene);
        const ctx = texture.getContext();
        
        ctx.fillStyle = '#4A4A4A';
        ctx.fillRect(0, 0, 512, 512);
        
        // 添加皮革纹理
        ctx.fillStyle = '#3A3A3A';
        for (let i = 0; i < 1000; i++) {
            ctx.beginPath();
            ctx.arc(
                Math.random() * 512,
                Math.random() * 512,
                Math.random() * 2 + 1,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
        
        texture.update();
        material.baseTexture = texture;
        
        // 创建法线贴图
        const normalTexture = new BABYLON.DynamicTexture("leatherNormal", 512, this.viewer.scene);
        material.bumpTexture = normalTexture;
    }
    
    addFabricTexture(material) {
        // 创建布料纹理
        const texture = new BABYLON.DynamicTexture("fabricTexture", 512, this.viewer.scene);
        const ctx = texture.getContext();
        
        // 绘制编织图案
        ctx.fillStyle = '#666666';
        ctx.fillRect(0, 0, 512, 512);
        
        ctx.fillStyle = '#777777';
        const gridSize = 8;
        for (let x = 0; x < 512; x += gridSize) {
            for (let y = 0; y < 512; y += gridSize) {
                if ((x / gridSize + y / gridSize) % 2 === 0) {
                    ctx.fillRect(x, y, gridSize, gridSize);
                }
            }
        }
        
        texture.update();
        material.baseTexture = texture;
        material.roughnessFactor = 0.9;
    }
    
    animateMaterialTransition(mesh) {
        // 材质切换动画
        const originalScale = mesh.scaling.clone();
        
        const scaleDown = new BABYLON.Animation(
            "scaleDown",
            "scaling",
            30,
            BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        
        scaleDown.setKeys([
            { frame: 0, value: originalScale },
            { frame: 15, value: originalScale.scale(0.95) }
        ]);
        
        const scaleUp = new BABYLON.Animation(
            "scaleUp",
            "scaling",
            30,
            BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        
        scaleUp.setKeys([
            { frame: 0, value: originalScale.scale(0.95) },
            { frame: 15, value: originalScale }
        ]);
        
        const downAnimation = this.viewer.scene.beginAnimation(mesh, 0, 15, false, 1);
        downAnimation.onAnimationEndObservable.add(() => {
            this.viewer.scene.beginAnimation(mesh, 0, 15, false, 1, scaleUp);
        });
    }
    
    animateColorTransition(material, color) {
        const targetColor = this.colorConfigs[color];
        const materialConfig = this.materialConfigs[this.currentMaterialType];
        
        const finalColor = new BABYLON.Color3(
            targetColor.r * materialConfig.baseColor.r,
            targetColor.g * materialConfig.baseColor.g,
            targetColor.b * materialConfig.baseColor.b
        );
        
        // 创建颜色过渡动画
        const colorAnimation = new BABYLON.Animation(
            "colorTransition",
            "baseColor",
            30,
            BABYLON.Animation.ANIMATIONTYPE_COLOR3,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        
        colorAnimation.setKeys([
            { frame: 0, value: material.baseColor.clone() },
            { frame: 30, value: finalColor }
        ]);
        
        const easing = new BABYLON.CubicEase();
        easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
        colorAnimation.setEasingFunction(easing);
        
        this.viewer.scene.beginAnimation(material, 0, 30, false);
    }
}
```

## 运行项目

1. 将所有文件保存到对应目录
2. 使用 Live Server 或类似工具启动本地服务器
3. 在浏览器中打开 `index.html`

## 功能特点

- **交互式3D查看**: 360°旋转、缩放、平移
- **产品切换**: 椅子、桌子、台灯等不同产品
- **材质系统**: 木质、金属、皮革、布料材质
- **颜色选择**: 多种颜色选项
- **动画效果**: 平滑的过渡动画
- **响应式设计**: 支持移动设备
- **性能优化**: 高效的渲染和内存管理

## 扩展功能

- 添加更多产品模型
- 实现模型文件加载 (glTF, OBJ等)
- 添加AR查看功能
- 集成购物车功能
- 添加产品配置器

这个项目展示了如何使用 Babylon.js 创建一个功能完整的3D产品展示器，可以作为电商、产品展示等应用的基础。
