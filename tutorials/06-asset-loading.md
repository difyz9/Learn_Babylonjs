# 06 - 资源加载

## 📚 本章目标

学习如何在 Babylon.js 中加载和管理各种 3D 资源，包括模型、纹理、音频等，掌握资源优化和异步加载技术。

## 🎯 学习内容

- 3D 模型加载
- 纹理和材质加载
- 音频资源管理
- 异步加载策略
- 资源缓存和优化
- 进度监控
- 错误处理

---

## 1. 3D 模型加载基础

### 1.1 支持的文件格式

```javascript
// Babylon.js 支持的主要 3D 格式
const supportedFormats = {
    // 推荐格式
    'glTF/GLB': '最佳性能，支持 PBR、动画、骨骼',
    'Babylon': 'Babylon.js 原生格式，最完整支持',
    
    // 其他格式
    'OBJ': '简单几何体，无动画',
    'STL': '3D 打印常用，只有几何体',
    'PLY': '点云和网格',
    '3DS': '传统 3D 格式',
    'FBX': '需要转换器',
    'Collada': '需要转换器'
};
```

### 1.2 基础模型加载

```javascript
// 使用 ImportMeshAsync 加载模型
async function loadModel() {
    try {
        const result = await BABYLON.SceneLoader.ImportMeshAsync(
            "", // 网格名称过滤器，空字符串表示加载所有
            "models/", // 模型文件夹路径
            "myModel.glb", // 文件名
            scene // 目标场景
        );
        
        console.log("加载成功:", result);
        console.log("网格数量:", result.meshes.length);
        console.log("材质数量:", result.materials.length);
        console.log("骨骼数量:", result.skeletons.length);
        console.log("动画组:", result.animationGroups);
        
        // 处理加载的模型
        processLoadedModel(result);
        
        return result;
    } catch (error) {
        console.error("模型加载失败:", error);
        showErrorMessage("无法加载 3D 模型");
    }
}

function processLoadedModel(result) {
    // 设置模型位置和缩放
    if (result.meshes.length > 0) {
        const rootMesh = result.meshes[0];
        rootMesh.position = new BABYLON.Vector3(0, 0, 0);
        rootMesh.scaling = new BABYLON.Vector3(1, 1, 1);
        
        // 计算包围盒
        const boundingInfo = rootMesh.getHierarchyBoundingVectors();
        const size = boundingInfo.max.subtract(boundingInfo.min);
        console.log("模型尺寸:", size);
        
        // 自动调整摄像机位置
        adjustCameraToModel(boundingInfo);
    }
    
    // 播放动画
    if (result.animationGroups.length > 0) {
        result.animationGroups[0].start(true); // 循环播放第一个动画
    }
}
```

### 1.3 选择性加载

```javascript
// 只加载特定网格
async function loadSpecificMeshes() {
    const result = await BABYLON.SceneLoader.ImportMeshAsync(
        ["Mesh1", "Mesh2"], // 只加载这些网格
        "models/",
        "complex_model.glb",
        scene
    );
    
    return result;
}

// 加载单个网格
async function loadSingleMesh() {
    const result = await BABYLON.SceneLoader.ImportMeshAsync(
        "Character", // 只加载名为 "Character" 的网格
        "models/",
        "game_assets.glb",
        scene
    );
    
    return result;
}
```

---

## 2. 异步加载和进度监控

### 2.1 带进度回调的加载

