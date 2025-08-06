# 07 - 物理模拟

## 📚 本章目标

学习如何在 Babylon.js 中集成和使用物理引擎，实现真实的物理模拟效果，包括重力、碰撞检测、刚体动力学等。

## 🎯 学习内容

- 物理引擎基础概念
- 支持的物理引擎对比
- 基础物理设置
- 刚体和碰撞器
- 约束和关节系统
- 高级物理效果

---

## 1. 物理引擎概述

### 1.1 什么是物理引擎？

物理引擎是模拟现实世界物理定律的软件系统，为 3D 场景提供：
- **重力模拟**: 物体受重力影响下落
- **碰撞检测**: 检测物体间的碰撞
- **动力学**: 力、速度、加速度的计算
- **约束**: 限制物体运动的条件

### 1.2 Babylon.js 支持的物理引擎

```javascript
// 支持的物理引擎
const physicsEngines = {
    cannon: {
        name: "Cannon.js",
        features: ["基础物理", "碰撞检测", "约束系统"],
        performance: "中等",
        size: "较小"
    },
    ammo: {
        name: "Ammo.js (Bullet)",
        features: ["高级物理", "软体", "流体", "布料"],
        performance: "高",
        size: "较大"
    },
    oimo: {
        name: "Oimo.js",
        features: ["轻量级", "基础碰撞", "刚体"],
        performance: "快速",
        size: "最小"
    }
};
```

### 1.3 选择合适的物理引擎

```javascript
// 根据需求选择引擎
function choosePhysicsEngine(requirements) {
    if (requirements.includes("高性能") && requirements.includes("复杂物理")) {
        return "ammo"; // Bullet Physics
    } else if (requirements.includes("轻量级")) {
        return "oimo"; // 简单场景
    } else {
        return "cannon"; // 平衡选择
    }
}
```

---

## 2. 基础物理设置

### 2.1 启用物理引擎

```javascript
// 启用 Cannon.js 物理引擎
scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), new BABYLON.CannonJSPlugin());

// 启用 Ammo.js 物理引擎
scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), new BABYLON.AmmoJSPlugin());

// 启用 Oimo.js 物理引擎
scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), new BABYLON.OimoJSPlugin());
```

### 2.2 创建物理世界

```javascript
async function setupPhysics() {
    // 等待物理引擎加载
    await BABYLON.AmmoJSPlugin.Loaded;
    
    // 设置重力
    const gravity = new BABYLON.Vector3(0, -9.81, 0);
    
    // 启用物理
    scene.enablePhysics(gravity, new BABYLON.AmmoJSPlugin());
    
    console.log("物理引擎初始化完成");
}
```

### 2.3 物理材质

```javascript
// 创建物理材质
const groundMaterial = new BABYLON.PhysicsMaterial("groundMaterial", scene);
groundMaterial.friction = 0.4;
groundMaterial.restitution = 0.7; // 弹性系数

const ballMaterial = new BABYLON.PhysicsMaterial("ballMaterial", scene);
ballMaterial.friction = 0.2;
ballMaterial.restitution = 0.9;

// 设置材质间的接触行为
const contactMaterial = new BABYLON.ContactMaterial(
    groundMaterial,
    ballMaterial,
    { friction: 0.3, restitution: 0.8 }
);
```

---

## 3. 刚体和碰撞器

### 3.1 基础刚体创建

```javascript
// 创建静态地面
const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 10, height: 10}, scene);
ground.physicsImpostor = new BABYLON.PhysicsImpostor(
    ground, 
    BABYLON.PhysicsImpostor.BoxImpostor, 
    { mass: 0, restitution: 0.7 }, 
    scene
);

// 创建动态球体
const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 1}, scene);
sphere.position.y = 5;
sphere.physicsImpostor = new BABYLON.PhysicsImpostor(
    sphere, 
    BABYLON.PhysicsImpostor.SphereImpostor, 
    { mass: 1, restitution: 0.9 }, 
    scene
);

// 创建动态盒子
const box = BABYLON.MeshBuilder.CreateBox("box", {size: 1}, scene);
box.position = new BABYLON.Vector3(2, 5, 0);
box.physicsImpostor = new BABYLON.PhysicsImpostor(
    box, 
    BABYLON.PhysicsImpostor.BoxImpostor, 
    { mass: 1, restitution: 0.5 }, 
    scene
);
```

### 3.2 常用碰撞器类型

