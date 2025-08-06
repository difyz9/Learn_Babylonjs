# Babylon.js 性能优化建议

## 🚀 概述

性能优化是 3D Web 应用开发中的关键环节。本指南提供全面的优化策略，帮助您构建流畅、高效的 Babylon.js 应用。

## 📊 性能目标

### 基准指标
- **桌面端**: 60 FPS，稳定在 16.67ms/帧
- **移动端**: 30 FPS，稳定在 33.33ms/帧
- **内存使用**: < 500MB (移动端 < 200MB)
- **首次加载**: < 3 秒
- **模型加载**: < 5 秒

---

## 🔧 渲染优化

### 1. 几何体优化

#### 减少多边形数量
```javascript
// ❌ 避免过高精度的几何体
const highPolySphere = BABYLON.MeshBuilder.CreateSphere("sphere", {
    segments: 64  // 过高，会生成大量三角形
}, scene);

// ✅ 使用合理的精度
const optimizedSphere = BABYLON.MeshBuilder.CreateSphere("sphere", {
    segments: 16  // 足够的视觉效果，性能更好
}, scene);

// 动态调整精度
function createLODSphere(name, distance, scene) {
    let segments;
    if (distance > 100) segments = 8;
    else if (distance > 50) segments = 16;
    else segments = 32;
    
    return BABYLON.MeshBuilder.CreateSphere(name, { segments }, scene);
}
```

#### 网格合并
```javascript
// ✅ 合并静态网格减少绘制调用
const staticMeshes = [mesh1, mesh2, mesh3, mesh4];
const mergedMesh = BABYLON.Mesh.MergeMeshes(staticMeshes, true, true, true, false, true);

// 合并具有相同材质的网格
function mergeByMaterial(meshes) {
    const groupedMeshes = {};
    
    meshes.forEach(mesh => {
        const materialId = mesh.material?.id || 'default';
        if (!groupedMeshes[materialId]) {
            groupedMeshes[materialId] = [];
        }
        groupedMeshes[materialId].push(mesh);
    });
    
    Object.values(groupedMeshes).forEach(group => {
        if (group.length > 1) {
            BABYLON.Mesh.MergeMeshes(group);
        }
    });
}
```

#### 实例化渲染
```javascript
// ✅ 对重复对象使用实例化
const sourceMesh = BABYLON.MeshBuilder.CreateBox("source", { size: 1 }, scene);

// 创建1000个实例而不是1000个独立网格
const instances = [];
for (let i = 0; i < 1000; i++) {
    const instance = sourceMesh.createInstance(`instance_${i}`);
    instance.position = new BABYLON.Vector3(
        Math.random() * 100 - 50,
        Math.random() * 10,
        Math.random() * 100 - 50
    );
    instances.push(instance);
}

// 批量实例化（更高效）
function createInstancedMeshes(sourceMesh, positions) {
    const bufferMatrices = new Float32Array(16 * positions.length);
    
    positions.forEach((pos, index) => {
        const matrix = BABYLON.Matrix.Translation(pos.x, pos.y, pos.z);
        matrix.copyToArray(bufferMatrices, index * 16);
    });
    
    sourceMesh.thinInstanceSetBuffer("matrix", bufferMatrices, 16);
}
```

### 2. 材质和纹理优化

#### 纹理压缩和尺寸
```javascript
// ✅ 使用适当的纹理尺寸
function createOptimizedTexture(url, scene, size = 512) {
    const texture = new BABYLON.Texture(url, scene);
    
    // 设置压缩选项
    texture.format = BABYLON.Engine.TEXTUREFORMAT_RGB;
    texture.samplingMode = BABYLON.Texture.BILINEAR_SAMPLINGMODE;
    
    // 对于距离较远的对象，使用更小的纹理
    if (size <= 256) {
        texture.level = 0.5; // 降低亮度以减少视觉差异
    }
    
    return texture;
}

// 纹理atlas技术
class TextureAtlas {
    constructor(scene) {
        this.scene = scene;
        this.atlas = null;
        this.uvMappings = new Map();
    }
    
    createAtlas(textures) {
        // 将多个小纹理合并为一个大纹理
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 1024;
        canvas.height = 1024;
        
        let x = 0, y = 0;
        const tileSize = 256;
        
        textures.forEach((textureUrl, index) => {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, x, y, tileSize, tileSize);
                
                // 记录UV映射
                this.uvMappings.set(textureUrl, {
                    u: x / canvas.width,
                    v: y / canvas.height,
                    width: tileSize / canvas.width,
                    height: tileSize / canvas.height
                });
                
                x += tileSize;
                if (x >= canvas.width) {
                    x = 0;
                    y += tileSize;
                }
            };
            img.src = textureUrl;
        });
        
        this.atlas = new BABYLON.Texture(canvas.toDataURL(), this.scene);
        return this.atlas;
    }
}
```

