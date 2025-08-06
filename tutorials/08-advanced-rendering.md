# 08 - 高级渲染

## 📚 本章目标

学习 Babylon.js 的高级渲染技术，包括后期处理、着色器编程、PBR 材质、环境映射、粒子系统等，实现电影级别的视觉效果。

## 🎯 学习内容

- 后期处理管道
- 自定义着色器
- PBR 物理渲染
- 环境映射和天空盒
- 粒子系统
- 渲染优化技术

---

## 1. 后期处理管道

### 1.1 后期处理概述

```javascript
// 后期处理是在渲染完成后对整个画面进行的效果处理
const postProcessing = {
    definition: "在最终渲染结果上应用的视觉效果",
    benefits: ["增强视觉效果", "模拟相机特性", "艺术风格化"],
    common_effects: ["景深", "泛光", "SSAO", "运动模糊", "色调映射"]
};
```

### 1.2 基础后期处理效果

```javascript
// 创建后期处理管道
function setupPostProcessing(camera) {
    // 创建后期处理管道
    const postProcessRenderPipeline = new BABYLON.PostProcessRenderPipeline(
        engine, 
        "postProcessPipeline"
    );
    
    // 添加到场景
    scene.postProcessRenderPipelineManager.addPipeline(postProcessRenderPipeline);
    scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(
        "postProcessPipeline", 
        camera
    );
    
    return postProcessRenderPipeline;
}

// 1. 泛光效果 (Bloom)
function addBloomEffect(camera) {
    const bloomEffect = new BABYLON.BloomEffect(
        scene, 
        1.0, // 强度
        2, // 核心大小
        1.0, // 阈值
        false // HDR
    );
    
    bloomEffect.setThreshold(0.8);
    bloomEffect.setWeight(0.3);
    
    return bloomEffect;
}

// 2. 屏幕空间环境光遮蔽 (SSAO)
function addSSAOEffect(camera) {
    const ssaoRenderPipeline = new BABYLON.SSAO2RenderingPipeline(
        "ssao2",
        scene,
        {
            ssaoRatio: 0.5, // 质量比例
            blurRatio: 0.5  // 模糊比例
        }
    );
    
    // 配置参数
    ssaoRenderPipeline.totalStrength = 1.0;
    ssaoRenderPipeline.radius = 0.0006;
    ssaoRenderPipeline.area = 0.0075;
    ssaoRenderPipeline.fallOff = 0.000001;
    ssaoRenderPipeline.base = 0.5;
    
    // 附加到摄像机
    scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(
        "ssao2", 
        camera
    );
    
    return ssaoRenderPipeline;
}

// 3. 色调映射
function addToneMappingEffect(camera) {
    const toneMapping = new BABYLON.TonemappingPostProcess(
        "toneMapping",
        BABYLON.TonemappingPostProcess.HABLE_TONEMAPPING,
        1.0,
        camera
    );
    
    toneMapping.exposureAdjustment = 1.2;
    
    return toneMapping;
}

// 4. 景深效果
function addDepthOfFieldEffect(camera) {
    const depthOfField = new BABYLON.DepthOfFieldEffect(
        scene,
        camera,
        {
            focusDistance: 2000,
            focalLength: 50,
            fStop: 1.4,
            textureType: 0
        }
    );
    
    return depthOfField;
}
```

### 1.3 自定义后期处理效果

```javascript
// 创建自定义后期处理效果
class CustomPostProcess extends BABYLON.PostProcess {
    constructor(name, camera, options = {}) {
        // 片段着色器代码
        const fragmentShader = `
            precision highp float;
            varying vec2 vUV;
            uniform sampler2D textureSampler;
            uniform float time;
            uniform float intensity;
            
            void main(void) {
                vec2 uv = vUV;
                
                // 添加扭曲效果
                float distortion = sin(uv.y * 10.0 + time) * 0.01 * intensity;
                uv.x += distortion;
                
                vec4 color = texture2D(textureSampler, uv);
                
                // 添加色彩效果
                color.rgb = mix(color.rgb, vec3(0.5, 0.8, 1.0), 0.1 * intensity);
                
                gl_FragColor = color;
            }
        `;
        
        super(name, fragmentShader, ["time", "intensity"], null, 1.0, camera);
        
        this.time = 0;
        this.intensity = options.intensity || 1.0;
        
        this.onApply = (effect) => {
            effect.setFloat("time", this.time);
            effect.setFloat("intensity", this.intensity);
            this.time += 0.016; // 约60fps
        };
    }
}

// 使用自定义后期处理
function applyCustomEffect(camera) {
    const customEffect = new CustomPostProcess("customEffect", camera);
    return customEffect;
}
```

---

## 2. 自定义着色器

### 2.1 着色器基础