```javascript
// 碰撞器类型及适用场景
const colliderTypes = {
    BoxImpostor: "盒子形状 - 适用于立方体",
    SphereImpostor: "球形 - 适用于球体",
    CylinderImpostor: "圆柱体 - 适用于圆柱",
    MeshImpostor: "网格形状 - 精确但性能较低",
    ConvexHullImpostor: "凸包 - 复杂形状的近似",
    PlaneImpostor: "平面 - 无限大的平面"
};

// 复合碰撞器
function createCompoundCollider(mesh) {
    const compound = new BABYLON.PhysicsImpostor(
        mesh, 
        BABYLON.PhysicsImpostor.NoImpostor, 
        { mass: 0 }, 
        scene
    );
    
    // 添加子碰撞器
    const childBox = BABYLON.MeshBuilder.CreateBox("child", {size: 0.5}, scene);
    childBox.parent = mesh;
    childBox.physicsImpostor = new BABYLON.PhysicsImpostor(
        childBox, 
        BABYLON.PhysicsImpostor.BoxImpostor, 
        { mass: 1 }, 
        scene
    );
    
    return compound;
}
```

### 3.3 物理属性控制

```javascript
// 设置物理属性
function setupPhysicsObject(mesh, options = {}) {
    const defaultOptions = {
        mass: 1,
        friction: 0.5,
        restitution: 0.5,
        linearDamping: 0.1,
        angularDamping: 0.1
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    
    mesh.physicsImpostor = new BABYLON.PhysicsImpostor(
        mesh,
        BABYLON.PhysicsImpostor.BoxImpostor,
        finalOptions,
        scene
    );
    
    // 设置初始速度
    if (options.initialVelocity) {
        mesh.physicsImpostor.setLinearVelocity(options.initialVelocity);
    }
    
    if (options.initialAngularVelocity) {
        mesh.physicsImpostor.setAngularVelocity(options.initialAngularVelocity);
    }
}
```

---

## 4. 约束和关节系统

### 4.1 基础约束类型

```javascript
// 距离约束 - 保持两物体间距离
function createDistanceConstraint(meshA, meshB, distance) {
    const constraint = new BABYLON.DistanceJoint({
        maxDistance: distance
    });
    
    meshA.physicsImpostor.addJoint(
        meshB.physicsImpostor, 
        constraint
    );
    
    return constraint;
}

// 铰链约束 - 允许绕轴旋转
function createHingeConstraint(meshA, meshB, pivotA, pivotB, axisA, axisB) {
    const constraint = new BABYLON.HingeJoint({
        mainPivot: pivotA,
        connectedPivot: pivotB,
        mainAxis: axisA,
        connectedAxis: axisB
    });
    
    meshA.physicsImpostor.addJoint(
        meshB.physicsImpostor, 
        constraint
    );
    
    return constraint;
}

// 滑块约束 - 允许沿轴滑动
function createSliderConstraint(meshA, meshB, axis) {
    const constraint = new BABYLON.SliderJoint({
        mainAxis: axis,
        connectedAxis: axis
    });
    
    meshA.physicsImpostor.addJoint(
        meshB.physicsImpostor, 
        constraint
    );
    
    return constraint;
}
```

### 4.2 创建简单机械装置

```javascript
// 创建摆锤
function createPendulum() {
    // 固定点
    const anchor = BABYLON.MeshBuilder.CreateSphere("anchor", {diameter: 0.2}, scene);
    anchor.position.y = 5;
    anchor.physicsImpostor = new BABYLON.PhysicsImpostor(
        anchor, 
        BABYLON.PhysicsImpostor.SphereImpostor, 
        { mass: 0 }, 
        scene
    );
    
    // 摆锤
    const pendulum = BABYLON.MeshBuilder.CreateSphere("pendulum", {diameter: 0.5}, scene);
    pendulum.position = new BABYLON.Vector3(2, 2, 0);
    pendulum.physicsImpostor = new BABYLON.PhysicsImpostor(
        pendulum, 
        BABYLON.PhysicsImpostor.SphereImpostor, 
        { mass: 1 }, 
        scene
    );
    
    // 连接约束
    createDistanceConstraint(anchor, pendulum, 3);
}

// 创建链条
function createChain(segments = 5) {
    const chainLinks = [];
    
    for (let i = 0; i < segments; i++) {
        const link = BABYLON.MeshBuilder.CreateCylinder(
            `link${i}`, 
            {height: 0.2, diameter: 0.1}, 
            scene
        );
        link.position = new BABYLON.Vector3(0, 5 - i * 0.3, 0);
        
        const mass = i === 0 ? 0 : 0.1; // 第一个链环固定
        link.physicsImpostor = new BABYLON.PhysicsImpostor(
            link, 
            BABYLON.PhysicsImpostor.CylinderImpostor, 
            { mass }, 
            scene
        );
        
        // 连接相邻链环
        if (i > 0) {
            createDistanceConstraint(chainLinks[i-1], link, 0.3);
        }
        
        chainLinks.push(link);
    }
    
    return chainLinks;
}
```