```javascript
// 创建进度监控器
class LoadingManager {
    constructor() {
        this.loadingItems = new Map();
        this.totalItems = 0;
        this.loadedItems = 0;
        this.onProgressCallback = null;
        this.onCompleteCallback = null;
    }
    
    async loadModelWithProgress(url, filename) {
        return new Promise((resolve, reject) => {
            const itemId = `${url}${filename}`;
            this.loadingItems.set(itemId, { loaded: 0, total: 1 });
            this.totalItems++;
            
            BABYLON.SceneLoader.ImportMesh(
                "", url, filename, scene,
                (meshes, particleSystems, skeletons, animationGroups) => {
                    // 加载完成
                    this.loadedItems++;
                    this.loadingItems.delete(itemId);
                    this.updateProgress();
                    
                    resolve({
                        meshes,
                        particleSystems,
                        skeletons,
                        animationGroups
                    });
                },
                (progress) => {
                    // 进度更新
                    if (progress.lengthComputable) {
                        const item = this.loadingItems.get(itemId);
                        if (item) {
                            item.loaded = progress.loaded;
                            item.total = progress.total;
                            this.updateProgress();
                        }
                    }
                },
                (scene, message, exception) => {
                    // 加载失败
                    this.loadingItems.delete(itemId);
                    reject(new Error(`加载失败: ${message}`));
                }
            );
        });
    }
    
    updateProgress() {
        let totalLoaded = this.loadedItems;
        let totalSize = this.totalItems;
        
        // 计算当前加载项的进度
        for (const item of this.loadingItems.values()) {
            if (item.total > 0) {
                totalLoaded += item.loaded / item.total;
            }
        }
        
        const progress = totalSize > 0 ? totalLoaded / totalSize : 0;
        
        if (this.onProgressCallback) {
            this.onProgressCallback(progress);
        }
        
        if (progress >= 1 && this.onCompleteCallback) {
            this.onCompleteCallback();
        }
    }
    
    setProgressCallback(callback) {
        this.onProgressCallback = callback;
    }
    
    setCompleteCallback(callback) {
        this.onCompleteCallback = callback;
    }
}

// 使用加载管理器
const loadingManager = new LoadingManager();

// 设置进度回调
loadingManager.setProgressCallback((progress) => {
    console.log(`加载进度: ${(progress * 100).toFixed(1)}%`);
    updateProgressBar(progress);
});

loadingManager.setCompleteCallback(() => {
    console.log("所有资源加载完成!");
    hideProgressBar();
});

// 创建进度条 UI
function createProgressBar() {
    const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
    
    // 背景
    const background = new BABYLON.GUI.Rectangle();
    background.background = "rgba(0, 0, 0, 0.8)";
    background.thickness = 0;
    
    // 进度条容器
    const progressContainer = new BABYLON.GUI.Rectangle();
    progressContainer.widthInPixels = 400;
    progressContainer.heightInPixels = 20;
    progressContainer.cornerRadius = 10;
    progressContainer.color = "white";
    progressContainer.thickness = 2;
    progressContainer.background = "rgba(255, 255, 255, 0.1)";
    
    // 进度条
    const progressBar = new BABYLON.GUI.Rectangle();
    progressBar.widthInPixels = 0;
    progressBar.heightInPixels = 16;
    progressBar.cornerRadius = 8;
    progressBar.background = "#4CAF50";
    progressBar.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    progressBar.thickness = 0;
    
    // 文本
    const progressText = new BABYLON.GUI.TextBlock();
    progressText.text = "加载中... 0%";
    progressText.color = "white";
    progressText.fontSize = 16;
    progressText.topInPixels = -40;
    
    progressContainer.addControl(progressBar);
    background.addControl(progressContainer);
    background.addControl(progressText);
    advancedTexture.addControl(background);
    
    return { background, progressBar, progressText };
}

let progressUI = null;

function updateProgressBar(progress) {
    if (!progressUI) {
        progressUI = createProgressBar();
    }
    
    const percentage = Math.round(progress * 100);
    progressUI.progressBar.widthInPixels = 400 * progress;
    progressUI.progressText.text = `加载中... ${percentage}%`;
}

function hideProgressBar() {
    if (progressUI) {
        progressUI.background.dispose();
        progressUI = null;
    }
}
```

### 2.2 批量加载资源

```javascript
// 批量加载多个模型
async function loadMultipleModels() {
    const modelList = [
        { url: "models/characters/", filename: "hero.glb" },
        { url: "models/environment/", filename: "level1.glb" },
        { url: "models/props/", filename: "weapons.glb" },
        { url: "models/effects/", filename: "particles.glb" }
    ];
    
    try {
        // 并行加载所有模型
        const loadPromises = modelList.map(model => 
            loadingManager.loadModelWithProgress(model.url, model.filename)
        );
        
        const results = await Promise.all(loadPromises);
        
        console.log("所有模型加载完成:", results);
        return results;
        
    } catch (error) {
        console.error("批量加载失败:", error);
    }
}

// 顺序加载（一个接一个）
async function loadModelsSequentially() {
    const modelList = [
        { url: "models/", filename: "model1.glb" },
        { url: "models/", filename: "model2.glb" },
        { url: "models/", filename: "model3.glb" }
    ];
    
    const results = [];
    
    for (const model of modelList) {
        try {
            const result = await loadingManager.loadModelWithProgress(
                model.url, 
                model.filename
            );
            results.push(result);
            console.log(`已加载: ${model.filename}`);
        } catch (error) {
            console.error(`加载失败: ${model.filename}`, error);
        }
    }
    
    return results;
}
```

---

## 3. 纹理加载和管理

### 3.1 基础纹理加载