```javascript
// 顶点着色器示例
const vertexShader = `
    precision highp float;
    
    // 输入属性
    attribute vec3 position;
    attribute vec3 normal;
    attribute vec2 uv;
    
    // 统一变量
    uniform mat4 worldViewProjection;
    uniform mat4 world;
    uniform float time;
    
    // 输出到片段着色器
    varying vec3 vPositionW;
    varying vec3 vNormalW;
    varying vec2 vUV;
    
    void main(void) {
        vec3 p = position;
        
        // 添加波浪效果
        p.y += sin(p.x * 2.0 + time) * 0.1;
        
        vec4 outPosition = worldViewProjection * vec4(p, 1.0);
        gl_Position = outPosition;
        
        vPositionW = vec3(world * vec4(p, 1.0));
        vNormalW = normalize(vec3(world * vec4(normal, 0.0)));
        vUV = uv;
    }
`;

// 片段着色器示例
const fragmentShader = `
    precision highp float;
    
    // 从顶点着色器接收
    varying vec3 vPositionW;
    varying vec3 vNormalW;
    varying vec2 vUV;
    
    // 统一变量
    uniform vec3 cameraPosition;
    uniform sampler2D diffuseTexture;
    uniform vec3 lightDirection;
    uniform vec3 lightColor;
    uniform float time;
    
    void main(void) {
        // 基础纹理
        vec4 baseColor = texture2D(diffuseTexture, vUV);
        
        // 计算光照
        vec3 lightVec = normalize(lightDirection);
        float ndl = max(0.0, dot(vNormalW, lightVec));
        
        // 环境光
        vec3 ambient = vec3(0.2, 0.2, 0.3);
        
        // 漫反射
        vec3 diffuse = lightColor * ndl;
        
        // 最终颜色
        vec3 finalColor = baseColor.rgb * (ambient + diffuse);
        
        // 添加时间变化效果
        finalColor += sin(time) * 0.1;
        
        gl_FragColor = vec4(finalColor, baseColor.a);
    }
`;
```

### 2.2 创建自定义材质

```javascript
// 创建自定义着色器材质
function createCustomShaderMaterial(name, diffuseTexture) {
    const shaderMaterial = new BABYLON.ShaderMaterial(
        name,
        scene,
        {
            vertex: "custom",
            fragment: "custom"
        },
        {
            attributes: ["position", "normal", "uv"],
            uniforms: [
                "world", "worldView", "worldViewProjection", "view", "projection",
                "time", "cameraPosition", "lightDirection", "lightColor"
            ]
        }
    );
    
    // 设置纹理
    if (diffuseTexture) {
        shaderMaterial.setTexture("diffuseTexture", diffuseTexture);
    }
    
    // 设置统一变量
    shaderMaterial.setFloat("time", 0);
    shaderMaterial.setVector3("lightDirection", new BABYLON.Vector3(-1, -1, -1));
    shaderMaterial.setVector3("lightColor", new BABYLON.Vector3(1, 1, 1));
    
    // 动画更新
    scene.registerBeforeRender(() => {
        shaderMaterial.setFloat("time", performance.now() * 0.001);
        shaderMaterial.setVector3("cameraPosition", scene.activeCamera.position);
    });
    
    return shaderMaterial;
}

// 定义着色器代码
BABYLON.Effect.ShadersStore["customVertexShader"] = vertexShader;
BABYLON.Effect.ShadersStore["customFragmentShader"] = fragmentShader;
```

### 2.3 节点材质编辑器

```javascript
// 使用节点材质系统
function createNodeMaterial() {
    const nodeMaterial = new BABYLON.NodeMaterial("nodeMaterial", scene);
    
    // 输入节点
    const positionInput = new BABYLON.InputBlock("position");
    positionInput.setAsAttribute("position");
    
    const uvInput = new BABYLON.InputBlock("uv");
    uvInput.setAsAttribute("uv");
    
    const timeInput = new BABYLON.InputBlock("time");
    timeInput.value = 0;
    timeInput.min = 0;
    timeInput.max = 100;
    timeInput.isBoolean = false;
    timeInput.matrixMode = 0;
    timeInput.animationType = BABYLON.AnimatedInputBlockTypes.Time;
    
    // 纹理节点
    const textureBlock = new BABYLON.TextureBlock("texture");
    
    // 数学节点
    const multiplyBlock = new BABYLON.MultiplyBlock("multiply");
    const addBlock = new BABYLON.AddBlock("add");
    
    // 输出节点
    const fragmentOutput = new BABYLON.FragmentOutputBlock("fragmentOutput");
    const vertexOutput = new BABYLON.VertexOutputBlock("vertexOutput");
    
    // 连接节点
    uvInput.connectTo(textureBlock.uv);
    textureBlock.connectTo(multiplyBlock.left);
    timeInput.connectTo(multiplyBlock.right);
    multiplyBlock.connectTo(addBlock.left);
    addBlock.connectTo(fragmentOutput.rgb);
    
    positionInput.connectTo(vertexOutput.vector);
    
    // 构建材质
    nodeMaterial.build();
    
    return nodeMaterial;
}
```

