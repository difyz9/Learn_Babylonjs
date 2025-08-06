# 教程 3: 动画系统详解

## 学习目标
- 掌握 Babylon.js 动画系统的核心概念
- 学会创建各种类型的动画
- 理解动画组和动画混合
- 实现交互式动画控制

## 1. 动画基础概念

### 1.1 Animation 类

```javascript
// 创建基础动画
const createBasicAnimation = () => {
    // 创建动画对象
    const animationBox = new BABYLON.Animation(
        "boxAnimation",           // 动画名称
        "position.x",            // 要动画的属性
        30,                      // 帧率 (FPS)
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,  // 动画类型
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE  // 循环模式
    );
    
    // 定义关键帧
    const keys = [];
    
    // 起始帧
    keys.push({
        frame: 0,
        value: 0
    });
    
    // 中间帧
    keys.push({
        frame: 30,
        value: 5
    });
    
    // 结束帧
    keys.push({
        frame: 60,
        value: 0
    });
    
    // 设置关键帧
    animationBox.setKeys(keys);
    
    return animationBox;
};
```

### 1.2 动画类型

```javascript
const createDifferentAnimationTypes = (scene) => {
    const box = BABYLON.MeshBuilder.CreateBox("box", {size: 2}, scene);
    
    // 位置动画 (Vector3)
    const positionAnimation = new BABYLON.Animation(
        "positionAnimation",
        "position",
        30,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );
    
    const positionKeys = [
        { frame: 0, value: new BABYLON.Vector3(0, 0, 0) },
        { frame: 30, value: new BABYLON.Vector3(5, 0, 0) },
        { frame: 60, value: new BABYLON.Vector3(5, 5, 0) },
        { frame: 90, value: new BABYLON.Vector3(0, 5, 0) },
        { frame: 120, value: new BABYLON.Vector3(0, 0, 0) }
    ];
    positionAnimation.setKeys(positionKeys);
    
    // 旋转动画 (Vector3)
    const rotationAnimation = new BABYLON.Animation(
        "rotationAnimation",
        "rotation",
        30,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );
    
    const rotationKeys = [
        { frame: 0, value: new BABYLON.Vector3(0, 0, 0) },
        { frame: 60, value: new BABYLON.Vector3(Math.PI, Math.PI, 0) },
        { frame: 120, value: new BABYLON.Vector3(0, 0, 0) }
    ];
    rotationAnimation.setKeys(rotationKeys);
    
    // 缩放动画 (Vector3)
    const scalingAnimation = new BABYLON.Animation(
        "scalingAnimation",
        "scaling",
        30,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );
    
    const scalingKeys = [
        { frame: 0, value: new BABYLON.Vector3(1, 1, 1) },
        { frame: 30, value: new BABYLON.Vector3(2, 2, 2) },
        { frame: 60, value: new BABYLON.Vector3(1, 1, 1) }
    ];
    scalingAnimation.setKeys(scalingKeys);
    
    // 应用动画到物体
    box.animations = [positionAnimation, rotationAnimation, scalingAnimation];
    
    return box;
};
```

## 2. 缓动函数 (Easing Functions)

### 2.1 内置缓动函数

```javascript
const applyEasingFunctions = (scene) => {
    const meshes = [];
    const easingFunctions = [
        { name: "Linear", easing: null },
        { name: "QuadraticEase", easing: new BABYLON.QuadraticEase() },
        { name: "CubicEase", easing: new BABYLON.CubicEase() },
        { name: "QuarticEase", easing: new BABYLON.QuarticEase() },
        { name: "QuinticEase", easing: new BABYLON.QuinticEase() },
        { name: "SineEase", easing: new BABYLON.SineEase() },
        { name: "CircleEase", easing: new BABYLON.CircleEase() },
        { name: "BackEase", easing: new BABYLON.BackEase() },
        { name: "ElasticEase", easing: new BABYLON.ElasticEase() },
        { name: "BounceEase", easing: new BABYLON.BounceEase() }
    ];
    
    easingFunctions.forEach((item, index) => {
        // 创建球体
        const sphere = BABYLON.MeshBuilder.CreateSphere(`sphere_${index}`, {diameter: 0.5}, scene);
        sphere.position = new BABYLON.Vector3(-5, 0, index - 5);
        
        // 创建材质
        const material = new BABYLON.StandardMaterial(`material_${index}`, scene);
        material.diffuseColor = new BABYLON.Color3(
            Math.random(),
            Math.random(),
            Math.random()
        );
        sphere.material = material;
        
        // 创建动画
        const animation = new BABYLON.Animation(
            `animation_${index}`,
            "position.x",
            30,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );
        
        // 设置缓动函数
        if (item.easing) {
            item.easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
            animation.setEasingFunction(item.easing);
        }
        
        // 设置关键帧
        const keys = [
            { frame: 0, value: -5 },
            { frame: 60, value: 5 },
            { frame: 120, value: -5 }
        ];
        animation.setKeys(keys);
        
        sphere.animations = [animation];
        meshes.push(sphere);
        
        // 创建标签
        const label = BABYLON.MeshBuilder.CreatePlane(`label_${index}`, {size: 1}, scene);
        label.position = new BABYLON.Vector3(-6, 0, index - 5);
        label.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        
        const labelMaterial = new BABYLON.StandardMaterial(`labelMaterial_${index}`, scene);
        const labelTexture = new BABYLON.DynamicTexture(`labelTexture_${index}`, 256, scene);
        labelTexture.drawText(item.name, null, null, "bold 20px Arial", "white", "transparent", true);
        labelMaterial.diffuseTexture = labelTexture;
        labelMaterial.emissiveTexture = labelTexture;
        label.material = labelMaterial;
    });
    
    return meshes;
};
```