```javascript
// 异步加载纹理
async function loadTexture(url) {
    try {
        const texture = new BABYLON.Texture(url, scene);
        
        // 等待纹理加载完成
        await new Promise((resolve, reject) => {
            texture.onLoadObservable.add(() => {
                console.log("纹理加载完成:", url);
                resolve();
            });
            
            texture.onErrorObservable.add(() => {
                reject(new Error(`纹理加载失败: ${url}`));
            });
        });
        
        return texture;
    } catch (error) {
        console.error("纹理加载错误:", error);
        return null;
    }
}

// 加载多种纹理类型
async function loadPBRTextures(basePath) {
    const textures = {};
    
    try {
        // 并行加载所有纹理
        const [diffuse, normal, roughness, metallic, ao] = await Promise.all([
            loadTexture(`${basePath}_diffuse.jpg`),
            loadTexture(`${basePath}_normal.jpg`),
            loadTexture(`${basePath}_roughness.jpg`),
            loadTexture(`${basePath}_metallic.jpg`),
            loadTexture(`${basePath}_ao.jpg`)
        ]);
        
        return {
            diffuse,
            normal,
            roughness,
            metallic,
            ao
        };
    } catch (error) {
        console.error("PBR 纹理加载失败:", error);
        return null;
    }
}

// 创建 PBR 材质
function createPBRMaterial(name, textures) {
    const material = new BABYLON.PBRMaterial(name, scene);
    
    if (textures.diffuse) {
        material.baseTexture = textures.diffuse;
    }
    
    if (textures.normal) {
        material.bumpTexture = textures.normal;
    }
    
    if (textures.roughness) {
        material.metallicRoughnessTexture = textures.roughness;
        material.useRoughnessFromMetallicTextureGreen = true;
        material.useMetallnessFromMetallicTextureBlue = true;
    }
    
    if (textures.ao) {
        material.ambientTexture = textures.ao;
    }
    
    return material;
}
```

### 3.2 纹理优化

```javascript
// 纹理压缩和优化
function optimizeTexture(texture) {
    // 设置纹理格式
    texture.format = BABYLON.Engine.TEXTUREFORMAT_RGB;
    
    // 启用 mipmaps
    texture.generateMipMaps = true;
    
    // 设置过滤模式
    texture.minFilter = BABYLON.Texture.LINEAR_MIPMAP_LINEAR;
    texture.magFilter = BABYLON.Texture.LINEAR;
    
    // 设置包装模式
    texture.wrapU = BABYLON.Texture.REPEAT_ADDRESSMODE;
    texture.wrapV = BABYLON.Texture.REPEAT_ADDRESSMODE;
    
    // 各向异性过滤
    texture.anisotropicFilteringLevel = 4;
    
    return texture;
}

// 动态纹理加载
class TextureManager {
    constructor() {
        this.textureCache = new Map();
        this.loadingPromises = new Map();
    }
    
    async getTexture(url) {
        // 检查缓存
        if (this.textureCache.has(url)) {
            return this.textureCache.get(url);
        }
        
        // 检查是否正在加载
        if (this.loadingPromises.has(url)) {
            return this.loadingPromises.get(url);
        }
        
        // 开始加载
        const loadingPromise = this.loadTextureFromURL(url);
        this.loadingPromises.set(url, loadingPromise);
        
        try {
            const texture = await loadingPromise;
            this.textureCache.set(url, texture);
            this.loadingPromises.delete(url);
            return texture;
        } catch (error) {
            this.loadingPromises.delete(url);
            throw error;
        }
    }
    
    async loadTextureFromURL(url) {
        return new Promise((resolve, reject) => {
            const texture = new BABYLON.Texture(url, scene);
            
            texture.onLoadObservable.add(() => {
                optimizeTexture(texture);
                resolve(texture);
            });
            
            texture.onErrorObservable.add(() => {
                reject(new Error(`Failed to load texture: ${url}`));
            });
        });
    }
    
    disposeTexture(url) {
        if (this.textureCache.has(url)) {
            const texture = this.textureCache.get(url);
            texture.dispose();
            this.textureCache.delete(url);
        }
    }
    
    clearCache() {
        for (const texture of this.textureCache.values()) {
            texture.dispose();
        }
        this.textureCache.clear();
    }
}

// 使用纹理管理器
const textureManager = new TextureManager();
```

---

## 4. 音频资源管理

### 4.1 音频加载