---

## 3. PBR 物理渲染

### 3.1 PBR 材质基础

```javascript
// 创建 PBR 材质
function createPBRMaterial(name, options = {}) {
    const pbrMaterial = new BABYLON.PBRMaterial(name, scene);
    
    // 基础颜色
    if (options.baseColor) {
        pbrMaterial.baseColor = options.baseColor;
    }
    
    if (options.baseTexture) {
        pbrMaterial.baseTexture = options.baseTexture;
    }
    
    // 金属度和粗糙度
    pbrMaterial.metallicFactor = options.metallic || 0.0;
    pbrMaterial.roughnessFactor = options.roughness || 1.0;
    
    if (options.metallicRoughnessTexture) {
        pbrMaterial.metallicRoughnessTexture = options.metallicRoughnessTexture;
        pbrMaterial.useRoughnessFromMetallicTextureGreen = true;
        pbrMaterial.useMetallnessFromMetallicTextureBlue = true;
    }
    
    // 法线贴图
    if (options.normalTexture) {
        pbrMaterial.bumpTexture = options.normalTexture;
    }
    
    // 环境遮蔽
    if (options.aoTexture) {
        pbrMaterial.ambientTexture = options.aoTexture;
        pbrMaterial.useAmbientInGrayScale = true;
    }
    
    // 自发光
    if (options.emissiveTexture) {
        pbrMaterial.emissiveTexture = options.emissiveTexture;
    }
    
    if (options.emissiveColor) {
        pbrMaterial.emissiveColor = options.emissiveColor;
    }
    
    // 透明度
    if (options.alpha !== undefined) {
        pbrMaterial.alpha = options.alpha;
    }
    
    return pbrMaterial;
}

// 高级 PBR 设置
function setupAdvancedPBR(material) {
    // 启用图像基础光照 (IBL)
    material.useImageBasedLighting = true;
    
    // 设置环境纹理
    if (scene.environmentTexture) {
        material.environmentTexture = scene.environmentTexture;
    }
    
    // 启用物理正确的光照
    material.usePhysicalLightFalloff = true;
    
    // 设置折射率 (IOR)
    material.indexOfRefraction = 1.5; // 玻璃
    
    // 启用清漆层 (适用于汽车漆面)
    material.clearCoat.isEnabled = true;
    material.clearCoat.intensity = 0.5;
    material.clearCoat.roughness = 0.1;
    
    // 启用各向异性 (适用于金属表面)
    material.anisotropy.isEnabled = true;
    material.anisotropy.intensity = 0.3;
    material.anisotropy.direction = new BABYLON.Vector2(1, 0);
    
    return material;
}
```

### 3.2 材质变化和动画

```javascript
// 材质属性动画
function animatePBRMaterial(material) {
    // 金属度动画
    const metallicAnimation = BABYLON.Animation.CreateAndStartAnimation(
        "metallicAnim",
        material,
        "metallicFactor",
        30,
        120,
        0,
        1,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );
    
    // 粗糙度动画
    const roughnessAnimation = BABYLON.Animation.CreateAndStartAnimation(
        "roughnessAnim",
        material,
        "roughnessFactor",
        30,
        120,
        0.1,
        1.0,
        BABYLON.Animation.ANIMATIONLOOPMODE_YOYO
    );
    
    // 自发光颜色动画
    const emissiveKeys = [
        { frame: 0, value: new BABYLON.Color3(0, 0, 0) },
        { frame: 60, value: new BABYLON.Color3(1, 0.5, 0) },
        { frame: 120, value: new BABYLON.Color3(0, 0, 0) }
    ];
    
    const emissiveAnimation = new BABYLON.Animation(
        "emissiveAnim",
        "emissiveColor",
        30,
        BABYLON.Animation.ANIMATIONTYPE_COLOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );
    
    emissiveAnimation.setKeys(emissiveKeys);
    material.animations = [emissiveAnimation];
    scene.beginAnimation(material, 0, 120, true);
}
```

---

## 4. 环境映射和天空盒

### 4.1 天空盒设置