### 2.2 自定义缓动函数

```javascript
const createCustomEasing = () => {
    // 自定义缓动函数 - 抛物线效果
    class ParabolicEase extends BABYLON.EasingFunction {
        ease(gradient) {
            // 实现抛物线缓动：y = 4x(1-x)
            return 4 * gradient * (1 - gradient);
        }
    }
    
    // 自定义缓动函数 - 步进效果
    class StepEase extends BABYLON.EasingFunction {
        constructor(steps = 5) {
            super();
            this.steps = steps;
        }
        
        ease(gradient) {
            return Math.floor(gradient * this.steps) / this.steps;
        }
    }
    
    return { ParabolicEase, StepEase };
};
```

## 3. 动画组 (Animation Groups)

### 3.1 创建动画组

```javascript
const createAnimationGroup = (scene) => {
    // 创建多个物体
    const meshes = [];
    for (let i = 0; i < 5; i++) {
        const box = BABYLON.MeshBuilder.CreateBox(`box_${i}`, {size: 1}, scene);
        box.position = new BABYLON.Vector3(i * 2 - 4, 0, 0);
        
        // 为每个物体创建不同的材质
        const material = new BABYLON.StandardMaterial(`material_${i}`, scene);
        material.diffuseColor = new BABYLON.Color3(
            i / 4,          // 红色渐变
            1 - i / 4,      // 绿色反向渐变
            0.5             // 固定蓝色
        );
        box.material = material;
        meshes.push(box);
    }
    
    // 创建动画组
    const animationGroup = new BABYLON.AnimationGroup("sequentialAnimation");
    
    meshes.forEach((mesh, index) => {
        // 位置动画
        const positionAnimation = new BABYLON.Animation(
            `positionAnimation_${index}`,
            "position.y",
            30,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );
        
        // 每个物体的动画有不同的延迟
        const delay = index * 15;  // 延迟帧数
        const keys = [
            { frame: delay, value: 0 },
            { frame: delay + 30, value: 3 },
            { frame: delay + 60, value: 0 }
        ];
        positionAnimation.setKeys(keys);
        
        // 旋转动画
        const rotationAnimation = new BABYLON.Animation(
            `rotationAnimation_${index}`,
            "rotation.y",
            30,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );
        
        const rotationKeys = [
            { frame: delay, value: 0 },
            { frame: delay + 60, value: Math.PI * 2 }
        ];
        rotationAnimation.setKeys(rotationKeys);
        
        // 添加动画到组
        animationGroup.addTargetedAnimation(positionAnimation, mesh);
        animationGroup.addTargetedAnimation(rotationAnimation, mesh);
    });
    
    return animationGroup;
};
```

### 3.2 动画组控制