```javascript
// 加载和播放音频
class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.sounds = new Map();
        this.musicVolume = 1.0;
        this.sfxVolume = 1.0;
    }
    
    async loadSound(name, url, options = {}) {
        try {
            return new Promise((resolve, reject) => {
                const sound = new BABYLON.Sound(
                    name,
                    url,
                    this.scene,
                    () => {
                        // 加载完成
                        this.sounds.set(name, sound);
                        console.log(`音频加载完成: ${name}`);
                        resolve(sound);
                    },
                    {
                        ...options,
                        volume: options.volume || 1.0,
                        loop: options.loop || false,
                        autoplay: options.autoplay || false
                    }
                );
                
                sound.onError = (error) => {
                    reject(new Error(`音频加载失败: ${name} - ${error}`));
                };
            });
        } catch (error) {
            console.error("音频加载错误:", error);
            return null;
        }
    }
    
    async loadBGM(name, url) {
        return this.loadSound(name, url, {
            loop: true,
            volume: this.musicVolume
        });
    }
    
    async loadSFX(name, url) {
        return this.loadSound(name, url, {
            loop: false,
            volume: this.sfxVolume
        });
    }
    
    playSound(name) {
        const sound = this.sounds.get(name);
        if (sound) {
            sound.play();
        } else {
            console.warn(`音频不存在: ${name}`);
        }
    }
    
    stopSound(name) {
        const sound = this.sounds.get(name);
        if (sound) {
            sound.stop();
        }
    }
    
    pauseSound(name) {
        const sound = this.sounds.get(name);
        if (sound) {
            sound.pause();
        }
    }
    
    setMusicVolume(volume) {
        this.musicVolume = volume;
        // 更新所有音乐音量
        for (const [name, sound] of this.sounds) {
            if (sound.loop) { // 假设循环音频是音乐
                sound.setVolume(volume);
            }
        }
    }
    
    setSFXVolume(volume) {
        this.sfxVolume = volume;
        // 更新所有音效音量
        for (const [name, sound] of this.sounds) {
            if (!sound.loop) { // 假设非循环音频是音效
                sound.setVolume(volume);
            }
        }
    }
}

// 使用音频管理器
const audioManager = new AudioManager(scene);

// 加载音频资源
async function loadAudioAssets() {
    try {
        await Promise.all([
            audioManager.loadBGM("menu_music", "audio/menu_background.mp3"),
            audioManager.loadBGM("game_music", "audio/game_background.mp3"),
            audioManager.loadSFX("click", "audio/button_click.wav"),
            audioManager.loadSFX("explosion", "audio/explosion.wav"),
            audioManager.loadSFX("pickup", "audio/item_pickup.wav")
        ]);
        
        console.log("所有音频加载完成");
    } catch (error) {
        console.error("音频加载失败:", error);
    }
}
```

### 4.2 3D 空间音频

```javascript
// 创建 3D 空间音频
function createSpatialAudio(name, url, position) {
    const sound = new BABYLON.Sound(
        name,
        url,
        scene,
        null,
        {
            loop: true,
            autoplay: true,
            spatialSound: true,
            maxDistance: 100,
            rolloffFactor: 1,
            refDistance: 10,
            distanceModel: "exponential"
        }
    );
    
    // 设置音频位置
    sound.setPosition(position);
    
    return sound;
}

// 将音频附加到网格
function attachSoundToMesh(sound, mesh) {
    sound.attachToMesh(mesh);
}

// 创建音频区域
function createAudioZone(name, url, center, radius) {
    const sound = new BABYLON.Sound(
        name,
        url,
        scene,
        null,
        {
            loop: true,
            autoplay: false,
            spatialSound: true,
            maxDistance: radius
        }
    );
    
    sound.setPosition(center);
    
    // 检查玩家是否进入音频区域
    scene.registerBeforeRender(() => {
        const playerPos = scene.activeCamera.position;
        const distance = BABYLON.Vector3.Distance(playerPos, center);
        
        if (distance <= radius && !sound.isPlaying) {
            sound.play();
        } else if (distance > radius && sound.isPlaying) {
            sound.stop();
        }
    });
    
    return sound;
}
```

---

## 5. 资源缓存和预加载

### 5.1 资源缓存系统

```javascript
class ResourceCache {
    constructor() {
        this.cache = new Map();
        this.metadata = new Map();
    }
    
    set(key, resource, metadata = {}) {
        this.cache.set(key, resource);
        this.metadata.set(key, {
            lastAccessed: Date.now(),
            size: metadata.size || 0,
            type: metadata.type || 'unknown',
            ...metadata
        });
    }
    
    get(key) {
        if (this.cache.has(key)) {
            // 更新访问时间
            const meta = this.metadata.get(key);
            if (meta) {
                meta.lastAccessed = Date.now();
            }
            return this.cache.get(key);
        }
        return null;
    }
    
    has(key) {
        return this.cache.has(key);
    }
    
    delete(key) {
        const resource = this.cache.get(key);
        if (resource && typeof resource.dispose === 'function') {
            resource.dispose();
        }
        this.cache.delete(key);
        this.metadata.delete(key);
    }
    
    clear() {
        for (const resource of this.cache.values()) {
            if (resource && typeof resource.dispose === 'function') {
                resource.dispose();
            }
        }
        this.cache.clear();
        this.metadata.clear();
    }
    
    // LRU 清理
    cleanupLRU(maxItems = 100) {
        if (this.cache.size <= maxItems) return;
        
        const items = Array.from(this.metadata.entries())
            .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
        
        const itemsToRemove = items.slice(0, this.cache.size - maxItems);
        
        itemsToRemove.forEach(([key]) => {
            this.delete(key);
        });
    }
    
    getMemoryUsage() {
        let totalSize = 0;
        for (const meta of this.metadata.values()) {
            totalSize += meta.size || 0;
        }
        return totalSize;
    }
}

// 全局资源缓存
const resourceCache = new ResourceCache();
```