```javascript
// 创建立方体天空盒
function createCubeboxSkybox() {
    const skybox = BABYLON.MeshBuilder.CreateSphere("skyBox", {diameter:100}, scene);
    const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    
    // 设置为天空盒模式
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("textures/skybox", scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    
    skybox.material = skyboxMaterial;
    skybox.infiniteDistance = true;
    
    return skybox;
}

// 创建HDR天空盒
async function createHDRSkybox() {
    const hdrTexture = new BABYLON.HDRCubeTexture("textures/environment.hdr", scene, 512);
    
    const skybox = BABYLON.MeshBuilder.CreateSphere("skyBox", {diameter:100}, scene);
    const skyboxMaterial = new BABYLON.PBRMaterial("skyBox", scene);
    
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = hdrTexture;
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.microSurface = 1.0;
    skyboxMaterial.disableLighting = true;
    
    skybox.material = skyboxMaterial;
    skybox.infiniteDistance = true;
    
    // 设置为场景环境纹理
    scene.environmentTexture = hdrTexture;
    
    return skybox;
}

// 程序化天空
function createProceduralSky() {
    const skyMaterial = new BABYLON.SkyMaterial("skyMaterial", scene);
    skyMaterial.backFaceCulling = false;
    
    // 太阳参数
    skyMaterial.inclination = 0.49; // 太阳高度
    skyMaterial.azimuth = 0.25; // 太阳方位角
    skyMaterial.luminance = 1.0; // 亮度
    skyMaterial.mieDirectionalG = 0.8; // Mie散射
    skyMaterial.mieCoefficient = 0.005; // Mie系数
    skyMaterial.rayleigh = 2; // 瑞利散射
    skyMaterial.turbidity = 10; // 浊度
    
    const skybox = BABYLON.MeshBuilder.CreateSphere("skyBox", {diameter:100}, scene);
    skybox.material = skyMaterial;
    skybox.infiniteDistance = true;
    
    return skybox;
}
```

### 4.2 环境反射

```javascript
// 设置环境反射
function setupEnvironmentReflection() {
    // 创建反射探针
    const reflectionProbe = new BABYLON.ReflectionProbe("probe", 512, scene);
    reflectionProbe.renderList.push(...scene.meshes);
    
    // 设置探针位置
    reflectionProbe.position = new BABYLON.Vector3(0, 1, 0);
    
    // 为材质设置反射
    scene.meshes.forEach(mesh => {
        if (mesh.material && mesh.material instanceof BABYLON.PBRMaterial) {
            mesh.material.reflectionTexture = reflectionProbe.cubeTexture;
        }
    });
    
    return reflectionProbe;
}

// 镜面反射
function createMirror(position, size) {
    const mirror = BABYLON.MeshBuilder.CreateGround("mirror", size, scene);
    mirror.position = position;
    
    const mirrorMaterial = new BABYLON.StandardMaterial("mirrorMaterial", scene);
    
    // 创建镜面纹理
    const mirrorTexture = new BABYLON.MirrorTexture("mirror", 1024, scene, true);
    mirrorTexture.mirrorPlane = new BABYLON.Plane(0, -1, 0, -position.y);
    mirrorTexture.renderList = scene.meshes;
    
    mirrorMaterial.reflectionTexture = mirrorTexture;
    mirror.material = mirrorMaterial;
    
    return mirror;
}
```

---

## 5. 粒子系统

### 5.1 基础粒子系统

