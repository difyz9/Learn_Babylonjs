# 教程 1: Babylon.js 基础设置

## 学习目标
- 了解 Babylon.js 的基本架构
- 创建第一个 3D 场景
- 设置渲染循环

## 1. HTML 基础模板

创建一个基本的 HTML 文件作为 Babylon.js 应用的基础：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Babylon.js 基础教程</title>
    
    <!-- 引入 Babylon.js -->
    <script src="https://cdn.babylonjs.com/babylon.js"></script>
    
    <!-- 可选：GUI 扩展 -->
    <script src="https://cdn.babylonjs.com/gui/babylon.gui.min.js"></script>
    
    <style>
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            font-family: Arial, sans-serif;
        }
        
        #canvas {
            width: 100vw;
            height: 100vh;
            display: block;
            touch-action: none;
        }
        
        #info {
            position: absolute;
            top: 10px;
            left: 10px;
            color: white;
            background: rgba(0,0,0,0.5);
            padding: 10px;
            border-radius: 5px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <canvas id="canvas"></canvas>
    <div id="info">
        <div>Babylon.js 基础教程</div>
        <div>使用鼠标拖拽旋转视角</div>
        <div>滚轮缩放</div>
    </div>
    
    <script>
        // JavaScript 代码将在这里编写
    </script>
</body>
</html>
```

## 2. JavaScript 基础结构

```javascript
// 等待页面加载完成
window.addEventListener('DOMContentLoaded', () => {
    // 获取 canvas 元素
    const canvas = document.getElementById('canvas');
    
    // 创建 Babylon.js 引擎
    const engine = new BABYLON.Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true
    });
    
    // 创建场景函数
    const createScene = () => {
        // 创建场景
        const scene = new BABYLON.Scene(engine);
        
        // 设置背景颜色
        scene.clearColor = new BABYLON.Color3(0.2, 0.2, 0.3);
        
        return scene;
    };
    
    // 创建场景
    const scene = createScene();
    
    // 渲染循环
    engine.runRenderLoop(() => {
        scene.render();
    });
    
    // 窗口大小调整处理
    window.addEventListener('resize', () => {
        engine.resize();
    });
});
```

## 3. 添加摄像机

```javascript
// 在 createScene 函数中添加
const createCamera = (scene) => {
    // 创建弧形旋转摄像机
    const camera = new BABYLON.ArcRotateCamera(
        "camera1",
        -Math.PI / 2,     // alpha (水平旋转角度)
        Math.PI / 2.5,    // beta (垂直旋转角度)
        10,               // radius (距离目标的距离)
        BABYLON.Vector3.Zero(), // target (目标位置)
        scene
    );
    
    // 设置摄像机控制
    camera.attachToCanvas(canvas, true);
    
    // 设置缩放限制
    camera.lowerRadiusLimit = 2;
    camera.upperRadiusLimit = 20;
    
    return camera;
};

// 在 createScene 函数中调用
const camera = createCamera(scene);
```

## 4. 添加光源

```javascript
const createLighting = (scene) => {
    // 环境光 - 提供基础照明
    const hemisphericLight = new BABYLON.HemisphericLight(
        "hemisphericLight",
        new BABYLON.Vector3(0, 1, 0),
        scene
    );
    hemisphericLight.intensity = 0.7;
    
    // 方向光 - 模拟太阳光
    const directionalLight = new BABYLON.DirectionalLight(
        "directionalLight",
        new BABYLON.Vector3(-1, -1, -1),
        scene
    );
    directionalLight.intensity = 0.5;
    
    return { hemisphericLight, directionalLight };
};

// 在 createScene 函数中调用
const lights = createLighting(scene);
```

## 5. 创建第一个 3D 对象

```javascript
const createMeshes = (scene) => {
    // 创建一个立方体
    const box = BABYLON.MeshBuilder.CreateBox("box", {size: 2}, scene);
    
    // 设置立方体位置
    box.position.y = 1;
    
    // 创建地面
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {
        width: 6,
        height: 6
    }, scene);
    
    return { box, ground };
};