### 5.2 预加载系统

```javascript
class PreloadManager {
    constructor() {
        this.preloadQueue = [];
        this.isPreloading = false;
        this.preloadedAssets = new Set();
    }
    
    addToQueue(assetInfo) {
        this.preloadQueue.push(assetInfo);
    }
    
    async preloadAssets(onProgress) {
        if (this.isPreloading) return;
        
        this.isPreloading = true;
        const totalAssets = this.preloadQueue.length;
        let loadedAssets = 0;
        
        try {
            for (const asset of this.preloadQueue) {
                await this.preloadSingleAsset(asset);
                loadedAssets++;
                
                if (onProgress) {
                    onProgress(loadedAssets / totalAssets);
                }
            }
        } finally {
            this.isPreloading = false;
        }
    }
    
    async preloadSingleAsset(asset) {
        const cacheKey = `${asset.type}_${asset.url}`;
        
        if (resourceCache.has(cacheKey)) {
            return resourceCache.get(cacheKey);
        }
        
        let resource;
        
        switch (asset.type) {
            case 'model':
                resource = await this.preloadModel(asset);
                break;
            case 'texture':
                resource = await this.preloadTexture(asset);
                break;
            case 'audio':
                resource = await this.preloadAudio(asset);
                break;
            default:
                console.warn(`未知资源类型: ${asset.type}`);
                return null;
        }
        
        if (resource) {
            resourceCache.set(cacheKey, resource, {
                type: asset.type,
                size: asset.estimatedSize || 0
            });
            this.preloadedAssets.add(cacheKey);
        }
        
        return resource;
    }
    
    async preloadModel(asset) {
        try {
            const result = await BABYLON.SceneLoader.ImportMeshAsync(
                "",
                asset.basePath || "",
                asset.filename,
                scene
            );
            
            // 隐藏预加载的模型
            result.meshes.forEach(mesh => {
                mesh.setEnabled(false);
            });
            
            return result;
        } catch (error) {
            console.error(`模型预加载失败: ${asset.url}`, error);
            return null;
        }
    }
    
    async preloadTexture(asset) {
        return textureManager.getTexture(asset.url);
    }
    
    async preloadAudio(asset) {
        return audioManager.loadSound(asset.name, asset.url, asset.options);
    }
    
    isAssetPreloaded(type, url) {
        const cacheKey = `${type}_${url}`;
        return this.preloadedAssets.has(cacheKey);
    }
}

// 使用预加载管理器
const preloadManager = new PreloadManager();

// 配置预加载资源
function setupPreloading() {
    // 添加模型到预加载队列
    preloadManager.addToQueue({
        type: 'model',
        basePath: 'models/',
        filename: 'character.glb',
        estimatedSize: 5000000 // 5MB
    });
    
    // 添加纹理到预加载队列
    preloadManager.addToQueue({
        type: 'texture',
        url: 'textures/environment.jpg',
        estimatedSize: 2000000 // 2MB
    });
    
    // 添加音频到预加载队列
    preloadManager.addToQueue({
        type: 'audio',
        name: 'background_music',
        url: 'audio/bgm.mp3',
        options: { loop: true },
        estimatedSize: 10000000 // 10MB
    });
}

// 开始预加载
async function startPreloading() {
    setupPreloading();
    
    await preloadManager.preloadAssets((progress) => {
        console.log(`预加载进度: ${(progress * 100).toFixed(1)}%`);
        updateProgressBar(progress);
    });
    
    console.log("预加载完成");
}
```

---

## 6. 错误处理和重试机制

### 6.1 错误处理