```javascript
// 创建粒子系统
function createParticleSystem(emitter, capacity = 2000) {
    const particleSystem = new BABYLON.ParticleSystem("particles", capacity, scene);
    
    // 设置纹理
    particleSystem.particleTexture = new BABYLON.Texture("textures/particle.png", scene);
    
    // 发射器
    particleSystem.emitter = emitter;
    particleSystem.minEmitBox = new BABYLON.Vector3(-1, 0, -1);
    particleSystem.maxEmitBox = new BABYLON.Vector3(1, 0, 1);
    
    // 颜色
    particleSystem.color1 = new BABYLON.Color4(0.7, 0.8, 1.0, 1.0);
    particleSystem.color2 = new BABYLON.Color4(0.2, 0.5, 1.0, 1.0);
    particleSystem.colorDead = new BABYLON.Color4(0, 0, 0.2, 0.0);
    
    // 大小
    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.5;
    
    // 生命周期
    particleSystem.minLifeTime = 0.3;
    particleSystem.maxLifeTime = 1.5;
    
    // 发射速率
    particleSystem.emitRate = 1500;
    
    // 混合模式
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
    
    // 重力
    particleSystem.gravity = new BABYLON.Vector3(0, -9.81, 0);
    
    // 方向
    particleSystem.direction1 = new BABYLON.Vector3(-2, 8, 2);
    particleSystem.direction2 = new BABYLON.Vector3(2, 8, -2);
    
    // 角速度
    particleSystem.minAngularSpeed = 0;
    particleSystem.maxAngularSpeed = Math.PI;
    
    // 速度
    particleSystem.minInitialRotation = 0;
    particleSystem.maxInitialRotation = Math.PI;
    
    return particleSystem;
}

// 火焰效果
function createFireEffect(position) {
    const fountain = BABYLON.MeshBuilder.CreateBox("fountain", {size:0.1}, scene);
    fountain.position = position;
    fountain.visibility = 0;
    
    const particleSystem = createParticleSystem(fountain, 2000);
    
    // 火焰特定设置
    particleSystem.particleTexture = new BABYLON.Texture("textures/flare.png", scene);
    particleSystem.color1 = new BABYLON.Color4(1, 0.5, 0, 1.0);
    particleSystem.color2 = new BABYLON.Color4(1, 0, 0, 1.0);
    particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0.0);
    
    particleSystem.minSize = 0.3;
    particleSystem.maxSize = 1.0;
    
    particleSystem.minLifeTime = 0.2;
    particleSystem.maxLifeTime = 0.4;
    
    particleSystem.emitRate = 300;
    particleSystem.direction1 = new BABYLON.Vector3(-0.5, 1, -0.5);
    particleSystem.direction2 = new BABYLON.Vector3(0.5, 1, 0.5);
    
    particleSystem.start();
    
    return particleSystem;
}

// 烟雾效果
function createSmokeEffect(position) {
    const emitter = BABYLON.MeshBuilder.CreateBox("emitter", {size:0.1}, scene);
    emitter.position = position;
    emitter.visibility = 0;
    
    const particleSystem = createParticleSystem(emitter, 1000);
    
    // 烟雾特定设置
    particleSystem.particleTexture = new BABYLON.Texture("textures/cloud.png", scene);
    particleSystem.color1 = new BABYLON.Color4(0.8, 0.8, 0.8, 1.0);
    particleSystem.color2 = new BABYLON.Color4(0.95, 0.95, 0.95, 1.0);
    particleSystem.colorDead = new BABYLON.Color4(0.9, 0.9, 0.9, 0.0);
    
    particleSystem.minSize = 1.0;
    particleSystem.maxSize = 3.0;
    
    particleSystem.minLifeTime = 1.0;
    particleSystem.maxLifeTime = 3.0;
    
    particleSystem.emitRate = 50;
    particleSystem.gravity = new BABYLON.Vector3(0, -0.5, 0);
    particleSystem.direction1 = new BABYLON.Vector3(-0.2, 1, -0.2);
    particleSystem.direction2 = new BABYLON.Vector3(0.2, 1, 0.2);
    
    particleSystem.start();
    
    return particleSystem;
}
```

### 5.2 GPU 粒子系统

```javascript
// GPU 粒子系统 (更高性能)
function createGPUParticleSystem(emitter, capacity = 50000) {
    const gpuParticleSystem = new BABYLON.GPUParticleSystem("gpu_particles", {
        capacity: capacity,
        randomTextureSize: 256
    }, scene);
    
    gpuParticleSystem.particleTexture = new BABYLON.Texture("textures/particle.png", scene);
    gpuParticleSystem.emitter = emitter;
    
    gpuParticleSystem.minEmitBox = new BABYLON.Vector3(-2, 0, -2);
    gpuParticleSystem.maxEmitBox = new BABYLON.Vector3(2, 0, 2);
    
    gpuParticleSystem.color1 = new BABYLON.Color4(1, 1, 1, 1);
    gpuParticleSystem.color2 = new BABYLON.Color4(1, 1, 1, 1);
    gpuParticleSystem.colorDead = new BABYLON.Color4(1, 1, 1, 0);
    
    gpuParticleSystem.minSize = 0.1;
    gpuParticleSystem.maxSize = 0.3;
    
    gpuParticleSystem.minLifeTime = 1;
    gpuParticleSystem.maxLifeTime = 2;
    
    gpuParticleSystem.emitRate = 5000;
    
    gpuParticleSystem.gravity = new BABYLON.Vector3(0, -9.81, 0);
    gpuParticleSystem.direction1 = new BABYLON.Vector3(-1, 1, -1);
    gpuParticleSystem.direction2 = new BABYLON.Vector3(1, 1, 1);
    
    return gpuParticleSystem;
}
```

---

## 6. 渲染优化技术

### 6.1 LOD (细节层次)

```javascript
// LOD 系统
function setupLODSystem(highDetailMesh, mediumDetailMesh, lowDetailMesh, position) {
    const lodGroup = new BABYLON.LODGroup();
    
    // 添加不同细节层次
    lodGroup.addLODLevel(0, highDetailMesh);    // 0-50 单位距离
    lodGroup.addLODLevel(50, mediumDetailMesh); // 50-100 单位距离
    lodGroup.addLODLevel(100, lowDetailMesh);   // 100+ 单位距离
    lodGroup.addLODLevel(200, null);            // 200+ 单位距离隐藏
    
    // 设置位置
    lodGroup.position = position;
    
    return lodGroup;
}

// 自动 LOD 生成
function generateAutoLOD(originalMesh) {
    const lodLevels = [];
    
    // 使用简化算法生成不同细节层次
    for (let i = 0; i < 3; i++) {
        const simplificationRatio = Math.pow(0.5, i + 1); // 50%, 25%, 12.5%
        const lodMesh = originalMesh.clone(`${originalMesh.name}_LOD${i}`);
        
        // 简化网格 (需要额外的简化库)
        // lodMesh = simplifyMesh(lodMesh, simplificationRatio);
        
        lodLevels.push({
            distance: 25 * (i + 1),
            mesh: lodMesh
        });
    }
    
    return lodLevels;
}
```