---

## 5. 高级物理效果

### 5.1 触发器和检测

```javascript
// 创建触发器
function createTrigger(position, size, onTrigger) {
    const trigger = BABYLON.MeshBuilder.CreateBox("trigger", size, scene);
    trigger.position = position;
    trigger.visibility = 0.3; // 半透明显示
    
    trigger.physicsImpostor = new BABYLON.PhysicsImpostor(
        trigger, 
        BABYLON.PhysicsImpostor.BoxImpostor, 
        { mass: 0, isTrigger: true }, 
        scene
    );
    
    // 监听触发事件
    trigger.physicsImpostor.registerOnPhysicsCollide(
        scene.meshes, 
        (collider, collidedWith) => {
            if (collider === trigger.physicsImpostor) {
                onTrigger(collidedWith.object);
            }
        }
    );
    
    return trigger;
}

// 碰撞检测
function setupCollisionDetection(meshA, meshB, onCollision) {
    meshA.physicsImpostor.registerOnPhysicsCollide(
        meshB.physicsImpostor,
        (collider, collidedWith) => {
            onCollision(collider.object, collidedWith.object);
        }
    );
}
```

### 5.2 力的应用

```javascript
// 应用各种力
function applyForces(object) {
    const impostor = object.physicsImpostor;
    
    // 应用冲量
    impostor.applyImpulse(
        new BABYLON.Vector3(0, 5, 0), // 力的方向和大小
        object.getAbsolutePosition()   // 作用点
    );
    
    // 持续施力
    scene.registerBeforeRender(() => {
        if (/* 条件 */ true) {
            impostor.setLinearVelocity(
                impostor.getLinearVelocity().add(new BABYLON.Vector3(0, 0.1, 0))
            );
        }
    });
    
    // 扭矩
    impostor.setAngularVelocity(new BABYLON.Vector3(1, 0, 0));
}

// 风力效果
function createWindForce(windDirection, strength) {
    scene.registerBeforeRender(() => {
        scene.meshes.forEach(mesh => {
            if (mesh.physicsImpostor && mesh.physicsImpostor.mass > 0) {
                const force = windDirection.scale(strength);
                mesh.physicsImpostor.applyImpulse(
                    force, 
                    mesh.getAbsolutePosition()
                );
            }
        });
    });
}
```

---

## 6. 完整物理演示