#### 材质优化
```javascript
// ✅ 简化材质计算
function createOptimizedMaterial(name, scene, level = 'medium') {
    const material = new BABYLON.PBRMaterial(name, scene);
    
    switch (level) {
        case 'low':
            // 移动端低质量
            material.roughness = 1.0;
            material.metallicFactor = 0.0;
            material.disableLighting = true;
            break;
            
        case 'medium':
            // 标准质量
            material.roughness = 0.7;
            material.metallicFactor = 0.1;
            break;
            
        case 'high':
            // 高质量
            material.roughness = 0.3;
            material.metallicFactor = 0.8;
            material.environmentIntensity = 1.0;
            break;
    }
    
    return material;
}

// 材质共享
class MaterialManager {
    constructor() {
        this.materials = new Map();
    }
    
    getMaterial(name, properties, scene) {
        const key = JSON.stringify(properties);
        
        if (!this.materials.has(key)) {
            const material = new BABYLON.StandardMaterial(name, scene);
            Object.assign(material, properties);
            this.materials.set(key, material);
        }
        
        return this.materials.get(key);
    }
}
```

### 3. 光照优化

#### 光源数量控制
```javascript
// ✅ 限制实时光源数量
class LightManager {
    constructor(scene, maxLights = 4) {
        this.scene = scene;
        this.maxLights = maxLights;
        this.lights = [];
    }
    
    addLight(light) {
        this.lights.push(light);
        
        if (this.lights.length > this.maxLights) {
            // 移除距离最远的光源
            const camerPos = this.scene.activeCamera.position;
            this.lights.sort((a, b) => {
                const distA = BABYLON.Vector3.Distance(a.position, camerPos);
                const distB = BABYLON.Vector3.Distance(b.position, camerPos);
                return distB - distA;
            });
            
            const removedLight = this.lights.pop();
            removedLight.setEnabled(false);
        }
    }
}

// 使用烘焙光照
function setupBakedLighting(scene) {
    // 禁用实时光照，使用预烘焙的光照贴图
    scene.materials.forEach(material => {
        if (material.lightmapTexture) {
            material.disableLighting = true;
            material.emissiveTexture = material.lightmapTexture;
        }
    });
}
```

### 4. 阴影优化

```javascript
// ✅ 阴影分辨率优化
function setupOptimizedShadows(light, scene) {
    const shadowGenerator = new BABYLON.ShadowGenerator(1024, light); // 适中分辨率
    
    // 只为重要对象生成阴影
    const importantMeshes = scene.meshes.filter(mesh => 
        mesh.name.includes('important') || mesh.getBoundingInfo().boundingBox.volume > 10
    );
    
    shadowGenerator.addShadowCaster(importantMeshes);
    
    // 使用 PCF 阴影减少锯齿
    shadowGenerator.usePercentageCloserFiltering = true;
    shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_MEDIUM;
    
    return shadowGenerator;
}

// 级联阴影贴图 (CSM) 用于大场景
function setupCSM(directionalLight, scene) {
    const csm = new BABYLON.CascadedShadowGenerator(1024, directionalLight);
    csm.numCascades = 3;
    csm.stabilizeCascades = true;
    
    return csm;
}
```

---

## 🎯 场景管理优化

### 1. 视锥裁剪