### 6.2 实例化渲染

```javascript
// 实例化渲染提高性能
function createInstancedMeshes(originalMesh, positions) {
    const instances = [];
    
    positions.forEach((position, index) => {
        if (index === 0) {
            // 第一个使用原始网格
            originalMesh.position = position;
            instances.push(originalMesh);
        } else {
            // 其他创建实例
            const instance = originalMesh.createInstance(`instance_${index}`);
            instance.position = position;
            instances.push(instance);
        }
    });
    
    return instances;
}

// 批量渲染
function setupBatchRendering() {
    // 启用合并几何体
    scene.meshes.forEach(mesh => {
        if (mesh.material && mesh.material.needAlphaBlending()) {
            mesh.alphaIndex = mesh.position.z; // 排序透明对象
        }
    });
    
    // 自动合并静态网格
    const staticMeshes = scene.meshes.filter(mesh => !mesh.animations.length);
    if (staticMeshes.length > 1) {
        const merged = BABYLON.Mesh.MergeMeshes(staticMeshes, true, true);
        if (merged) {
            console.log("合并了", staticMeshes.length, "个静态网格");
        }
    }
}
```

### 6.3 遮挡剔除

```javascript
// 视锥体剔除
function setupFrustumCulling() {
    scene.setRenderingAutoClearDepthStencil(0, false);
    
    // 自定义遮挡查询
    scene.registerBeforeRender(() => {
        const camera = scene.activeCamera;
        const frustumPlanes = BABYLON.Frustum.GetPlanes(camera.getTransformationMatrix());
        
        scene.meshes.forEach(mesh => {
            if (mesh.getBoundingInfo) {
                const boundingInfo = mesh.getBoundingInfo();
                const isInFrustum = BABYLON.BoundingBox.IsInFrustum(
                    boundingInfo.boundingBox, 
                    frustumPlanes
                );
                
                mesh.setEnabled(isInFrustum);
            }
        });
    });
}

// 遮挡查询
function setupOcclusionCulling(occluders) {
    occluders.forEach(occluder => {
        occluder.occlusionQueryAlgorithmType = BABYLON.AbstractMesh.OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE;
        occluder.occlusionType = BABYLON.AbstractMesh.OCCLUSION_TYPE_OPTIMISTIC;
    });
}
```

---

## 7. 完整高级渲染演示