```javascript
const createAnimationControls = (animationGroup, scene) => {
    // 创建 GUI
    const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
    
    // 创建控制面板
    const panel = new BABYLON.GUI.StackPanel();
    panel.width = "300px";
    panel.height = "200px";
    panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    advancedTexture.addControl(panel);
    
    // 播放按钮
    const playButton = BABYLON.GUI.Button.CreateSimpleButton("playButton", "播放");
    playButton.width = "100px";
    playButton.height = "40px";
    playButton.color = "white";
    playButton.background = "green";
    playButton.onPointerClickObservable.add(() => {
        animationGroup.play();
    });
    panel.addControl(playButton);
    
    // 暂停按钮
    const pauseButton = BABYLON.GUI.Button.CreateSimpleButton("pauseButton", "暂停");
    pauseButton.width = "100px";
    pauseButton.height = "40px";
    pauseButton.color = "white";
    pauseButton.background = "orange";
    pauseButton.onPointerClickObservable.add(() => {
        animationGroup.pause();
    });
    panel.addControl(pauseButton);
    
    // 停止按钮
    const stopButton = BABYLON.GUI.Button.CreateSimpleButton("stopButton", "停止");
    stopButton.width = "100px";
    stopButton.height = "40px";
    stopButton.color = "white";
    stopButton.background = "red";
    stopButton.onPointerClickObservable.add(() => {
        animationGroup.stop();
    });
    panel.addControl(stopButton);
    
    // 速度滑块
    const speedSlider = new BABYLON.GUI.Slider();
    speedSlider.minimum = 0.1;
    speedSlider.maximum = 3;
    speedSlider.value = 1;
    speedSlider.width = "200px";
    speedSlider.height = "20px";
    speedSlider.onValueChangedObservable.add((value) => {
        animationGroup.speedRatio = value;
    });
    panel.addControl(speedSlider);
    
    // 速度标签
    const speedLabel = new BABYLON.GUI.TextBlock();
    speedLabel.text = "速度: 1.0x";
    speedLabel.height = "30px";
    speedLabel.color = "white";
    speedSlider.onValueChangedObservable.add((value) => {
        speedLabel.text = `速度: ${value.toFixed(1)}x`;
    });
    panel.addControl(speedLabel);
};
```

## 4. 骨骼动画 (Skeletal Animation)

### 4.1 导入带动画的模型

```javascript
const loadAnimatedModel = async (scene) => {
    try {
        // 导入带动画的 glTF 模型
        const result = await BABYLON.SceneLoader.ImportMeshAsync(
            "",
            "https://playground.babylonjs.com/scenes/",
            "dummy3.babylon",
            scene
        );
        
        const character = result.meshes[0];
        character.position = BABYLON.Vector3.Zero();
        character.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
        
        // 获取动画组
        const animationGroups = result.animationGroups;
        
        if (animationGroups.length > 0) {
            // 播放第一个动画
            animationGroups[0].play(true);
            
            // 创建动画切换器
            createAnimationSwitcher(animationGroups, scene);
        }
        
        return { character, animationGroups };
    } catch (error) {
        console.error("模型加载失败:", error);
        return null;
    }
};

const createAnimationSwitcher = (animationGroups, scene) => {
    const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("AnimationUI");
    
    const panel = new BABYLON.GUI.StackPanel();
    panel.width = "200px";
    panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    advancedTexture.addControl(panel);
    
    animationGroups.forEach((group, index) => {
        const button = BABYLON.GUI.Button.CreateSimpleButton(
            `animButton_${index}`,
            group.name || `动画 ${index + 1}`
        );
        button.width = "180px";
        button.height = "40px";
        button.color = "white";
        button.background = "blue";
        button.onPointerClickObservable.add(() => {
            // 停止所有动画
            animationGroups.forEach(g => g.stop());
            // 播放选中的动画
            group.play(true);
        });
        panel.addControl(button);
    });
};
```

## 5. 路径动画

### 5.1 沿路径移动

```javascript
const createPathAnimation = (scene) => {
    // 创建要移动的物体
    const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 1}, scene);
    
    // 定义路径点
    const pathPoints = [
        new BABYLON.Vector3(0, 0, 0),
        new BABYLON.Vector3(5, 2, 0),
        new BABYLON.Vector3(10, 0, 5),
        new BABYLON.Vector3(5, -2, 10),
        new BABYLON.Vector3(0, 0, 5),
        new BABYLON.Vector3(-5, 2, 0),
        new BABYLON.Vector3(0, 0, 0)
    ];
    
    // 创建路径曲线
    const path = new BABYLON.Path3D(pathPoints);
    const curve = path.getCurve();
    
    // 显示路径
    const pathMesh = BABYLON.MeshBuilder.CreateLines("path", {points: curve}, scene);
    pathMesh.color = new BABYLON.Color3(1, 1, 0);
    
    // 创建位置动画
    const positionAnimation = new BABYLON.Animation(
        "pathAnimation",
        "position",
        30,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );
    
    // 设置关键帧
    const keys = [];
    const frameCount = curve.length;
    curve.forEach((point, index) => {
        keys.push({
            frame: (index / (curve.length - 1)) * 120,
            value: point
        });
    });
    positionAnimation.setKeys(keys);
    
    // 创建旋转动画，让物体面向移动方向
    const rotationAnimation = new BABYLON.Animation(
        "rotationAnimation",
        "rotation",
        30,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );
    
    const rotationKeys = [];
    for (let i = 0; i < curve.length - 1; i++) {
        const direction = curve[i + 1].subtract(curve[i]).normalize();
        const angle = Math.atan2(direction.x, direction.z);
        rotationKeys.push({
            frame: (i / (curve.length - 1)) * 120,
            value: new BABYLON.Vector3(0, angle, 0)
        });
    }
    rotationAnimation.setKeys(rotationKeys);
    
    sphere.animations = [positionAnimation, rotationAnimation];
    
    return { sphere, path: pathMesh };
};
```