```html
<!DOCTYPE html>
<html>
<head>
    <title>Babylon.js 物理模拟演示</title>
    <script src="https://cdn.babylonjs.com/babylon.js"></script>
    <script src="https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js"></script>
    <script src="https://cdn.babylonjs.com/cannon.js"></script>
    <style>
        html, body { margin: 0; padding: 0; overflow: hidden; }
        canvas { width: 100%; height: 100%; touch-action: none; }
        .controls {
            position: absolute; top: 10px; left: 10px;
            background: rgba(0,0,0,0.8); color: white;
            padding: 15px; border-radius: 5px;
        }
        button {
            margin: 5px; padding: 8px 15px;
            background: #4CAF50; color: white;
            border: none; border-radius: 3px; cursor: pointer;
        }
    </style>
</head>
<body>
    <canvas id="renderCanvas"></canvas>
    <div class="controls">
        <h3>物理演示控制</h3>
        <button onclick="dropSphere()">掉落球体</button>
        <button onclick="shootBox()">发射盒子</button>
        <button onclick="createTower()">建造塔楼</button>
        <button onclick="resetScene()">重置场景</button>
    </div>

    <script>
        const canvas = document.getElementById("renderCanvas");
        const engine = new BABYLON.Engine(canvas, true);
        let scene, ground;
        
        async function createScene() {
            scene = new BABYLON.Scene(engine);
            scene.clearColor = new BABYLON.Color3(0.2, 0.3, 0.4);
            
            // 摄像机
            const camera = new BABYLON.ArcRotateCamera(
                "camera", -Math.PI / 2, Math.PI / 2.5, 15,
                BABYLON.Vector3.Zero(), scene
            );
            camera.attachToCanvas(canvas, true);
            
            // 光源
            const light = new BABYLON.HemisphericLight(
                "light", new BABYLON.Vector3(0, 1, 0), scene
            );
            
            // 启用物理引擎
            scene.enablePhysics(
                new BABYLON.Vector3(0, -9.81, 0), 
                new BABYLON.CannonJSPlugin()
            );
            
            // 创建地面
            createGround();
            
            // 创建墙壁
            createWalls();
            
            return scene;
        }
        
        function createGround() {
            ground = BABYLON.MeshBuilder.CreateGround(
                "ground", {width: 20, height: 20}, scene
            );
            
            const groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
            groundMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.5, 0.3);
            ground.material = groundMaterial;
            
            ground.physicsImpostor = new BABYLON.PhysicsImpostor(
                ground, 
                BABYLON.PhysicsImpostor.BoxImpostor, 
                { mass: 0, restitution: 0.7 }, 
                scene
            );
        }
        
        function createWalls() {
            const wallPositions = [
                {pos: new BABYLON.Vector3(0, 2, 10), size: {width: 20, height: 4, depth: 1}},
                {pos: new BABYLON.Vector3(0, 2, -10), size: {width: 20, height: 4, depth: 1}},
                {pos: new BABYLON.Vector3(10, 2, 0), size: {width: 1, height: 4, depth: 20}},
                {pos: new BABYLON.Vector3(-10, 2, 0), size: {width: 1, height: 4, depth: 20}}
            ];
            
            wallPositions.forEach((wall, index) => {
                const wallMesh = BABYLON.MeshBuilder.CreateBox(
                    `wall${index}`, wall.size, scene
                );
                wallMesh.position = wall.pos;
                
                const wallMaterial = new BABYLON.StandardMaterial(`wallMat${index}`, scene);
                wallMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.6, 0.6);
                wallMesh.material = wallMaterial;
                
                wallMesh.physicsImpostor = new BABYLON.PhysicsImpostor(
                    wallMesh, 
                    BABYLON.PhysicsImpostor.BoxImpostor, 
                    { mass: 0, restitution: 0.8 }, 
                    scene
                );
            });
        }
        
        function dropSphere() {
            const sphere = BABYLON.MeshBuilder.CreateSphere(
                `sphere_${Date.now()}`, {diameter: 1}, scene
            );
            sphere.position = new BABYLON.Vector3(
                (Math.random() - 0.5) * 10, 8, (Math.random() - 0.5) * 10
            );
            
            const material = new BABYLON.StandardMaterial("sphereMat", scene);
            material.diffuseColor = new BABYLON.Color3(
                Math.random(), Math.random(), Math.random()
            );
            sphere.material = material;
            
            sphere.physicsImpostor = new BABYLON.PhysicsImpostor(
                sphere, 
                BABYLON.PhysicsImpostor.SphereImpostor, 
                { mass: 1, restitution: 0.9 }, 
                scene
            );
        }
        
        function shootBox() {
            const box = BABYLON.MeshBuilder.CreateBox(
                `box_${Date.now()}`, {size: 0.8}, scene
            );
            box.position = new BABYLON.Vector3(0, 2, -8);
            
            const material = new BABYLON.StandardMaterial("boxMat", scene);
            material.diffuseColor = new BABYLON.Color3(1, 0.5, 0);
            box.material = material;
            
            box.physicsImpostor = new BABYLON.PhysicsImpostor(
                box, 
                BABYLON.PhysicsImpostor.BoxImpostor, 
                { mass: 2, restitution: 0.4 }, 
                scene
            );
            
            // 发射
            box.physicsImpostor.setLinearVelocity(
                new BABYLON.Vector3(0, 5, 15)
            );
        }
        
        function createTower() {
            const boxSize = 1;
            const layers = 6;
            
            for (let layer = 0; layer < layers; layer++) {
                for (let x = -1; x <= 1; x++) {
                    if (layer % 2 === 0 || Math.abs(x) === 1) {
                        const box = BABYLON.MeshBuilder.CreateBox(
                            `tower_${layer}_${x}`, {size: boxSize}, scene
                        );
                        
                        box.position = new BABYLON.Vector3(
                            x * boxSize, 
                            0.5 + layer * boxSize, 
                            layer % 2 === 0 ? 0 : 0
                        );
                        
                        const material = new BABYLON.StandardMaterial("towerMat", scene);
                        material.diffuseColor = new BABYLON.Color3(0.8, 0.4, 0.2);
                        box.material = material;
                        
                        box.physicsImpostor = new BABYLON.PhysicsImpostor(
                            box, 
                            BABYLON.PhysicsImpostor.BoxImpostor, 
                            { mass: 1, restitution: 0.3, friction: 0.8 }, 
                            scene
                        );
                    }
                }
            }
        }
        
        function resetScene() {
            // 移除所有动态物体
            const meshesToRemove = scene.meshes.filter(mesh => 
                mesh.physicsImpostor && mesh.physicsImpostor.mass > 0
            );
            
            meshesToRemove.forEach(mesh => {
                mesh.dispose();
            });
        }
        
        createScene().then(() => {
            engine.runRenderLoop(() => {
                scene.render();
            });
        });
        
        window.addEventListener("resize", () => {
            engine.resize();
        });
    </script>
</body>
</html>
```

---

## 7. 性能优化

### 7.1 物理性能优化