```html
<!DOCTYPE html>
<html>
<head>
    <title>Babylon.js 高级渲染演示</title>
    <script src="https://cdn.babylonjs.com/babylon.js"></script>
    <script src="https://cdn.babylonjs.com/materialsLibrary/babylonjs.materials.min.js"></script>
    <script src="https://cdn.babylonjs.com/postProcessesLibrary/babylonjs.postProcess.min.js"></script>
    <style>
        html, body { margin: 0; padding: 0; overflow: hidden; }
        canvas { width: 100%; height: 100%; touch-action: none; }
        .controls {
            position: absolute; top: 10px; right: 10px;
            background: rgba(0,0,0,0.8); color: white;
            padding: 15px; border-radius: 5px; width: 250px;
        }
        .slider { width: 100%; margin: 10px 0; }
        label { display: block; margin: 5px 0; }
    </style>
</head>
<body>
    <canvas id="renderCanvas"></canvas>
    <div class="controls">
        <h3>渲染控制</h3>
        
        <label>
            泛光强度: <span id="bloomValue">0.3</span>
            <input type="range" class="slider" id="bloomSlider" 
                   min="0" max="1" step="0.1" value="0.3">
        </label>
        
        <label>
            SSAO 强度: <span id="ssaoValue">1.0</span>
            <input type="range" class="slider" id="ssaoSlider" 
                   min="0" max="2" step="0.1" value="1.0">
        </label>
        
        <label>
            金属度: <span id="metallicValue">0.5</span>
            <input type="range" class="slider" id="metallicSlider" 
                   min="0" max="1" step="0.1" value="0.5">
        </label>
        
        <label>
            粗糙度: <span id="roughnessValue">0.5</span>
            <input type="range" class="slider" id="roughnessSlider" 
                   min="0" max="1" step="0.1" value="0.5">
        </label>
        
        <button onclick="toggleParticles()">切换粒子效果</button>
        <button onclick="togglePostProcessing()">切换后期处理</button>
    </div>

    <script>
        const canvas = document.getElementById("renderCanvas");
        const engine = new BABYLON.Engine(canvas, true);
        let scene, camera, mainMesh, particleSystem, bloomEffect, ssaoEffect;
        let postProcessingEnabled = true;
        let particlesEnabled = true;
        
        async function createScene() {
            scene = new BABYLON.Scene(engine);
            scene.clearColor = new BABYLON.Color3(0.1, 0.1, 0.15);
            
            // 摄像机
            camera = new BABYLON.ArcRotateCamera(
                "camera", -Math.PI / 2, Math.PI / 2.5, 8,
                BABYLON.Vector3.Zero(), scene
            );
            camera.attachToCanvas(canvas, true);
            
            // HDR 环境
            await setupHDREnvironment();
            
            // 创建主要几何体
            createMainGeometry();
            
            // 设置后期处理
            setupPostProcessing();
            
            // 创建粒子效果
            createParticleEffects();
            
            // 设置控制
            setupControls();
            
            return scene;
        }
        
        async function setupHDREnvironment() {
            // 程序化天空
            const skyMaterial = new BABYLON.SkyMaterial("skyMaterial", scene);
            skyMaterial.backFaceCulling = false;
            skyMaterial.inclination = 0.49;
            skyMaterial.azimuth = 0.25;
            skyMaterial.luminance = 1.0;
            
            const skybox = BABYLON.MeshBuilder.CreateSphere("skyBox", {diameter:100}, scene);
            skybox.material = skyMaterial;
            skybox.infiniteDistance = true;
            
            // 设置光照
            const light = new BABYLON.DirectionalLight(
                "dirLight", new BABYLON.Vector3(-1, -1, -1), scene
            );
            light.intensity = 3.0;
            
            const hemiLight = new BABYLON.HemisphericLight(
                "hemiLight", new BABYLON.Vector3(0, 1, 0), scene
            );
            hemiLight.intensity = 0.3;
        }
        
        function createMainGeometry() {
            // 创建多个不同材质的几何体
            const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 2}, scene);
            sphere.position.x = -3;
            
            const box = BABYLON.MeshBuilder.CreateBox("box", {size: 2}, scene);
            box.position.x = 0;
            
            const torus = BABYLON.MeshBuilder.CreateTorus("torus", {diameter: 2}, scene);
            torus.position.x = 3;
            
            // 地面
            const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 20, height: 20}, scene);
            ground.position.y = -1;
            
            // 创建 PBR 材质
            const sphereMaterial = createAdvancedPBRMaterial("sphereMaterial", {
                baseColor: new BABYLON.Color3(0.8, 0.1, 0.1),
                metallic: 0.9,
                roughness: 0.1
            });
            
            const boxMaterial = createAdvancedPBRMaterial("boxMaterial", {
                baseColor: new BABYLON.Color3(0.1, 0.8, 0.1),
                metallic: 0.1,
                roughness: 0.8
            });
            
            const torusMaterial = createAdvancedPBRMaterial("torusMaterial", {
                baseColor: new BABYLON.Color3(0.1, 0.1, 0.8),
                metallic: 0.5,
                roughness: 0.3
            });
            
            const groundMaterial = createAdvancedPBRMaterial("groundMaterial", {
                baseColor: new BABYLON.Color3(0.3, 0.3, 0.3),
                metallic: 0.0,
                roughness: 0.9
            });
            
            sphere.material = sphereMaterial;
            box.material = boxMaterial;
            torus.material = torusMaterial;
            ground.material = groundMaterial;
            
            mainMesh = box; // 用于控制
            
            // 添加旋转动画
            scene.registerBeforeRender(() => {
                sphere.rotation.y += 0.01;
                box.rotation.x += 0.005;
                box.rotation.y += 0.01;
                torus.rotation.z += 0.01;
            });
        }
        
        function createAdvancedPBRMaterial(name, options) {
            const material = new BABYLON.PBRMaterial(name, scene);
            
            material.baseColor = options.baseColor;
            material.metallicFactor = options.metallic;
            material.roughnessFactor = options.roughness;
            
            // 启用高级特性
            material.useImageBasedLighting = true;
            material.usePhysicalLightFalloff = true;
            
            return material;
        }
        
        function setupPostProcessing() {
            // 泛光效果
            bloomEffect = new BABYLON.BloomEffect(scene, 1.0, 2, 0.8, false);
            bloomEffect.setThreshold(0.8);
            bloomEffect.setWeight(0.3);
            
            // SSAO 效果
            ssaoEffect = new BABYLON.SSAO2RenderingPipeline("ssao2", scene, {
                ssaoRatio: 0.5,
                blurRatio: 0.5
            });
            
            ssaoEffect.totalStrength = 1.0;
            ssaoEffect.radius = 0.0006;
            ssaoEffect.area = 0.0075;
            
            scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(
                "ssao2", camera
            );
        }
        
        function createParticleEffects() {
            // 创建火花效果
            const emitter = BABYLON.MeshBuilder.CreateBox("emitter", {size: 0.1}, scene);
            emitter.position = new BABYLON.Vector3(0, 2, 0);
            emitter.visibility = 0;
            
            particleSystem = new BABYLON.ParticleSystem("particles", 2000, scene);
            particleSystem.particleTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/flare.png", scene);
            
            particleSystem.emitter = emitter;
            particleSystem.minEmitBox = new BABYLON.Vector3(-0.5, 0, -0.5);
            particleSystem.maxEmitBox = new BABYLON.Vector3(0.5, 0, 0.5);
            
            particleSystem.color1 = new BABYLON.Color4(1, 0.8, 0, 1.0);
            particleSystem.color2 = new BABYLON.Color4(1, 0.4, 0, 1.0);
            particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0.0);
            
            particleSystem.minSize = 0.1;
            particleSystem.maxSize = 0.3;
            
            particleSystem.minLifeTime = 0.3;
            particleSystem.maxLifeTime = 1.0;
            
            particleSystem.emitRate = 500;
            
            particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
            particleSystem.gravity = new BABYLON.Vector3(0, -9.81, 0);
            particleSystem.direction1 = new BABYLON.Vector3(-1, 1, -1);
            particleSystem.direction2 = new BABYLON.Vector3(1, 1, 1);
            
            particleSystem.start();
        }
        
        function setupControls() {
            const bloomSlider = document.getElementById("bloomSlider");
            const bloomValue = document.getElementById("bloomValue");
            bloomSlider.addEventListener("input", (e) => {
                const value = parseFloat(e.target.value);
                bloomValue.textContent = value.toFixed(1);
                if (bloomEffect) {
                    bloomEffect.setWeight(value);
                }
            });
            
            const ssaoSlider = document.getElementById("ssaoSlider");
            const ssaoValue = document.getElementById("ssaoValue");
            ssaoSlider.addEventListener("input", (e) => {
                const value = parseFloat(e.target.value);
                ssaoValue.textContent = value.toFixed(1);
                if (ssaoEffect) {
                    ssaoEffect.totalStrength = value;
                }
            });
            
            const metallicSlider = document.getElementById("metallicSlider");
            const metallicValue = document.getElementById("metallicValue");
            metallicSlider.addEventListener("input", (e) => {
                const value = parseFloat(e.target.value);
                metallicValue.textContent = value.toFixed(1);
                if (mainMesh && mainMesh.material) {
                    mainMesh.material.metallicFactor = value;
                }
            });
            
            const roughnessSlider = document.getElementById("roughnessSlider");
            const roughnessValue = document.getElementById("roughnessValue");
            roughnessSlider.addEventListener("input", (e) => {
                const value = parseFloat(e.target.value);
                roughnessValue.textContent = value.toFixed(1);
                if (mainMesh && mainMesh.material) {
                    mainMesh.material.roughnessFactor = value;
                }
            });
        }
        
        function toggleParticles() {
            if (particlesEnabled) {
                particleSystem.stop();
            } else {
                particleSystem.start();
            }
            particlesEnabled = !particlesEnabled;
        }
        
        function togglePostProcessing() {
            if (postProcessingEnabled) {
                scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(
                    "ssao2", camera
                );
                bloomEffect.setWeight(0);
            } else {
                scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(
                    "ssao2", camera
                );
                bloomEffect.setWeight(0.3);
            }
            postProcessingEnabled = !postProcessingEnabled;
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

## 8. 下一步

完成本章学习后，你应该掌握：

✅ 后期处理效果的实现和自定义
✅ 着色器编程和材质系统
✅ PBR 物理渲染技术
✅ 环境映射和天空盒设置
✅ 粒子系统的创建和优化
✅ 渲染性能优化技巧

这标志着 Babylon.js 基础教程系列的完成，现在你可以开始更复杂的项目实战！

---

## 9. 参考资源

- [Babylon.js 后期处理文档](https://doc.babylonjs.com/divingDeeper/postProcesses)
- [着色器编程指南](https://doc.babylonjs.com/divingDeeper/materials/shaders)
- [PBR 材质详解](https://doc.babylonjs.com/divingDeeper/materials/using/pbrMaterial)
- [粒子系统文档](https://doc.babylonjs.com/divingDeeper/particles)
- [渲染优化技巧](https://doc.babylonjs.com/divingDeeper/scene/optimize_your_scene)
