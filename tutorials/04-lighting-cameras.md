# 04 - 光照和摄像机

## 📚 本章目标

深入学习 Babylon.js 中的光照系统和摄像机控制，掌握如何创建逼真的光照效果和灵活的视角控制。

## 🎯 学习内容

- 各种光源类型和属性
- 阴影系统配置
- 摄像机类型和控制方式
- 高级光照技术
- 摄像机动画和转场

---

## 1. 光照系统详解

### 1.1 光源类型概览

Babylon.js 提供了多种光源类型，每种都有特定的用途：

```javascript
// 1. HemisphericLight - 环境光/天空光
// 2. DirectionalLight - 方向光/太阳光
// 3. PointLight - 点光源
// 4. SpotLight - 聚光灯
```

### 1.2 环境光 (HemisphericLight)

环境光提供柔和的全方向照明，模拟天空散射光：

```javascript
// 创建环境光
const hemisphericLight = new BABYLON.HemisphericLight(
    "hemiLight",
    new BABYLON.Vector3(0, 1, 0),  // 光线方向（通常向上）
    scene
);

// 基础属性设置
hemisphericLight.intensity = 0.7;              // 光强度 (0-1)
hemisphericLight.diffuse = new BABYLON.Color3(1, 1, 0.8);    // 漫反射颜色
hemisphericLight.specular = new BABYLON.Color3(1, 1, 1);     // 镜面反射颜色
hemisphericLight.groundColor = new BABYLON.Color3(0.3, 0.3, 0.3);  // 地面颜色

// 高级设置
hemisphericLight.setEnabled(true);             // 启用/禁用
hemisphericLight.includedOnlyMeshes = [];      // 只照亮指定网格
hemisphericLight.excludedMeshes = [];          // 排除指定网格
```

### 1.3 方向光 (DirectionalLight)

方向光模拟太阳光，具有平行光线：

```javascript
// 创建方向光
const directionalLight = new BABYLON.DirectionalLight(
    "dirLight",
    new BABYLON.Vector3(-1, -1, -1),  // 光线方向
    scene
);

// 位置和方向设置
directionalLight.position = new BABYLON.Vector3(20, 40, 20);
directionalLight.direction = new BABYLON.Vector3(-1, -1, -1);
directionalLight.intensity = 1.0;

// 颜色设置
directionalLight.diffuse = new BABYLON.Color3(1, 0.9, 0.8);   // 暖色调
directionalLight.specular = new BABYLON.Color3(1, 1, 1);

// 阴影设置（稍后详细介绍）
directionalLight.autoUpdateExtends = false;
directionalLight.shadowMinZ = 1;
directionalLight.shadowMaxZ = 50;
```

### 1.4 点光源 (PointLight)

点光源从一个点向四面八方发光：

```javascript
// 创建点光源
const pointLight = new BABYLON.PointLight(
    "pointLight",
    new BABYLON.Vector3(0, 10, 0),  // 光源位置
    scene
);

// 基础属性
pointLight.intensity = 1.0;
pointLight.diffuse = new BABYLON.Color3(1, 0.5, 0.2);  // 橙色光
pointLight.specular = new BABYLON.Color3(1, 1, 1);

// 衰减设置
pointLight.range = 20;              // 光照范围
pointLight.falloffType = BABYLON.Light.FALLOFF_INVERSE;  // 衰减类型

// 自定义衰减参数
pointLight.setLinearConstant(0);    // 线性常数
pointLight.setLinearQuadratic(1);   // 二次衰减
```

### 1.5 聚光灯 (SpotLight)

聚光灯产生锥形光束：

```javascript
// 创建聚光灯
const spotLight = new BABYLON.SpotLight(
    "spotLight",
    new BABYLON.Vector3(0, 10, 0),    // 位置
    new BABYLON.Vector3(0, -1, 0),    // 方向
    Math.PI / 3,                      // 角度（弧度）
    2,                                // 衰减指数
    scene
);

// 基础属性
spotLight.intensity = 2.0;
spotLight.diffuse = new BABYLON.Color3(1, 1, 1);
spotLight.specular = new BABYLON.Color3(1, 1, 1);

// 聚光灯特有属性
spotLight.angle = Math.PI / 4;       // 光锥角度
spotLight.exponent = 2;              // 边缘衰减
spotLight.range = 30;                // 照射距离

// 内外角度设置（创建柔和边缘）
spotLight.innerAngle = Math.PI / 6;  // 内角
spotLight.outerAngle = Math.PI / 4;  // 外角
```

---

## 2. 阴影系统

### 2.1 阴影生成器

