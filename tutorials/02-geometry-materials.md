# 教程 2: 几何体与材质系统

## 学习目标
- 掌握各种内置几何体的创建
- 理解材质系统的基本概念
- 学会应用纹理和颜色

## 1. 内置几何体

### 1.1 基础几何体

```javascript
const createBasicMeshes = (scene) => {
    // 立方体
    const box = BABYLON.MeshBuilder.CreateBox("box", {
        size: 2,
        width: 2,
        height: 3,
        depth: 1
    }, scene);
    box.position = new BABYLON.Vector3(-4, 1, 0);
    
    // 球体
    const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {
        diameter: 2,
        segments: 16  // 细分程度
    }, scene);
    sphere.position = new BABYLON.Vector3(-2, 1, 0);
    
    // 圆柱体
    const cylinder = BABYLON.MeshBuilder.CreateCylinder("cylinder", {
        height: 3,
        diameterTop: 2,
        diameterBottom: 2,
        tessellation: 8
    }, scene);
    cylinder.position = new BABYLON.Vector3(0, 1.5, 0);
    
    // 圆锥体
    const cone = BABYLON.MeshBuilder.CreateCylinder("cone", {
        height: 3,
        diameterTop: 0,
        diameterBottom: 2,
        tessellation: 8
    }, scene);
    cone.position = new BABYLON.Vector3(2, 1.5, 0);
    
    // 平面
    const plane = BABYLON.MeshBuilder.CreatePlane("plane", {
        size: 2
    }, scene);
    plane.position = new BABYLON.Vector3(4, 1, 0);
    
    return { box, sphere, cylinder, cone, plane };
};
```

### 1.2 高级几何体

```javascript
const createAdvancedMeshes = (scene) => {
    // 环形体
    const torus = BABYLON.MeshBuilder.CreateTorus("torus", {
        diameter: 2,
        thickness: 0.5,
        tessellation: 16
    }, scene);
    torus.position = new BABYLON.Vector3(-3, 1, 3);
    
    // 地面
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {
        width: 10,
        height: 10,
        subdivisions: 2
    }, scene);
    
    // 带高度图的地面
    const groundFromHeightMap = BABYLON.MeshBuilder.CreateGroundFromHeightMap("groundFromHeightMap", 
        "https://www.babylonjs-playground.com/textures/heightMap.png", {
        width: 10,
        height: 10,
        subdivisions: 50,
        minHeight: 0,
        maxHeight: 2
    }, scene);
    groundFromHeightMap.position.z = 5;
    
    // 多边形
    const polygon = BABYLON.MeshBuilder.CreatePolygon("polygon", {
        shape: [
            new BABYLON.Vector3(0, 0, 0),
            new BABYLON.Vector3(2, 0, 0),
            new BABYLON.Vector3(1, 2, 0),
            new BABYLON.Vector3(-1, 2, 0)
        ]
    }, scene);
    polygon.position = new BABYLON.Vector3(3, 1, 3);
    
    return { torus, ground, groundFromHeightMap, polygon };
};
```

## 2. 材质系统

### 2.1 标准材质 (StandardMaterial)

```javascript
const createStandardMaterials = (scene) => {
    // 基础颜色材质
    const redMaterial = new BABYLON.StandardMaterial("redMaterial", scene);
    redMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);  // 红色
    redMaterial.specularColor = new BABYLON.Color3(0, 1, 0); // 绿色高光
    
    // 金属材质
    const metalMaterial = new BABYLON.StandardMaterial("metalMaterial", scene);
    metalMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    metalMaterial.specularColor = new BABYLON.Color3(1, 1, 1);
    metalMaterial.specularPower = 64;
    
    // 发光材质
    const emissiveMaterial = new BABYLON.StandardMaterial("emissiveMaterial", scene);
    emissiveMaterial.emissiveColor = new BABYLON.Color3(0, 0, 1);
    emissiveMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    
    // 透明材质
    const transparentMaterial = new BABYLON.StandardMaterial("transparentMaterial", scene);
    transparentMaterial.diffuseColor = new BABYLON.Color3(0, 1, 1);
    transparentMaterial.alpha = 0.5;
    
    return { redMaterial, metalMaterial, emissiveMaterial, transparentMaterial };
};
```

### 2.2 PBR 材质 (Physically Based Rendering)