```javascript
// 优化建议
const physicsOptimizations = {
    collision: "使用简单碰撞器代替复杂网格",
    sleeping: "启用休眠机制减少计算",
    culling: "移除屏幕外的物理对象",
    timestep: "控制物理更新频率",
    pooling: "重用物理对象而非创建新的"
};

// 物体休眠管理
function setupSleeping(impostor) {
    impostor.sleep(); // 手动休眠
    impostor.wakeUp(); // 唤醒
    
    // 检查休眠状态
    if (impostor.isSleeping()) {
        console.log("物体处于休眠状态");
    }
}

// 物理对象池
class PhysicsObjectPool {
    constructor() {
        this.availableObjects = [];
        this.activeObjects = [];
    }
    
    getObject(type, options = {}) {
        let obj = this.availableObjects.find(item => item.type === type);
        
        if (!obj) {
            obj = this.createNewObject(type, options);
        } else {
            this.availableObjects.splice(this.availableObjects.indexOf(obj), 1);
            this.resetObject(obj, options);
        }
        
        this.activeObjects.push(obj);
        return obj.mesh;
    }
    
    returnObject(mesh) {
        const objIndex = this.activeObjects.findIndex(item => item.mesh === mesh);
        if (objIndex !== -1) {
            const obj = this.activeObjects[objIndex];
            this.activeObjects.splice(objIndex, 1);
            
            // 重置物理状态
            obj.mesh.physicsImpostor.setLinearVelocity(BABYLON.Vector3.Zero());
            obj.mesh.physicsImpostor.setAngularVelocity(BABYLON.Vector3.Zero());
            obj.mesh.setEnabled(false);
            
            this.availableObjects.push(obj);
        }
    }
    
    createNewObject(type, options) {
        let mesh;
        let impostor;
        
        switch (type) {
            case 'sphere':
                mesh = BABYLON.MeshBuilder.CreateSphere("pooledSphere", {diameter: 1}, scene);
                impostor = BABYLON.PhysicsImpostor.SphereImpostor;
                break;
            case 'box':
                mesh = BABYLON.MeshBuilder.CreateBox("pooledBox", {size: 1}, scene);
                impostor = BABYLON.PhysicsImpostor.BoxImpostor;
                break;
            default:
                throw new Error(`未支持的类型: ${type}`);
        }
        
        mesh.physicsImpostor = new BABYLON.PhysicsImpostor(
            mesh, impostor, {mass: 1, restitution: 0.7}, scene
        );
        
        return {type, mesh, impostor};
    }
    
    resetObject(obj, options) {
        obj.mesh.setEnabled(true);
        obj.mesh.position = options.position || BABYLON.Vector3.Zero();
        obj.mesh.rotation = options.rotation || BABYLON.Vector3.Zero();
    }
}

// 动态物理场景管理
class PhysicsSceneManager {
    constructor(scene) {
        this.scene = scene;
        this.physicsBodies = new Map();
        this.constraints = [];
        this.updateCallbacks = [];
    }
    
    addPhysicsBody(name, mesh, impostorType, options = {}) {
        const impostor = new BABYLON.PhysicsImpostor(mesh, impostorType, options, this.scene);
        this.physicsBodies.set(name, {mesh, impostor, options});
        return impostor;
    }
    
    removePhysicsBody(name) {
        if (this.physicsBodies.has(name)) {
            const body = this.physicsBodies.get(name);
            body.impostor.dispose();
            this.physicsBodies.delete(name);
        }
    }
    
    addConstraint(bodyA, bodyB, constraintType, options = {}) {
        let constraint;
        
        switch (constraintType) {
            case 'distance':
                constraint = new BABYLON.DistanceJoint(options);
                break;
            case 'hinge':
                constraint = new BABYLON.HingeJoint(options);
                break;
            case 'slider':
                constraint = new BABYLON.SliderJoint(options);
                break;
            default:
                throw new Error(`未支持的约束类型: ${constraintType}`);
        }
        
        bodyA.addJoint(bodyB, constraint);
        this.constraints.push({bodyA, bodyB, constraint});
        return constraint;
    }
    
    pausePhysics() {
        this.scene.getPhysicsEngine().setTimeStep(0);
    }
    
    resumePhysics() {
        this.scene.getPhysicsEngine().setTimeStep(1/60);
    }
    
    setGravity(gravity) {
        this.scene.getPhysicsEngine().setGravity(gravity);
    }
}
```

---

## 8. 软体物理和布料模拟

### 8.1 软体物理基础 (需要 Ammo.js)