```javascript
class AssetLoader {
    constructor() {
        this.retryAttempts = 3;
        this.retryDelay = 1000; // 1秒
        this.fallbackAssets = new Map();
    }
    
    setFallback(assetUrl, fallbackUrl) {
        this.fallbackAssets.set(assetUrl, fallbackUrl);
    }
    
    async loadWithRetry(loadFunction, maxRetries = this.retryAttempts) {
        let lastError;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await loadFunction();
            } catch (error) {
                lastError = error;
                console.warn(`加载失败 (尝试 ${attempt + 1}/${maxRetries + 1}):`, error.message);
                
                if (attempt < maxRetries) {
                    // 等待后重试
                    await this.delay(this.retryDelay * Math.pow(2, attempt));
                }
            }
        }
        
        // 所有重试都失败，尝试加载备用资源
        throw lastError;
    }
    
    async loadModelSafe(url, filename) {
        const loadFunction = () => 
            BABYLON.SceneLoader.ImportMeshAsync("", url, filename, scene);
            
        try {
            return await this.loadWithRetry(loadFunction);
        } catch (error) {
            // 尝试加载备用模型
            const fallbackUrl = this.fallbackAssets.get(url + filename);
            if (fallbackUrl) {
                console.log("使用备用资源:", fallbackUrl);
                return this.loadFallbackModel(fallbackUrl);
            }
            
            // 创建错误占位符
            return this.createErrorPlaceholder();
        }
    }
    
    async loadFallbackModel(fallbackUrl) {
        try {
            return await BABYLON.SceneLoader.ImportMeshAsync("", "", fallbackUrl, scene);
        } catch (error) {
            console.error("备用资源也加载失败:", error);
            return this.createErrorPlaceholder();
        }
    }
    
    createErrorPlaceholder() {
        // 创建简单的错误占位符
        const box = BABYLON.MeshBuilder.CreateBox("errorPlaceholder", { size: 1 }, scene);
        const material = new BABYLON.StandardMaterial("errorMaterial", scene);
        material.diffuseColor = new BABYLON.Color3(1, 0, 0); // 红色
        box.material = material;
        
        return {
            meshes: [box],
            materials: [material],
            skeletons: [],
            animationGroups: []
        };
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 使用安全加载器
const assetLoader = new AssetLoader();

// 设置备用资源
assetLoader.setFallback("models/hero.glb", "models/fallback/simple_character.glb");
assetLoader.setFallback("textures/detailed.jpg", "textures/fallback/simple.jpg");
```

### 6.2 网络状态检测

```javascript
class NetworkManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.connectionQuality = 'unknown';
        
        this.setupNetworkListeners();
        this.detectConnectionQuality();
    }
    
    setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log("网络连接恢复");
            this.onNetworkRestore();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log("网络连接断开");
            this.onNetworkLost();
        });
    }
    
    async detectConnectionQuality() {
        if (!this.isOnline) {
            this.connectionQuality = 'offline';
            return;
        }
        
        try {
            const startTime = Date.now();
            const response = await fetch('data:text/plain,', { method: 'HEAD' });
            const endTime = Date.now();
            const latency = endTime - startTime;
            
            if (latency < 100) {
                this.connectionQuality = 'excellent';
            } else if (latency < 300) {
                this.connectionQuality = 'good';
            } else if (latency < 1000) {
                this.connectionQuality = 'fair';
            } else {
                this.connectionQuality = 'poor';
            }
            
            console.log(`网络质量: ${this.connectionQuality} (延迟: ${latency}ms)`);
        } catch (error) {
            this.connectionQuality = 'poor';
        }
    }
    
    onNetworkRestore() {
        // 重新开始失败的下载
        this.detectConnectionQuality();
    }
    
    onNetworkLost() {
        // 暂停下载，显示离线消息
    }
    
    shouldUseHighQualityAssets() {
        return ['excellent', 'good'].includes(this.connectionQuality);
    }
    
    getRecommendedQuality() {
        switch (this.connectionQuality) {
            case 'excellent':
            case 'good':
                return 'high';
            case 'fair':
                return 'medium';
            case 'poor':
            default:
                return 'low';
        }
    }
}

const networkManager = new NetworkManager();
```

---

## 7. 完整资源加载示例