```javascript
// 创建阴影生成器
const shadowGenerator = new BABYLON.ShadowGenerator(1024, directionalLight);

// 基础设置
shadowGenerator.useExponentialShadowMap = true;     // 指数阴影贴图
shadowGenerator.useBlurExponentialShadowMap = true; // 模糊指数阴影贴图
shadowGenerator.blurKernel = 32;                    // 模糊核大小

// 添加投射阴影的对象
shadowGenerator.addShadowCaster(sphere);
shadowGenerator.addShadowCaster(box);

// 批量添加
shadowGenerator.getShadowMap().renderList = [sphere, box, cylinder];

// 高级阴影设置
shadowGenerator.bias = 0.00001;                     // 阴影偏移
shadowGenerator.normalBias = 0.02;                  // 法线偏移
shadowGenerator.darkness = 0.5;                     // 阴影深度
```

### 2.2 接收阴影

```javascript
// 地面接收阴影
const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 20, height: 20}, scene);
ground.receiveShadows = true;

// 墙面也可以接收阴影
const wall = BABYLON.MeshBuilder.CreateBox("wall", {width: 10, height: 5, depth: 0.1}, scene);
wall.receiveShadows = true;
wall.position.z = -5;
```

### 2.3 高质量阴影配置

```javascript
// PCF (Percentage Closer Filtering) 阴影
shadowGenerator.usePoissonSampling = true;
shadowGenerator.useContactHardeningShadow = true;
shadowGenerator.contactHardeningLightSizeUVRatio = 0.05;

// CSM (Cascaded Shadow Maps) 级联阴影贴图
const csmShadowGenerator = new BABYLON.CascadedShadowGenerator(1024, directionalLight);
csmShadowGenerator.numCascades = 4;
csmShadowGenerator.autoCalcDepthBounds = true;
csmShadowGenerator.lambda = 0.8;
```

---

## 3. 摄像机系统

### 3.1 ArcRotateCamera (弧形摄像机)

最常用的摄像机类型，围绕目标旋转：

```javascript
// 创建弧形摄像机
const camera = new BABYLON.ArcRotateCamera(
    "arcCamera",
    -Math.PI / 2,          // Alpha (水平角度)
    Math.PI / 2.5,         // Beta (垂直角度)
    10,                    // Radius (距离)
    BABYLON.Vector3.Zero(), // Target (目标点)
    scene
);

// 基础设置
camera.attachToCanvas(canvas, true);        // 绑定到画布
camera.setTarget(new BABYLON.Vector3(0, 1, 0));  // 设置目标

// 控制限制
camera.lowerRadiusLimit = 2;                // 最小距离
camera.upperRadiusLimit = 50;               // 最大距离
camera.lowerAlphaLimit = -Math.PI;          // 水平角度限制
camera.upperAlphaLimit = Math.PI;
camera.lowerBetaLimit = 0.1;                // 垂直角度限制
camera.upperBetaLimit = Math.PI - 0.1;

// 响应性设置
camera.wheelPrecision = 50;                 // 滚轮精度
camera.panningSensibility = 100;            // 平移敏感度
camera.angularSensibilityX = 1000;          // 角度敏感度X
camera.angularSensibilityY = 1000;          // 角度敏感度Y

// 惯性设置
camera.inertia = 0.9;                       // 惯性系数
camera.panningInertia = 0.9;                // 平移惯性
```

### 3.2 FreeCamera (自由摄像机)

第一人称视角的摄像机：

```javascript
// 创建自由摄像机
const freeCamera = new BABYLON.FreeCamera(
    "freeCamera",
    new BABYLON.Vector3(0, 5, -10),
    scene
);

// 设置目标和控制
freeCamera.setTarget(BABYLON.Vector3.Zero());
freeCamera.attachToCanvas(canvas, true);

// WASD 控制
freeCamera.keysUp.push(87);        // W
freeCamera.keysDown.push(83);      // S
freeCamera.keysLeft.push(65);      // A
freeCamera.keysRight.push(68);     // D

// 移动设置
freeCamera.speed = 0.5;            // 移动速度
freeCamera.angularSensibility = 1500;  // 鼠标敏感度

// 碰撞检测
freeCamera.checkCollisions = true;
freeCamera.ellipsoid = new BABYLON.Vector3(1, 1, 1);  // 碰撞体积
```

### 3.3 UniversalCamera (通用摄像机)

结合了 FreeCamera 和 TouchCamera 的功能：