```javascript
// ✅ 使用八叉树进行空间分割
function setupOctree(scene) {
    const octree = scene.createOrUpdateSelectionOctree();
    
    // 定期更新八叉树
    scene.registerBeforeRender(() => {
        if (scene.getFrameId() % 60 === 0) { // 每60帧更新一次
            scene.createOrUpdateSelectionOctree();
        }
    });
    
    return octree;
}

// 距离裁剪
class DistanceCulling {
    constructor(scene, camera, maxDistance = 100) {
        this.scene = scene;
        this.camera = camera;
        this.maxDistance = maxDistance;
        this.originalRenderingGroupIds = new Map();
    }
    
    update() {
        const cameraPosition = this.camera.position;
        
        this.scene.meshes.forEach(mesh => {
            const distance = BABYLON.Vector3.Distance(mesh.position, cameraPosition);
            
            if (distance > this.maxDistance) {
                mesh.setEnabled(false);
            } else if (!mesh.isEnabled()) {
                mesh.setEnabled(true);
            }
        });
    }
}
```

### 2. LOD (Level of Detail) 系统

```javascript
// ✅ 完整的 LOD 系统
class LODManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.lodGroups = new Map();
    }
    
    createLODGroup(name, meshes, distances) {
        const lodMesh = new BABYLON.LOD(name, this.scene);
        
        meshes.forEach((mesh, index) => {
            lodMesh.addLODLevel(distances[index], mesh);
        });
        
        this.lodGroups.set(name, lodMesh);
        return lodMesh;
    }
    
    // 动态LOD：基于性能自动调整
    setupDynamicLOD() {
        let lastFrameTime = performance.now();
        
        this.scene.registerBeforeRender(() => {
            const currentTime = performance.now();
            const deltaTime = currentTime - lastFrameTime;
            const fps = 1000 / deltaTime;
            
            if (fps < 30) {
                // 性能不佳，降低LOD质量
                this.lodGroups.forEach(lod => {
                    lod._distance *= 0.8; // 更早切换到低质量模型
                });
            } else if (fps > 50) {
                // 性能良好，提高LOD质量
                this.lodGroups.forEach(lod => {
                    lod._distance *= 1.1; // 更晚切换到低质量模型
                });
            }
            
            lastFrameTime = currentTime;
        });
    }
}
```

### 3. 流式加载

```javascript
// ✅ 场景流式加载
class StreamingManager {
    constructor(scene) {
        this.scene = scene;
        this.loadedChunks = new Set();
        this.loadQueue = [];
        this.maxConcurrentLoads = 3;
        this.currentLoads = 0;
    }
    
    async loadChunk(chunkId, position) {
        if (this.loadedChunks.has(chunkId) || this.currentLoads >= this.maxConcurrentLoads) {
            return;
        }
        
        this.currentLoads++;
        
        try {
            const result = await BABYLON.SceneLoader.ImportMeshAsync(
                "", 
                `chunks/`, 
                `${chunkId}.babylon`, 
                this.scene
            );
            
            // 定位到正确位置
            result.meshes.forEach(mesh => {
                mesh.position.addInPlace(position);
            });
            
            this.loadedChunks.add(chunkId);
            console.log(`Loaded chunk: ${chunkId}`);
            
        } catch (error) {
            console.error(`Failed to load chunk ${chunkId}:`, error);
        } finally {
            this.currentLoads--;
            this.processQueue();
        }
    }
    
    unloadChunk(chunkId) {
        const meshesToRemove = this.scene.meshes.filter(
            mesh => mesh.metadata?.chunkId === chunkId
        );
        
        meshesToRemove.forEach(mesh => mesh.dispose());
        this.loadedChunks.delete(chunkId);
        console.log(`Unloaded chunk: ${chunkId}`);
    }
    
    updateStreaming(cameraPosition, loadRadius = 50, unloadRadius = 100) {
        // 基于摄像机位置决定加载/卸载哪些区块
        const chunkSize = 25;
        const chunkX = Math.floor(cameraPosition.x / chunkSize);
        const chunkZ = Math.floor(cameraPosition.z / chunkSize);
        
        // 加载附近区块
        for (let x = chunkX - 2; x <= chunkX + 2; x++) {
            for (let z = chunkZ - 2; z <= chunkZ + 2; z++) {
                const chunkId = `${x}_${z}`;
                const chunkPosition = new BABYLON.Vector3(x * chunkSize, 0, z * chunkSize);
                
                if (BABYLON.Vector3.Distance(cameraPosition, chunkPosition) <= loadRadius) {
                    this.loadChunk(chunkId, chunkPosition);
                }
            }
        }
        
        // 卸载远距离区块
        this.loadedChunks.forEach(chunkId => {
            const [x, z] = chunkId.split('_').map(Number);
            const chunkPosition = new BABYLON.Vector3(x * chunkSize, 0, z * chunkSize);
            
            if (BABYLON.Vector3.Distance(cameraPosition, chunkPosition) > unloadRadius) {
                this.unloadChunk(chunkId);
            }
        });
    }
}
```