```javascript
// 创建软体球
function createSoftBody() {
    // 创建基础几何体
    const sphere = BABYLON.MeshBuilder.CreateSphere("softSphere", {
        diameter: 2,
        segments: 16
    }, scene);
    
    sphere.position.y = 5;
    
    // 创建软体物理
    const softBodyOptions = {
        mass: 1,
        pressure: 250,       // 内部压力
        stiffness: 0.1,      // 刚度
        damping: 0.05,       // 阻尼
        friction: 0.5,       // 摩擦
        margin: 0.01,        // 碰撞边距
        fromLinesToTriangles: true
    };
    
    sphere.physicsImpostor = new BABYLON.PhysicsImpostor(
        sphere,
        BABYLON.PhysicsImpostor.SoftbodyImpostor,
        softBodyOptions,
        scene
    );
    
    return sphere;
}

// 创建布料
function createCloth(width = 4, height = 4, segments = 10) {
    const cloth = BABYLON.MeshBuilder.CreateGround("cloth", {
        width: width,
        height: height,
        subdivisions: segments
    }, scene);
    
    cloth.position.y = 6;
    
    const clothOptions = {
        mass: 1,
        stiffness: 1,
        damping: 0.03,
        pressure: 0,
        margin: 0.01,
        fixedPoints: [0, segments] // 固定顶部两个角
    };
    
    cloth.physicsImpostor = new BABYLON.PhysicsImpostor(
        cloth,
        BABYLON.PhysicsImpostor.ClothImpostor,
        clothOptions,
        scene
    );
    
    return cloth;
}

// 创建绳索
function createRope(segments = 10, length = 5) {
    const ropeSegments = [];
    const segmentLength = length / segments;
    
    for (let i = 0; i < segments; i++) {
        const segment = BABYLON.MeshBuilder.CreateCylinder(
            `ropeSegment${i}`,
            {
                height: segmentLength,
                diameter: 0.1
            },
            scene
        );
        
        segment.position = new BABYLON.Vector3(0, 5 - i * segmentLength, 0);
        
        const mass = i === 0 ? 0 : 0.1; // 第一段固定
        segment.physicsImpostor = new BABYLON.PhysicsImpostor(
            segment,
            BABYLON.PhysicsImpostor.CylinderImpostor,
            { mass: mass, restitution: 0.3 },
            scene
        );
        
        // 连接相邻段
        if (i > 0) {
            const constraint = new BABYLON.PointToPointJoint(
                BABYLON.Vector3.Zero(),
                new BABYLON.Vector3(0, segmentLength/2, 0)
            );
            
            ropeSegments[i-1].physicsImpostor.addJoint(
                segment.physicsImpostor,
                constraint
            );
        }
        
        ropeSegments.push(segment);
    }
    
    return ropeSegments;
}
```

### 8.2 流体模拟