```javascript
// 创建通用摄像机
const universalCamera = new BABYLON.UniversalCamera(
    "universalCamera",
    new BABYLON.Vector3(0, 5, -10),
    scene
);

// 触摸控制设置
universalCamera.touchAngularSensibility = 20000;
universalCamera.touchMoveSensibility = 250;

// 设备方向控制（移动设备）
if (BABYLON.DeviceOrientationCamera.IsSupported()) {
    universalCamera.attachControl(canvas, true);
}
```

### 3.4 TargetCamera (目标摄像机)

始终朝向特定目标的摄像机：

```javascript
// 创建目标摄像机
const targetCamera = new BABYLON.TargetCamera(
    "targetCamera",
    new BABYLON.Vector3(0, 5, -10),
    scene
);

// 设置目标对象
const target = sphere;  // 假设有一个球体对象
targetCamera.setTarget(target.position);

// 跟随目标
scene.registerBeforeRender(() => {
    targetCamera.setTarget(target.position);
});
```

---

## 4. 高级光照技术

### 4.1 基于图像的光照 (IBL)

```javascript
// 加载 HDR 环境贴图
const hdrTexture = new BABYLON.HDRCubeTexture(
    "./assets/environment.hdr",
    scene,
    512
);

// 设置为场景环境贴图
scene.environmentTexture = hdrTexture;
scene.createDefaultSkybox(hdrTexture, true, 1000);

// 调整环境光强度
scene.environmentIntensity = 1.0;
```

### 4.2 PBR 光照模型

```javascript
// 创建 PBR 材质
const pbrMaterial = new BABYLON.PBRMaterial("pbrMat", scene);

// 基础颜色
pbrMaterial.baseColor = new BABYLON.Color3(0.5, 0.5, 0.5);

// 金属度和粗糙度
pbrMaterial.metallicFactor = 0.8;
pbrMaterial.roughnessFactor = 0.3;

// 环境光遮蔽
pbrMaterial.useAmbientOcclusionFromMetallicTextureRed = true;

// 应用到网格
sphere.material = pbrMaterial;
```

### 4.3 光照探针

```javascript
// 创建反射探针
const probe = new BABYLON.ReflectionProbe("probe", 512, scene);
probe.renderList.push(sphere, box, ground);
probe.refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;

// 设置探针位置
probe.setTarget(BABYLON.Vector3.Zero());

// 应用到材质
pbrMaterial.reflectionTexture = probe.cubeTexture;
```

---

## 5. 摄像机动画和转场

### 5.1 摄像机位置动画

```javascript
// 创建位置动画
const animationCameraPosition = new BABYLON.Animation(
    "cameraPosition",
    "position",
    30,
    BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
);

// 定义关键帧
const positionKeys = [];
positionKeys.push({
    frame: 0,
    value: new BABYLON.Vector3(0, 5, -10)
});
positionKeys.push({
    frame: 60,
    value: new BABYLON.Vector3(10, 5, 0)
});
positionKeys.push({
    frame: 120,
    value: new BABYLON.Vector3(0, 5, 10)
});

animationCameraPosition.setKeys(positionKeys);
camera.animations.push(animationCameraPosition);

// 开始动画
scene.beginAnimation(camera, 0, 120, true);
```

### 5.2 平滑摄像机转场

```javascript
// 摄像机转场函数
function transitionCamera(fromCamera, toCamera, duration = 2000) {
    const startPosition = fromCamera.position.clone();
    const endPosition = toCamera.position.clone();
    const startTarget = fromCamera.getTarget().clone();
    const endTarget = toCamera.getTarget().clone();
    
    const startTime = Date.now();
    
    const transition = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 使用 ease-in-out 曲线
        const eased = 0.5 * (1 - Math.cos(progress * Math.PI));
        
        // 插值位置
        fromCamera.position = BABYLON.Vector3.Lerp(startPosition, endPosition, eased);
        fromCamera.setTarget(BABYLON.Vector3.Lerp(startTarget, endTarget, eased));
        
        if (progress < 1) {
            requestAnimationFrame(transition);
        }
    };
    
    transition();
}
```

### 5.3 相机路径动画

```javascript
// 创建摄像机路径
const cameraPath = [
    new BABYLON.Vector3(0, 5, -10),
    new BABYLON.Vector3(5, 8, -5),
    new BABYLON.Vector3(10, 5, 0),
    new BABYLON.Vector3(5, 8, 5),
    new BABYLON.Vector3(0, 5, 10)
];

// 创建路径动画
function animateCameraAlongPath(camera, path, duration = 5000) {
    let currentIndex = 0;
    const startTime = Date.now();
    
    const animate = () => {
        const elapsed = Date.now() - startTime;
        const totalProgress = elapsed / duration;
        
        if (totalProgress >= 1) {
            camera.position = path[path.length - 1];
            return;
        }
        
        const segmentLength = 1 / (path.length - 1);
        const currentSegment = Math.floor(totalProgress / segmentLength);
        const segmentProgress = (totalProgress % segmentLength) / segmentLength;
        
        if (currentSegment < path.length - 1) {
            camera.position = BABYLON.Vector3.Lerp(
                path[currentSegment],
                path[currentSegment + 1],
                segmentProgress
            );
        }
        
        requestAnimationFrame(animate);
    };
    
    animate();
}
```