---

## 💾 内存管理

### 1. 资源释放

```javascript
// ✅ 完善的资源管理器
class ResourceManager {
    constructor() {
        this.textures = new Set();
        this.materials = new Set();
        this.meshes = new Set();
        this.sounds = new Set();
    }
    
    trackResource(resource) {
        if (resource instanceof BABYLON.Texture) {
            this.textures.add(resource);
        } else if (resource instanceof BABYLON.Material) {
            this.materials.add(resource);
        } else if (resource instanceof BABYLON.Mesh) {
            this.meshes.add(resource);
        }
    }
    
    disposeAll() {
        this.textures.forEach(texture => texture.dispose());
        this.materials.forEach(material => material.dispose());
        this.meshes.forEach(mesh => mesh.dispose());
        this.sounds.forEach(sound => sound.dispose());
        
        this.textures.clear();
        this.materials.clear();
        this.meshes.clear();
        this.sounds.clear();
    }
    
    getMemoryUsage() {
        return {
            textures: this.textures.size,
            materials: this.materials.size,
            meshes: this.meshes.size,
            sounds: this.sounds.size
        };
    }
}

// 自动内存监控
class MemoryMonitor {
    constructor(maxMemoryMB = 500) {
        this.maxMemoryMB = maxMemoryMB;
        this.checkInterval = setInterval(() => this.checkMemory(), 5000);
    }
    
    checkMemory() {
        if (performance.memory) {
            const usedMB = performance.memory.usedJSHeapSize / (1024 * 1024);
            
            if (usedMB > this.maxMemoryMB) {
                console.warn(`Memory usage high: ${usedMB.toFixed(2)}MB`);
                this.triggerGarbageCollection();
            }
        }
    }
    
    triggerGarbageCollection() {
        // 清理未使用的缓存
        BABYLON.Engine.CleanCache();
        
        // 强制垃圾回收（仅在支持的浏览器中）
        if (window.gc) {
            window.gc();
        }
    }
    
    dispose() {
        clearInterval(this.checkInterval);
    }
}
```

### 2. 纹理压缩和共享

```javascript
// ✅ 纹理池管理
class TexturePool {
    constructor() {
        this.pool = new Map();
        this.usage = new Map();
    }
    
    getTexture(url, scene, options = {}) {
        const key = `${url}_${JSON.stringify(options)}`;
        
        if (!this.pool.has(key)) {
            const texture = new BABYLON.Texture(url, scene, options);
            this.pool.set(key, texture);
            this.usage.set(key, 0);
        }
        
        this.usage.set(key, this.usage.get(key) + 1);
        return this.pool.get(key);
    }
    
    releaseTexture(url, options = {}) {
        const key = `${url}_${JSON.stringify(options)}`;
        const count = this.usage.get(key) - 1;
        
        if (count <= 0) {
            const texture = this.pool.get(key);
            texture?.dispose();
            this.pool.delete(key);
            this.usage.delete(key);
        } else {
            this.usage.set(key, count);
        }
    }
}
```

---

## 📱 移动端优化

### 1. 移动设备检测和适配