```javascript
// 简单粒子流体模拟
class FluidSimulation {
    constructor(scene, particleCount = 1000) {
        this.scene = scene;
        this.particles = [];
        this.particleSystem = null;
        this.viscosity = 0.1;
        this.density = 1000;
        this.pressure = 0;
        
        this.setupParticleSystem(particleCount);
    }
    
    setupParticleSystem(count) {
        // 创建粒子发射器
        const emitter = BABYLON.MeshBuilder.CreateBox("fluidEmitter", {size: 0.1}, this.scene);
        emitter.position = new BABYLON.Vector3(0, 5, 0);
        emitter.visibility = 0;
        
        // GPU 粒子系统用于视觉效果
        this.particleSystem = new BABYLON.GPUParticleSystem("fluidParticles", {
            capacity: count
        }, this.scene);
        
        this.particleSystem.particleTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/flare.png", this.scene);
        this.particleSystem.emitter = emitter;
        
        this.particleSystem.color1 = new BABYLON.Color4(0.2, 0.5, 1.0, 1.0);
        this.particleSystem.color2 = new BABYLON.Color4(0.1, 0.3, 0.8, 1.0);
        
        this.particleSystem.minSize = 0.05;
        this.particleSystem.maxSize = 0.1;
        
        this.particleSystem.minLifeTime = 2;
        this.particleSystem.maxLifeTime = 4;
        
        this.particleSystem.emitRate = 200;
        this.particleSystem.gravity = new BABYLON.Vector3(0, -9.81, 0);
        
        // 物理粒子（简化版SPH）
        for (let i = 0; i < Math.min(count, 100); i++) {
            this.createPhysicsParticle();
        }
        
        this.particleSystem.start();
    }
    
    createPhysicsParticle() {
        const particle = BABYLON.MeshBuilder.CreateSphere(
            `fluidParticle${this.particles.length}`,
            { diameter: 0.1 },
            this.scene
        );
        
        particle.position = new BABYLON.Vector3(
            (Math.random() - 0.5) * 2,
            5 + Math.random() * 2,
            (Math.random() - 0.5) * 2
        );
        
        particle.physicsImpostor = new BABYLON.PhysicsImpostor(
            particle,
            BABYLON.PhysicsImpostor.SphereImpostor,
            { mass: 0.1, restitution: 0.1, friction: 0.9 },
            this.scene
        );
        
        // 添加流体特性
        particle.fluidProperties = {
            velocity: BABYLON.Vector3.Zero(),
            density: this.density,
            pressure: 0
        };
        
        this.particles.push(particle);
    }
    
    updateFluid() {
        // 简化的SPH流体计算
        this.particles.forEach(particle => {
            this.calculateDensity(particle);
            this.calculatePressure(particle);
            this.applyForces(particle);
        });
    }
    
    calculateDensity(particle) {
        let density = 0;
        const h = 0.5; // 核函数半径
        
        this.particles.forEach(neighbor => {
            if (neighbor !== particle) {
                const distance = BABYLON.Vector3.Distance(particle.position, neighbor.position);
                if (distance < h) {
                    // W(r,h) = 315/(64πh⁹) * (h²-r²)³ 核函数
                    const q = distance / h;
                    const w = 315 / (64 * Math.PI * Math.pow(h, 9)) * Math.pow(h * h - distance * distance, 3);
                    density += neighbor.fluidProperties.density * w;
                }
            }
        });
        
        particle.fluidProperties.density = Math.max(density, this.density);
    }
    
    calculatePressure(particle) {
        const k = 1000; // 刚度常数
        particle.fluidProperties.pressure = k * (particle.fluidProperties.density - this.density);
    }
    
    applyForces(particle) {
        const pressureForce = this.calculatePressureForce(particle);
        const viscosityForce = this.calculateViscosityForce(particle);
        
        const totalForce = pressureForce.add(viscosityForce);
        
        if (particle.physicsImpostor) {
            particle.physicsImpostor.applyImpulse(
                totalForce.scale(0.016), // 假设60fps
                particle.position
            );
        }
    }
    
    calculatePressureForce(particle) {
        let force = BABYLON.Vector3.Zero();
        const h = 0.5;
        
        this.particles.forEach(neighbor => {
            if (neighbor !== particle) {
                const distance = BABYLON.Vector3.Distance(particle.position, neighbor.position);
                if (distance < h && distance > 0) {
                    const direction = particle.position.subtract(neighbor.position).normalize();
                    const pressure = (particle.fluidProperties.pressure + neighbor.fluidProperties.pressure) / 2;
                    
                    // 压力梯度
                    const gradW = -45 / (Math.PI * Math.pow(h, 6)) * Math.pow(h - distance, 2);
                    force = force.add(direction.scale(pressure * gradW / neighbor.fluidProperties.density));
                }
            }
        });
        
        return force.scale(-1);
    }
    
    calculateViscosityForce(particle) {
        let force = BABYLON.Vector3.Zero();
        const h = 0.5;
        
        this.particles.forEach(neighbor => {
            if (neighbor !== particle) {
                const distance = BABYLON.Vector3.Distance(particle.position, neighbor.position);
                if (distance < h) {
                    const velocityDiff = neighbor.fluidProperties.velocity.subtract(particle.fluidProperties.velocity);
                    const lapW = 45 / (Math.PI * Math.pow(h, 6)) * (h - distance);
                    
                    force = force.add(velocityDiff.scale(this.viscosity * lapW / neighbor.fluidProperties.density));
                }
            }
        });
        
        return force;
    }
}
```

---

## 9. 高级物理调试工具

### 9.1 物理调试可视化