---

## 6. 实践示例：完整光照场景

```html
<!DOCTYPE html>
<html>
<head>
    <title>高级光照和摄像机控制</title>
    <script src="https://cdn.babylonjs.com/babylon.js"></script>
    <style>
        html, body { margin: 0; padding: 0; overflow: hidden; }
        canvas { width: 100%; height: 100%; touch-action: none; }
        .controls {
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 15px;
            border-radius: 5px;
            font-family: Arial, sans-serif;
        }
        button {
            margin: 5px;
            padding: 8px 12px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
        }
        button:hover { background: #45a049; }
    </style>
</head>
<body>
    <canvas id="renderCanvas"></canvas>
    <div class="controls">
        <h3>光照控制</h3>
        <button onclick="toggleLight('hemi')">环境光</button>
        <button onclick="toggleLight('dir')">方向光</button>
        <button onclick="toggleLight('point')">点光源</button>
        <button onclick="toggleLight('spot')">聚光灯</button>
        <br>
        <h3>摄像机控制</h3>
        <button onclick="switchCamera('arc')">弧形摄像机</button>
        <button onclick="switchCamera('free')">自由摄像机</button>
        <button onclick="animateCamera()">摄像机动画</button>
    </div>

    <script>
        const canvas = document.getElementById("renderCanvas");
        const engine = new BABYLON.Engine(canvas, true);
        
        let scene, arcCamera, freeCamera, currentCamera;
        let lights = {};
        
        function createScene() {
            scene = new BABYLON.Scene(engine);
            scene.clearColor = new BABYLON.Color3(0.1, 0.1, 0.15);
            
            // 创建摄像机
            arcCamera = new BABYLON.ArcRotateCamera(
                "arcCamera", -Math.PI / 2, Math.PI / 2.5, 15,
                BABYLON.Vector3.Zero(), scene
            );
            arcCamera.attachToCanvas(canvas, true);
            
            freeCamera = new BABYLON.FreeCamera(
                "freeCamera", new BABYLON.Vector3(0, 5, -15), scene
            );
            freeCamera.setTarget(BABYLON.Vector3.Zero());
            
            currentCamera = arcCamera;
            scene.activeCamera = currentCamera;
            
            // 创建光源
            lights.hemi = new BABYLON.HemisphericLight(
                "hemiLight", new BABYLON.Vector3(0, 1, 0), scene
            );
            lights.hemi.intensity = 0.3;
            
            lights.dir = new BABYLON.DirectionalLight(
                "dirLight", new BABYLON.Vector3(-1, -1, -1), scene
            );
            lights.dir.position = new BABYLON.Vector3(20, 40, 20);
            lights.dir.intensity = 0.8;
            
            lights.point = new BABYLON.PointLight(
                "pointLight", new BABYLON.Vector3(0, 10, 0), scene
            );
            lights.point.diffuse = new BABYLON.Color3(1, 0.8, 0.6);
            lights.point.intensity = 1.5;
            lights.point.range = 20;
            
            lights.spot = new BABYLON.SpotLight(
                "spotLight", new BABYLON.Vector3(5, 10, 5),
                new BABYLON.Vector3(-1, -1, -1), Math.PI / 4, 2, scene
            );
            lights.spot.diffuse = new BABYLON.Color3(0.8, 0.8, 1);
            lights.spot.intensity = 2.0;
            
            // 创建阴影生成器
            const shadowGenerator = new BABYLON.ShadowGenerator(1024, lights.dir);
            shadowGenerator.useExponentialShadowMap = true;
            
            // 创建场景对象
            const sphere = BABYLON.MeshBuilder.CreateSphere(
                "sphere", { diameter: 2 }, scene
            );
            sphere.position.y = 1;
            
            const box = BABYLON.MeshBuilder.CreateBox(
                "box", { size: 2 }, scene
            );
            box.position.set(3, 1, 0);
            
            const cylinder = BABYLON.MeshBuilder.CreateCylinder(
                "cylinder", { height: 3, diameter: 1.5 }, scene
            );
            cylinder.position.set(-3, 1.5, 0);
            
            const ground = BABYLON.MeshBuilder.CreateGround(
                "ground", { width: 20, height: 20 }, scene
            );
            ground.receiveShadows = true;
            
            // 添加阴影投射者
            shadowGenerator.addShadowCaster(sphere);
            shadowGenerator.addShadowCaster(box);
            shadowGenerator.addShadowCaster(cylinder);
            
            // 创建材质
            const sphereMaterial = new BABYLON.PBRMaterial("sphereMat", scene);
            sphereMaterial.baseColor = new BABYLON.Color3(0.8, 0.2, 0.2);
            sphereMaterial.metallicFactor = 0.3;
            sphereMaterial.roughnessFactor = 0.4;
            sphere.material = sphereMaterial;
            
            const boxMaterial = new BABYLON.PBRMaterial("boxMat", scene);
            boxMaterial.baseColor = new BABYLON.Color3(0.2, 0.8, 0.2);
            boxMaterial.metallicFactor = 0.7;
            boxMaterial.roughnessFactor = 0.2;
            box.material = boxMaterial;
            
            const cylinderMaterial = new BABYLON.PBRMaterial("cylinderMat", scene);
            cylinderMaterial.baseColor = new BABYLON.Color3(0.2, 0.2, 0.8);
            cylinderMaterial.metallicFactor = 0.1;
            cylinderMaterial.roughnessFactor = 0.8;
            cylinder.material = cylinderMaterial;
            
            const groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
            groundMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
            ground.material = groundMaterial;
            
            return scene;
        }
        
        function toggleLight(lightType) {
            const light = lights[lightType];
            if (light) {
                light.setEnabled(!light.isEnabled());
            }
        }
        
        function switchCamera(cameraType) {
            if (cameraType === 'arc') {
                scene.activeCamera = arcCamera;
                arcCamera.attachToCanvas(canvas, true);
                currentCamera = arcCamera;
            } else if (cameraType === 'free') {
                scene.activeCamera = freeCamera;
                freeCamera.attachToCanvas(canvas, true);
                currentCamera = freeCamera;
            }
        }
        
        function animateCamera() {
            const animation = new BABYLON.Animation(
                "cameraRotation", "alpha", 30,
                BABYLON.Animation.ANIMATIONTYPE_FLOAT,
                BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
            );
            
            const keys = [];
            keys.push({ frame: 0, value: arcCamera.alpha });
            keys.push({ frame: 60, value: arcCamera.alpha + Math.PI * 2 });
            
            animation.setKeys(keys);
            arcCamera.animations = [animation];
            
            scene.beginAnimation(arcCamera, 0, 60, false);
        }
        
        const scene = createScene();
        
        engine.runRenderLoop(() => {
            scene.render();
        });
        
        window.addEventListener("resize", () => {
            engine.resize();
        });
    </script>
</body>
</html>
```