## 6. 变形动画 (Morph Targets)

```javascript
const createMorphAnimation = (scene) => {
    // 创建基础几何体
    const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 2}, scene);
    
    // 创建变形目标 - 立方体形状
    const cubeTarget = BABYLON.MeshBuilder.CreateBox("cubeTarget", {size: 2}, scene);
    cubeTarget.setEnabled(false);  // 隐藏目标网格
    
    // 设置变形目标
    const morphTargetManager = new BABYLON.MorphTargetManager(scene);
    const morphTarget = BABYLON.MorphTarget.FromMesh(cubeTarget, "cubeShape", 0);
    morphTargetManager.addTarget(morphTarget);
    
    sphere.morphTargetManager = morphTargetManager;
    
    // 创建变形动画
    const morphAnimation = new BABYLON.Animation(
        "morphAnimation",
        "influence",
        30,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );
    
    const morphKeys = [
        { frame: 0, value: 0 },      // 球形
        { frame: 60, value: 1 },     // 立方体形
        { frame: 120, value: 0 }     // 回到球形
    ];
    morphAnimation.setKeys(morphKeys);
    
    morphTarget.animations = [morphAnimation];
    
    return sphere;
};
```

## 7. 完整示例 - 动画展示场景

```javascript
window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    const engine = new BABYLON.Engine(canvas, true);
    
    const createScene = () => {
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color3(0.1, 0.1, 0.2);
        
        // 摄像机
        const camera = new BABYLON.ArcRotateCamera(
            "camera",
            -Math.PI / 2,
            Math.PI / 2.5,
            20,
            BABYLON.Vector3.Zero(),
            scene
        );
        camera.attachToCanvas(canvas, true);
        
        // 光源
        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.8;
        
        // 1. 基础动画展示
        const animatedBox = createDifferentAnimationTypes(scene);
        animatedBox.position.z = -5;
        
        // 2. 缓动函数展示
        const easingMeshes = applyEasingFunctions(scene);
        
        // 3. 动画组展示
        const animationGroup = createAnimationGroup(scene);
        animationGroup.play(true);
        
        // 4. 路径动画
        const pathAnimation = createPathAnimation(scene);
        pathAnimation.sphere.position.z = 5;
        
        // 启动所有动画
        scene.beginAnimation(animatedBox, 0, 120, true);
        easingMeshes.forEach(mesh => {
            scene.beginAnimation(mesh, 0, 120, true);
        });
        scene.beginAnimation(pathAnimation.sphere, 0, 120, true);
        
        // 创建动画控制界面
        createAnimationControls(animationGroup, scene);
        
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

## 8. 动画优化技巧

### 8.1 性能优化

```javascript
const optimizeAnimations = (scene) => {
    // 1. 使用对象池
    const animationPool = [];
    
    const getAnimation = (name, property, type) => {
        let animation = animationPool.find(a => !a.inUse);
        if (!animation) {
            animation = new BABYLON.Animation(name, property, 30, type);
            animationPool.push(animation);
        }
        animation.inUse = true;
        return animation;
    };
    
    const releaseAnimation = (animation) => {
        animation.inUse = false;
    };
    
    // 2. 批量动画更新
    scene.onBeforeAnimationsObservable.add(() => {
        // 在这里进行批量计算
    });
    
    // 3. LOD 动画 - 远距离物体使用简化动画
    const setupLODAnimations = (mesh, camera) => {
        scene.registerBeforeRender(() => {
            const distance = BABYLON.Vector3.Distance(mesh.position, camera.position);
            
            if (distance > 20) {
                // 远距离：停用动画
                mesh.animations = [];
            } else if (distance > 10) {
                // 中距离：简化动画
                // 只保留位置动画
            } else {
                // 近距离：完整动画
            }
        });
    };
};
```

## 9. 练习任务

1. 创建一个弹跳球动画，球从高处落下并反弹
2. 制作一个行星系统，多个行星绕太阳旋转，每个行星有不同的轨道和速度
3. 实现一个简单的角色走路循环动画
4. 创建一个粒子系统动画（火焰、雨滴等效果）

## 下一步

在下一个教程中，我们将学习：
- 用户交互系统
- 物理引擎集成
- 高级渲染技术

---

*提示：动画是让 3D 场景生动起来的关键，多尝试组合不同类型的动画创造更丰富的效果！*