```javascript
// 物理调试器
class PhysicsDebugger {
    constructor(scene) {
        this.scene = scene;
        this.debugMeshes = [];
        this.showColliders = false;
        this.showConstraints = false;
        this.showVelocities = false;
    }
    
    toggleColliderVisualization() {
        this.showColliders = !this.showColliders;
        
        if (this.showColliders) {
            this.createColliderVisuals();
        } else {
            this.clearColliderVisuals();
        }
    }
    
    createColliderVisuals() {
        this.scene.meshes.forEach(mesh => {
            if (mesh.physicsImpostor) {
                const debugMesh = this.createDebugMesh(mesh);
                this.debugMeshes.push(debugMesh);
            }
        });
    }
    
    createDebugMesh(mesh) {
        const impostor = mesh.physicsImpostor;
        let debugMesh;
        
        switch (impostor.type) {
            case BABYLON.PhysicsImpostor.BoxImpostor:
                const boundingInfo = mesh.getBoundingInfo();
                const size = boundingInfo.maximum.subtract(boundingInfo.minimum);
                debugMesh = BABYLON.MeshBuilder.CreateBox("debug_box", {
                    width: size.x,
                    height: size.y,
                    depth: size.z
                }, this.scene);
                break;
                
            case BABYLON.PhysicsImpostor.SphereImpostor:
                const radius = mesh.getBoundingInfo().boundingSphere.radius;
                debugMesh = BABYLON.MeshBuilder.CreateSphere("debug_sphere", {
                    diameter: radius * 2
                }, this.scene);
                break;
                
            default:
                debugMesh = mesh.clone("debug_" + mesh.name);
                break;
        }
        
        // 设置调试材质
        const debugMaterial = new BABYLON.StandardMaterial("debugMaterial", this.scene);
        debugMaterial.wireframe = true;
        debugMaterial.emissiveColor = new BABYLON.Color3(0, 1, 0);
        debugMaterial.alpha = 0.5;
        
        debugMesh.material = debugMaterial;
        debugMesh.position = mesh.position.clone();
        debugMesh.rotation = mesh.rotation.clone();
        debugMesh.setParent(mesh);
        
        return debugMesh;
    }
    
    clearColliderVisuals() {
        this.debugMeshes.forEach(mesh => {
            mesh.dispose();
        });
        this.debugMeshes = [];
    }
    
    showVelocityVectors() {
        this.scene.meshes.forEach(mesh => {
            if (mesh.physicsImpostor && mesh.physicsImpostor.mass > 0) {
                const velocity = mesh.physicsImpostor.getLinearVelocity();
                if (velocity.length() > 0.1) {
                    this.createVelocityArrow(mesh, velocity);
                }
            }
        });
    }
    
    createVelocityArrow(mesh, velocity) {
        const arrowLength = velocity.length() * 0.5;
        const arrow = BABYLON.MeshBuilder.CreateCylinder("velocityArrow", {
            height: arrowLength,
            diameterTop: 0,
            diameterBottom: 0.1
        }, this.scene);
        
        arrow.position = mesh.position.clone();
        arrow.lookAt(mesh.position.add(velocity.normalize()));
        
        const arrowMaterial = new BABYLON.StandardMaterial("arrowMaterial", this.scene);
        arrowMaterial.emissiveColor = new BABYLON.Color3(1, 0, 0);
        arrow.material = arrowMaterial;
        
        // 自动清理
        setTimeout(() => {
            arrow.dispose();
        }, 1000);
    }
    
    logPhysicsInfo(mesh) {
        if (mesh.physicsImpostor) {
            const impostor = mesh.physicsImpostor;
            console.log(`物理信息 - ${mesh.name}:`, {
                mass: impostor.mass,
                velocity: impostor.getLinearVelocity(),
                angularVelocity: impostor.getAngularVelocity(),
                position: mesh.position,
                isSleeping: impostor.isSleeping ? impostor.isSleeping() : false
            });
        }
    }
}

// 性能监控器
class PhysicsPerformanceMonitor {
    constructor(scene) {
        this.scene = scene;
        this.startTime = 0;
        this.frameCount = 0;
        this.physicsTime = 0;
    }
    
    startFrame() {
        this.startTime = performance.now();
    }
    
    endFrame() {
        const endTime = performance.now();
        this.physicsTime += (endTime - this.startTime);
        this.frameCount++;
        
        if (this.frameCount >= 60) {
            const avgPhysicsTime = this.physicsTime / this.frameCount;
            console.log(`物理计算平均耗时: ${avgPhysicsTime.toFixed(2)}ms`);
            
            this.physicsTime = 0;
            this.frameCount = 0;
        }
    }
    
    getPhysicsStats() {
        const engine = this.scene.getPhysicsEngine();
        const activeImpostors = this.scene.meshes.filter(mesh => 
            mesh.physicsImpostor && mesh.physicsImpostor.mass > 0
        ).length;
        
        return {
            activeImpostors: activeImpostors,
            totalMeshes: this.scene.meshes.length,
            physicsEngine: engine ? engine.getPhysicsPluginName() : 'None',
            timeStep: engine ? engine.getTimeStep() : 0
        };
    }
}
```

---

## 10. 下一步

完成本章学习后，你应该掌握：

✅ 物理引擎的基础概念和选择
✅ 刚体和碰撞器的创建和配置
✅ 约束系统和关节的使用
✅ 高级物理效果的实现
✅ 物理性能的优化技巧

继续学习：[08 - 高级渲染](./08-advanced-rendering.md)

---

## 9. 参考资源

- [Babylon.js 物理引擎文档](https://doc.babylonjs.com/divingDeeper/physics)
- [Cannon.js 官方文档](https://cannon.js.org/)
- [Ammo.js GitHub](https://github.com/kripken/ammo.js)
- [物理引擎对比](https://doc.babylonjs.com/divingDeeper/physics/usingPhysicsEngine)