---

## 7. 性能优化技巧

### 7.1 光源优化

```javascript
// 限制光源数量
scene.setMaxActiveLights(4);

// 使用光源分组
const lightGroup1 = new BABYLON.LightGroup("indoor");
const lightGroup2 = new BABYLON.LightGroup("outdoor");

// 动态启用/禁用光源
function optimizeLights(cameraPosition) {
    lights.forEach(light => {
        const distance = BABYLON.Vector3.Distance(cameraPosition, light.position);
        light.setEnabled(distance < light.range * 1.5);
    });
}
```

### 7.2 阴影优化

```javascript
// 动态阴影质量
function adjustShadowQuality(performance) {
    if (performance < 30) {
        shadowGenerator.mapSize = 512;  // 低质量
    } else if (performance < 60) {
        shadowGenerator.mapSize = 1024; // 中等质量
    } else {
        shadowGenerator.mapSize = 2048; // 高质量
    }
}

// 距离剔除
shadowGenerator.setDarkness(0.3);
shadowGenerator.bias = 0.0001;
```

---

## 8. 下一步

完成本章学习后，你应该掌握：

✅ 各种光源类型的特点和用法
✅ 阴影系统的配置和优化
✅ 不同摄像机的控制方式
✅ 摄像机动画和转场效果
✅ 高级光照技术的应用

继续学习：[05 - 用户交互](./05-user-interaction.md)

---

## 9. 参考资源

- [Babylon.js 光照文档](https://doc.babylonjs.com/divingDeeper/lights)
- [Babylon.js 摄像机文档](https://doc.babylonjs.com/divingDeeper/cameras)
- [PBR 材质指南](https://doc.babylonjs.com/divingDeeper/materials/using/pbrMaterial)
- [阴影系统深入](https://doc.babylonjs.com/divingDeeper/lights/shadows)