// 在 createScene 函数中调用
const meshes = createMeshes(scene);
```

## 6. 完整示例代码

```javascript
window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    const engine = new BABYLON.Engine(canvas, true);
    
    const createScene = () => {
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color3(0.2, 0.2, 0.3);
        
        // 摄像机
        const camera = new BABYLON.ArcRotateCamera(
            "camera1",
            -Math.PI / 2,
            Math.PI / 2.5,
            10,
            BABYLON.Vector3.Zero(),
            scene
        );
        camera.attachToCanvas(canvas, true);
        
        // 光源
        const light = new BABYLON.HemisphericLight(
            "light1",
            new BABYLON.Vector3(0, 1, 0),
            scene
        );
        light.intensity = 0.7;
        
        // 3D 对象
        const box = BABYLON.MeshBuilder.CreateBox("box", {size: 2}, scene);
        box.position.y = 1;
        
        const ground = BABYLON.MeshBuilder.CreateGround("ground", {
            width: 6,
            height: 6
        }, scene);
        
        return scene;
    };
    
    const scene = createScene();
    
    engine.runRenderLoop(() => {
        scene.render();
    });
    
    window.addEventListener('resize', () => {
        engine.resize();
    });
});
```

## 7. 调试技巧

### 查看场景信息
```javascript
// 显示调试信息
scene.debugLayer.show();

// 显示坐标轴
const showAxis = (size) => {
    const makeTextPlane = (text, color, size) => {
        const dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", 50, scene, true);
        dynamicTexture.hasAlpha = true;
        dynamicTexture.drawText(text, 5, 40, "bold 36px Arial", color , "transparent", true);
        const plane = BABYLON.MeshBuilder.CreatePlane("TextPlane", {size: size}, scene);
        const material = new BABYLON.StandardMaterial("TextPlaneMaterial", scene);
        material.diffuseTexture = dynamicTexture;
        plane.material = material;
        return plane;
    };
    
    // X轴 - 红色
    const axisX = BABYLON.MeshBuilder.CreateLines("axisX", {
        points: [
            BABYLON.Vector3.Zero(), 
            new BABYLON.Vector3(size, 0, 0)
        ]
    }, scene);
    axisX.color = new BABYLON.Color3(1, 0, 0);
    
    // Y轴 - 绿色  
    const axisY = BABYLON.MeshBuilder.CreateLines("axisY", {
        points: [
            BABYLON.Vector3.Zero(), 
            new BABYLON.Vector3(0, size, 0)
        ]
    }, scene);
    axisY.color = new BABYLON.Color3(0, 1, 0);
    
    // Z轴 - 蓝色
    const axisZ = BABYLON.MeshBuilder.CreateLines("axisZ", {
        points: [
            BABYLON.Vector3.Zero(), 
            new BABYLON.Vector3(0, 0, size)
        ]
    }, scene);
    axisZ.color = new BABYLON.Color3(0, 0, 1);
};

// 调用显示坐标轴
showAxis(5);
```

## 8. 常见问题

### Q: 场景是黑色的，什么都看不到
A: 检查以下几点：
- 确保有光源
- 确保摄像机位置正确
- 确保 3D 对象在摄像机视野内

### Q: 鼠标控制不起作用
A: 确保调用了 `camera.attachToCanvas(canvas, true)`

### Q: 页面缩放时画面变形
A: 确保添加了窗口大小调整事件处理

## 9. 练习任务

1. 修改立方体的颜色
2. 添加更多几何体（球体、圆柱体等）
3. 改变光源的颜色和强度
4. 尝试不同的摄像机类型

## 下一步

在下一个教程中，我们将学习：
- 材质和纹理系统
- 几何体的详细创建
- 基础动画

---

*提示：保存这个 HTML 文件并在浏览器中打开，你应该能看到一个可以用鼠标控制的 3D 场景！*