```javascript
// ✅ 移动端性能配置
class MobileOptimizer {
    constructor(scene, engine) {
        this.scene = scene;
        this.engine = engine;
        this.isMobile = this.detectMobile();
        
        if (this.isMobile) {
            this.applyMobileOptimizations();
        }
    }
    
    detectMobile() {
        return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    applyMobileOptimizations() {
        // 降低渲染分辨率
        this.engine.setHardwareScalingLevel(0.7);
        
        // 禁用抗锯齿
        this.engine.disableOfflineSupport = true;
        
        // 简化材质
        this.scene.materials.forEach(material => {
            if (material instanceof BABYLON.PBRMaterial) {
                material.roughness = 1.0;
                material.metallicFactor = 0.0;
                material.environmentIntensity = 0.3;
            }
        });
        
        // 限制光源数量
        const lights = this.scene.lights.slice(0, 2);
        this.scene.lights.forEach((light, index) => {
            if (index >= 2) {
                light.setEnabled(false);
            }
        });
        
        // 禁用阴影
        this.scene.lights.forEach(light => {
            if (light.getShadowGenerator()) {
                light.getShadowGenerator().dispose();
            }
        });
        
        console.log('Applied mobile optimizations');
    }
    
    optimizeForDevice() {
        const memory = performance.memory?.jsHeapSizeLimit || 0;
        const memoryMB = memory / (1024 * 1024);
        
        if (memoryMB < 500) {
            // 低内存设备
            this.engine.setHardwareScalingLevel(0.5);
            this.scene.freezeActiveMeshes();
        } else if (memoryMB < 1000) {
            // 中等内存设备
            this.engine.setHardwareScalingLevel(0.7);
        }
        
        // GPU 性能检测
        const gl = this.engine.getGlInfo();
        const renderer = gl.renderer?.toLowerCase() || '';
        
        if (renderer.includes('adreno') || renderer.includes('mali')) {
            // 移动 GPU，进一步优化
            this.scene.skipPointerMovePicking = true;
            this.scene.constantlyUpdateMeshUnderPointer = false;
        }
    }
}
```

### 2. 触摸优化

```javascript
// ✅ 触摸性能优化
function optimizeTouchControls(scene, camera) {
    // 减少触摸事件频率
    let lastTouchTime = 0;
    const touchThrottle = 16; // 约60fps
    
    scene.onPointerObservable.add((pointerInfo) => {
        const now = performance.now();
        if (now - lastTouchTime < touchThrottle) {
            return;
        }
        lastTouchTime = now;
        
        // 处理触摸事件
        switch (pointerInfo.type) {
            case BABYLON.PointerEventTypes.POINTERDOWN:
                handleTouchStart(pointerInfo);
                break;
            case BABYLON.PointerEventTypes.POINTERMOVE:
                handleTouchMove(pointerInfo);
                break;
        }
    });
    
    // 禁用不必要的拾取检测
    scene.skipPointerMovePicking = true;
    scene.constantlyUpdateMeshUnderPointer = false;
}
```

---

## 🔍 性能监控

### 1. 实时性能监控

```javascript
// ✅ 完整的性能监控系统
class PerformanceProfiler {
    constructor(scene, engine) {
        this.scene = scene;
        this.engine = engine;
        this.metrics = {
            fps: [],
            frameTime: [],
            drawCalls: [],
            triangles: [],
            memory: []
        };
        this.isRecording = false;
    }
    
    startProfiling() {
        this.isRecording = true;
        this.lastFrameTime = performance.now();
        
        this.scene.registerBeforeRender(() => {
            if (this.isRecording) {
                this.recordFrame();
            }
        });
    }
    
    recordFrame() {
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        const fps = Math.round(this.engine.getFps());
        const drawCalls = this.engine.getGlInfo().drawCalls || 0;
        const triangles = this.getTotalTriangles();
        const memory = this.getMemoryUsage();
        
        this.metrics.fps.push(fps);
        this.metrics.frameTime.push(deltaTime);
        this.metrics.drawCalls.push(drawCalls);
        this.metrics.triangles.push(triangles);
        this.metrics.memory.push(memory);
        
        // 保持最近1000帧的数据
        Object.keys(this.metrics).forEach(key => {
            if (this.metrics[key].length > 1000) {
                this.metrics[key].shift();
            }
        });
    }
    
    generateReport() {
        const report = {};
        
        Object.keys(this.metrics).forEach(key => {
            const data = this.metrics[key];
            if (data.length > 0) {
                report[key] = {
                    average: data.reduce((a, b) => a + b, 0) / data.length,
                    min: Math.min(...data),
                    max: Math.max(...data),
                    current: data[data.length - 1]
                };
            }
        });
        
        return report;
    }
    
    getTotalTriangles() {
        return this.scene.getActiveMeshes().data.reduce((total, mesh) => {
            if (mesh.getTotalVertices) {
                return total + mesh.getTotalVertices() / 3;
            }
            return total;
        }, 0);
    }
    
    getMemoryUsage() {
        if (performance.memory) {
            return performance.memory.usedJSHeapSize / (1024 * 1024); // MB
        }
        return 0;
    }
    
    exportData() {
        const report = this.generateReport();
        const blob = new Blob([JSON.stringify(report, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `performance_report_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}