```javascript
const createPBRMaterials = (scene) => {
    // 基础 PBR 材质
    const pbrMaterial = new BABYLON.PBRMaterial("pbrMaterial", scene);
    pbrMaterial.baseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    pbrMaterial.metallicFactor = 0.8;
    pbrMaterial.roughnessFactor = 0.2;
    
    // 金属 PBR 材质
    const goldMaterial = new BABYLON.PBRMaterial("goldMaterial", scene);
    goldMaterial.baseColor = new BABYLON.Color3(1.0, 0.765557, 0.336057);
    goldMaterial.metallicFactor = 1.0;
    goldMaterial.roughnessFactor = 0.1;
    
    // 塑料 PBR 材质
    const plasticMaterial = new BABYLON.PBRMaterial("plasticMaterial", scene);
    plasticMaterial.baseColor = new BABYLON.Color3(1, 0, 0);
    plasticMaterial.metallicFactor = 0.0;
    plasticMaterial.roughnessFactor = 0.9;
    
    return { pbrMaterial, goldMaterial, plasticMaterial };
};
```

## 3. 纹理系统

### 3.1 基础纹理

```javascript
const createTextures = (scene) => {
    // 漫反射纹理
    const diffuseTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/grass.jpg", scene);
    
    // 法线贴图
    const normalTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/normalMap.jpg", scene);
    
    // 高光贴图
    const specularTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/specularglossymap.png", scene);
    
    // 创建带纹理的材质
    const texturedMaterial = new BABYLON.StandardMaterial("texturedMaterial", scene);
    texturedMaterial.diffuseTexture = diffuseTexture;
    texturedMaterial.bumpTexture = normalTexture;
    texturedMaterial.specularTexture = specularTexture;
    
    return { texturedMaterial };
};
```

### 3.2 程序化纹理

```javascript
const createProceduralTextures = (scene) => {
    // 动态纹理
    const dynamicTexture = new BABYLON.DynamicTexture("dynamicTexture", {width:512, height:512}, scene);
    dynamicTexture.hasAlpha = true;
    
    // 在纹理上绘制文字
    dynamicTexture.drawText("Babylon.js", null, null, "bold 60px Arial", "green", "transparent", true);
    
    // 棋盘格纹理
    const checkerTexture = new BABYLON.DynamicTexture("checkerTexture", {width:512, height:512}, scene);
    const size = 32;
    for (let x = 0; x < 512; x += size) {
        for (let y = 0; y < 512; y += size) {
            const color = ((x / size) + (y / size)) % 2 === 0 ? "white" : "black";
            checkerTexture.getContext().fillStyle = color;
            checkerTexture.getContext().fillRect(x, y, size, size);
        }
    }
    checkerTexture.update();
    
    return { dynamicTexture, checkerTexture };
};
```

## 4. UV 映射

### 4.1 UV 坐标理解

```javascript
const demonstrateUVMapping = (scene) => {
    // 创建一个平面来演示 UV 映射
    const plane = BABYLON.MeshBuilder.CreatePlane("uvPlane", {size: 3}, scene);
    
    // 创建 UV 网格纹理
    const uvTexture = new BABYLON.DynamicTexture("uvTexture", 512, scene);
    const context = uvTexture.getContext();
    
    // 绘制 UV 网格
    context.fillStyle = "white";
    context.fillRect(0, 0, 512, 512);
    context.strokeStyle = "blue";
    context.lineWidth = 2;
    
    // 绘制网格线
    for (let i = 0; i <= 10; i++) {
        const pos = (i / 10) * 512;
        context.beginPath();
        context.moveTo(pos, 0);
        context.lineTo(pos, 512);
        context.stroke();
        
        context.beginPath();
        context.moveTo(0, pos);
        context.lineTo(512, pos);
        context.stroke();
    }
    
    uvTexture.update();
    
    // 应用纹理
    const uvMaterial = new BABYLON.StandardMaterial("uvMaterial", scene);
    uvMaterial.diffuseTexture = uvTexture;
    plane.material = uvMaterial;
    
    return plane;
};
```

### 4.2 纹理变换

```javascript
const textureTransforms = (scene) => {
    const plane = BABYLON.MeshBuilder.CreatePlane("transformPlane", {size: 3}, scene);
    
    const material = new BABYLON.StandardMaterial("transformMaterial", scene);
    const texture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/grass.jpg", scene);
    
    // 纹理缩放
    texture.uScale = 2;  // U 方向缩放 2 倍
    texture.vScale = 2;  // V 方向缩放 2 倍
    
    // 纹理偏移
    texture.uOffset = 0.25;  // U 方向偏移
    texture.vOffset = 0.25;  // V 方向偏移
    
    // 纹理旋转
    texture.wAng = Math.PI / 4;  // 旋转 45 度
    
    // 纹理包装模式
    texture.wrapU = BABYLON.Texture.MIRROR_ADDRESSMODE;  // 镜像模式
    texture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;   // 钳制模式
    
    material.diffuseTexture = texture;
    plane.material = material;
    
    return plane;
};
```

## 5. 材质混合与多纹理