```html
<!DOCTYPE html>
<html>
<head>
    <title>完整资源加载示例</title>
    <script src="https://cdn.babylonjs.com/babylon.js"></script>
    <script src="https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js"></script>
    <script src="https://cdn.babylonjs.com/gui/babylon.gui.min.js"></script>
    <style>
        html, body { margin: 0; padding: 0; overflow: hidden; }
        canvas { width: 100%; height: 100%; touch-action: none; }
        .loading-overlay {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: white;
            font-family: Arial, sans-serif;
            z-index: 1000;
        }
        .progress-container {
            width: 400px;
            height: 20px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            overflow: hidden;
            margin: 20px 0;
        }
        .progress-bar {
            width: 0%;
            height: 100%;
            background: linear-gradient(90deg, #4CAF50, #8BC34A);
            border-radius: 10px;
            transition: width 0.3s ease;
        }
        .asset-list {
            max-width: 500px;
            margin-top: 20px;
        }
        .asset-item {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .status-loaded { color: #4CAF50; }
        .status-loading { color: #FFC107; }
        .status-error { color: #F44336; }
    </style>
</head>
<body>
    <canvas id="renderCanvas"></canvas>
    
    <div id="loadingOverlay" class="loading-overlay">
        <h2>加载资源中...</h2>
        <div class="progress-container">
            <div id="progressBar" class="progress-bar"></div>
        </div>
        <div id="progressText">0%</div>
        
        <div class="asset-list">
            <h3>资源列表</h3>
            <div id="assetList"></div>
        </div>
    </div>

    <script>
        const canvas = document.getElementById("renderCanvas");
        const engine = new BABYLON.Engine(canvas, true);
        let scene;
        
        // UI 元素
        const loadingOverlay = document.getElementById("loadingOverlay");
        const progressBar = document.getElementById("progressBar");
        const progressText = document.getElementById("progressText");
        const assetList = document.getElementById("assetList");
        
        // 资源列表
        const assetManifest = [
            {
                name: "环境模型",
                type: "model",
                url: "https://playground.babylonjs.com/scenes/",
                filename: "dummy3.babylon",
                size: 1000000
            },
            {
                name: "角色模型", 
                type: "model",
                url: "https://playground.babylonjs.com/scenes/",
                filename: "dummy2.babylon",
                size: 800000
            },
            {
                name: "天空盒纹理",
                type: "texture",
                url: "https://playground.babylonjs.com/textures/skybox.jpg",
                size: 500000
            },
            {
                name: "地面纹理",
                type: "texture", 
                url: "https://playground.babylonjs.com/textures/grass.jpg",
                size: 300000
            }
        ];
        
        class GameAssetLoader {
            constructor() {
                this.loadedAssets = new Map();
                this.loadingProgress = new Map();
                this.totalAssets = 0;
                this.loadedCount = 0;
            }
            
            async loadAllAssets() {
                this.totalAssets = assetManifest.length;
                this.updateAssetList();
                
                try {
                    // 并行加载所有资源
                    const loadPromises = assetManifest.map(asset => 
                        this.loadAsset(asset)
                    );
                    
                    const results = await Promise.all(loadPromises);
                    console.log("所有资源加载完成", results);
                    
                    return results;
                } catch (error) {
                    console.error("资源加载失败", error);
                    throw error;
                }
            }
            
            async loadAsset(asset) {
                this.updateAssetStatus(asset.name, "loading");
                
                try {
                    let result;
                    
                    switch (asset.type) {
                        case "model":
                            result = await this.loadModel(asset);
                            break;
                        case "texture":
                            result = await this.loadTexture(asset);
                            break;
                        default:
                            throw new Error(`未知资源类型: ${asset.type}`);
                    }
                    
                    this.loadedAssets.set(asset.name, result);
                    this.loadedCount++;
                    this.updateAssetStatus(asset.name, "loaded");
                    this.updateProgress();
                    
                    return result;
                } catch (error) {
                    console.error(`资源加载失败: ${asset.name}`, error);
                    this.updateAssetStatus(asset.name, "error");
                    throw error;
                }
            }
            
            async loadModel(asset) {
                return new Promise((resolve, reject) => {
                    BABYLON.SceneLoader.ImportMesh(
                        "", asset.url, asset.filename, scene,
                        (meshes, particleSystems, skeletons, animationGroups) => {
                            resolve({
                                meshes,
                                particleSystems,
                                skeletons,
                                animationGroups
                            });
                        },
                        (progress) => {
                            if (progress.lengthComputable) {
                                const percentage = (progress.loaded / progress.total) * 100;
                                this.updateAssetProgress(asset.name, percentage);
                            }
                        },
                        (scene, message, exception) => {
                            reject(new Error(message));
                        }
                    );
                });
            }
            
            async loadTexture(asset) {
                return new Promise((resolve, reject) => {
                    const texture = new BABYLON.Texture(asset.url, scene);
                    
                    texture.onLoadObservable.add(() => {
                        resolve(texture);
                    });
                    
                    texture.onErrorObservable.add(() => {
                        reject(new Error(`纹理加载失败: ${asset.url}`));
                    });
                });
            }
            
            updateAssetList() {
                assetList.innerHTML = "";
                assetManifest.forEach(asset => {
                    const item = document.createElement("div");
                    item.className = "asset-item";
                    item.innerHTML = `
                        <span>${asset.name}</span>
                        <span id="status-${asset.name}" class="status-loading">等待中...</span>
                    `;
                    assetList.appendChild(item);
                });
            }
            
            updateAssetStatus(assetName, status) {
                const statusElement = document.getElementById(`status-${assetName}`);
                if (statusElement) {
                    statusElement.className = `status-${status}`;
                    switch (status) {
                        case "loading":
                            statusElement.textContent = "加载中...";
                            break;
                        case "loaded":
                            statusElement.textContent = "✓ 完成";
                            break;
                        case "error":
                            statusElement.textContent = "✗ 失败";
                            break;
                    }
                }
            }
            
            updateAssetProgress(assetName, percentage) {
                const statusElement = document.getElementById(`status-${assetName}`);
                if (statusElement) {
                    statusElement.textContent = `${percentage.toFixed(1)}%`;
                }
            }
            
            updateProgress() {
                const progress = this.loadedCount / this.totalAssets;
                const percentage = Math.round(progress * 100);
                
                progressBar.style.width = `${percentage}%`;
                progressText.textContent = `${percentage}%`;
                
                if (progress >= 1) {
                    setTimeout(() => {
                        loadingOverlay.style.display = "none";
                        console.log("所有资源加载完成，开始游戏！");
                    }, 500);
                }
            }
        }
        
        async function createScene() {
            scene = new BABYLON.Scene(engine);
            scene.clearColor = new BABYLON.Color3(0.2, 0.2, 0.3);
            
            // 摄像机
            const camera = new BABYLON.ArcRotateCamera(
                "camera", -Math.PI / 2, Math.PI / 2.5, 10,
                BABYLON.Vector3.Zero(), scene
            );
            camera.attachToCanvas(canvas, true);
            
            // 光源
            const light = new BABYLON.HemisphericLight(
                "light", new BABYLON.Vector3(0, 1, 0), scene
            );
            
            // 加载资源
            const loader = new GameAssetLoader();
            await loader.loadAllAssets();
            
            // 使用加载的资源
            setupScene(loader.loadedAssets);
            
            return scene;
        }
        
        function setupScene(assets) {
            console.log("设置场景，可用资源:", assets);
            
            // 这里可以使用加载的资源来设置场景
            // 例如：放置模型、应用纹理等
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

## 8. 性能优化建议

### 8.1 加载优化

```javascript
// 优化建议
const optimizationTips = {
    // 1. 使用 glTF/GLB 格式
    preferredFormat: "glTF 2.0 (.glb)",
    
    // 2. 纹理优化
    textureOptimization: {
        format: "使用压缩格式 (DXT, ETC, ASTC)",
        size: "合理的尺寸 (2048x2048 或更小)",
        mipmaps: "启用 mipmaps",
        compression: "使用在线压缩工具"
    },
    
    // 3. 模型优化
    modelOptimization: {
        polygons: "减少多边形数量",
        textures: "合并纹理贴图",
        bones: "限制骨骼数量",
        animations: "压缩动画数据"
    },
    
    // 4. 加载策略
    loadingStrategy: {
        preload: "预加载关键资源",
        lazy: "懒加载非关键资源",
        streaming: "流式加载大型资源",
        caching: "缓存常用资源"
    }
};
```

### 8.2 内存管理

```javascript
// 资源释放
function cleanupResources() {
    // 释放未使用的纹理
    textureManager.clearCache();
    
    // 释放未使用的网格
    scene.meshes.forEach(mesh => {
        if (mesh.metadata && mesh.metadata.canDispose) {
            mesh.dispose();
        }
    });
    
    // 释放材质
    scene.materials.forEach(material => {
        if (material.metadata && material.metadata.canDispose) {
            material.dispose();
        }
    });
    
    // 强制垃圾回收
    if (window.gc) {
        window.gc();
    }
}

// 监控内存使用
function monitorMemoryUsage() {
    if (performance.memory) {
        const memory = performance.memory;
        console.log({
            used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
            total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
            limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
        });
    }
}
```

---

## 9. 下一步

完成本章学习后，你应该掌握：

✅ 各种 3D 模型格式的加载方法
✅ 纹理和材质的加载和优化
✅ 音频资源的管理和空间音频
✅ 异步加载和进度监控
✅ 资源缓存和预加载策略
✅ 错误处理和重试机制

继续学习：[07 - 物理模拟](./07-physics-simulation.md)

---

## 10. 参考资源

- [Babylon.js 资源加载文档](https://doc.babylonjs.com/divingDeeper/importers)
- [glTF 优化指南](https://www.khronos.org/gltf/)
- [纹理压缩工具](https://squoosh.app/)
- [3D 模型优化技巧](https://doc.babylonjs.com/divingDeeper/scene/optimize_your_scene)