```

### 2. 性能预算系统

```javascript
// ✅ 性能预算管理
class PerformanceBudget {
    constructor(scene, engine) {
        this.scene = scene;
        this.engine = engine;
        this.budgets = {
            maxTriangles: 100000,
            maxDrawCalls: 100,
            maxTextures: 50,
            maxMaterials: 20,
            minFPS: 30
        };
        this.violations = [];
    }
    
    checkBudgets() {
        const current = {
            triangles: this.getTotalTriangles(),
            drawCalls: this.engine.getGlInfo().drawCalls || 0,
            textures: this.scene.textures.length,
            materials: this.scene.materials.length,
            fps: Math.round(this.engine.getFps())
        };
        
        const violations = [];
        
        if (current.triangles > this.budgets.maxTriangles) {
            violations.push(`Triangle count exceeded: ${current.triangles}/${this.budgets.maxTriangles}`);
        }
        
        if (current.drawCalls > this.budgets.maxDrawCalls) {
            violations.push(`Draw calls exceeded: ${current.drawCalls}/${this.budgets.maxDrawCalls}`);
        }
        
        if (current.textures > this.budgets.maxTextures) {
            violations.push(`Texture count exceeded: ${current.textures}/${this.budgets.maxTextures}`);
        }
        
        if (current.fps < this.budgets.minFPS) {
            violations.push(`FPS below target: ${current.fps}/${this.budgets.minFPS}`);
        }
        
        if (violations.length > 0) {
            console.warn('Performance budget violations:', violations);
            this.violations.push({
                timestamp: Date.now(),
                violations: violations,
                metrics: current
            });
        }
        
        return violations.length === 0;
    }
    
    getTotalTriangles() {
        return this.scene.meshes.reduce((total, mesh) => {
            if (mesh.getTotalVertices && mesh.isEnabled()) {
                return total + mesh.getTotalVertices() / 3;
            }
            return total;
        }, 0);
    }
    
    getViolationReport() {
        return {
            totalViolations: this.violations.length,
            recentViolations: this.violations.slice(-10),
            budgets: this.budgets
        };
    }
}
```

---

## 📋 优化检查清单

### 渲染优化 ✅
- [ ] 网格多边形数量合理 (< 10,000 三角形/物体)
- [ ] 使用网格合并减少绘制调用
- [ ] 实现实例化渲染
- [ ] 应用LOD系统
- [ ] 配置视锥裁剪

### 材质和纹理 ✅
- [ ] 纹理尺寸优化 (最大 1024x1024)
- [ ] 使用纹理压缩格式
- [ ] 共享材质避免重复
- [ ] 简化移动端材质
- [ ] 实现纹理流式加载

### 光照和阴影 ✅
- [ ] 限制实时光源数量 (≤ 4个)
- [ ] 优化阴影分辨率
- [ ] 使用烘焙光照
- [ ] 移动端禁用阴影
- [ ] 实现动态光照管理

### 内存管理 ✅
- [ ] 实现资源释放机制
- [ ] 监控内存使用情况
- [ ] 使用对象池模式
- [ ] 定期垃圾回收
- [ ] 限制同时加载资源数量

### 移动端特化 ✅
- [ ] 检测移动设备并应用优化
- [ ] 降低渲染分辨率
- [ ] 简化材质和光照
- [ ] 优化触摸控制
- [ ] 处理内存限制

### 性能监控 ✅
- [ ] 实现FPS监控
- [ ] 跟踪绘制调用数量
- [ ] 监控内存使用
- [ ] 设置性能预算
- [ ] 定期生成性能报告

---

**记住**: 性能优化是一个持续的过程。始终基于实际测量数据进行优化，在视觉质量和性能之间找到平衡点。不同的应用场景可能需要不同的优化策略。