```javascript
const createMultiMaterial = (scene) => {
    // 创建多材质
    const multiMaterial = new BABYLON.MultiMaterial("multiMaterial", scene);
    
    // 子材质 1
    const material1 = new BABYLON.StandardMaterial("material1", scene);
    material1.diffuseColor = new BABYLON.Color3(1, 0, 0);
    
    // 子材质 2
    const material2 = new BABYLON.StandardMaterial("material2", scene);
    material2.diffuseColor = new BABYLON.Color3(0, 1, 0);
    
    // 添加子材质
    multiMaterial.subMaterials.push(material1);
    multiMaterial.subMaterials.push(material2);
    
    // 创建几何体并设置子网格
    const box = BABYLON.MeshBuilder.CreateBox("multiBox", {size: 2}, scene);
    box.material = multiMaterial;
    
    // 设置不同面使用不同材质
    box.subMeshes = [];
    box.subMeshes.push(new BABYLON.SubMesh(0, 0, 4, 0, 6, box));      // 前面
    box.subMeshes.push(new BABYLON.SubMesh(1, 4, 4, 6, 6, box));     // 后面
    
    return box;
};
```

## 6. 完整示例

```javascript
window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    const engine = new BABYLON.Engine(canvas, true);
    
    const createScene = () => {
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color3(0.2, 0.2, 0.3);
        
        // 摄像机
        const camera = new BABYLON.ArcRotateCamera(
            "camera",
            -Math.PI / 2,
            Math.PI / 2.5,
            15,
            BABYLON.Vector3.Zero(),
            scene
        );
        camera.attachToCanvas(canvas, true);
        
        // 光源
        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.7;
        
        // 创建不同材质的几何体
        const meshes = [];
        
        // 红色立方体
        const box = BABYLON.MeshBuilder.CreateBox("box", {size: 2}, scene);
        const redMaterial = new BABYLON.StandardMaterial("red", scene);
        redMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);
        box.material = redMaterial;
        box.position.x = -4;
        meshes.push(box);
        
        // 纹理球体
        const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 2}, scene);
        const texturedMaterial = new BABYLON.StandardMaterial("textured", scene);
        texturedMaterial.diffuseTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/grass.jpg", scene);
        sphere.material = texturedMaterial;
        sphere.position.x = -2;
        meshes.push(sphere);
        
        // PBR 金属圆柱
        const cylinder = BABYLON.MeshBuilder.CreateCylinder("cylinder", {height: 3}, scene);
        const pbrMaterial = new BABYLON.PBRMaterial("pbr", scene);
        pbrMaterial.baseColor = new BABYLON.Color3(1.0, 0.765557, 0.336057);
        pbrMaterial.metallicFactor = 1.0;
        pbrMaterial.roughnessFactor = 0.1;
        cylinder.material = pbrMaterial;
        cylinder.position.x = 0;
        meshes.push(cylinder);
        
        // 透明圆锥
        const cone = BABYLON.MeshBuilder.CreateCylinder("cone", {
            height: 3,
            diameterTop: 0,
            diameterBottom: 2
        }, scene);
        const transparentMaterial = new BABYLON.StandardMaterial("transparent", scene);
        transparentMaterial.diffuseColor = new BABYLON.Color3(0, 1, 1);
        transparentMaterial.alpha = 0.6;
        cone.material = transparentMaterial;
        cone.position.x = 2;
        meshes.push(cone);
        
        // 发光环形体
        const torus = BABYLON.MeshBuilder.CreateTorus("torus", {diameter: 2, thickness: 0.5}, scene);
        const emissiveMaterial = new BABYLON.StandardMaterial("emissive", scene);
        emissiveMaterial.emissiveColor = new BABYLON.Color3(0, 0, 1);
        emissiveMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        torus.material = emissiveMaterial;
        torus.position.x = 4;
        meshes.push(torus);
        
        // 地面
        const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 15, height: 10}, scene);
        const groundMaterial = new BABYLON.StandardMaterial("ground", scene);
        groundMaterial.diffuseTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/grass.jpg", scene);
        groundMaterial.diffuseTexture.uScale = 5;
        groundMaterial.diffuseTexture.vScale = 5;
        ground.material = groundMaterial;
        
        // 添加旋转动画
        meshes.forEach((mesh, index) => {
            mesh.position.y = 1.5;
            // 让不同的物体以不同速度旋转
            scene.registerBeforeRender(() => {
                mesh.rotation.y += 0.01 * (index + 1);
            });
        });
        
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

## 7. 练习任务

1. 创建一个材质库，包含至少 5 种不同风格的材质
2. 使用程序化纹理创建一个彩虹效果
3. 制作一个多材质的立方体，每个面都有不同的纹理
4. 实现纹理动画（如流水效果）

## 下一步

在下一个教程中，我们将学习：
- 动画系统
- 用户交互
- 粒子系统

---

*提示：材质和纹理是 3D 渲染中最重要的视觉元素，多实践不同的组合效果！*
