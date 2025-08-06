# Babylon.js 问题排查指南

## 🔍 诊断流程

当遇到问题时，请按照以下流程进行诊断：

```
问题发生
    ↓
检查控制台错误
    ↓
验证基础配置
    ↓
检查浏览器兼容性
    ↓
分析性能指标
    ↓
查看调试信息
    ↓
应用解决方案
```

---

## 🚨 常见错误及解决方案

### 1. 渲染相关错误

#### ❌ 错误：`Cannot read property 'render' of null`

**原因**: 场景对象未正确初始化

**解决方案**:
```javascript
// 检查场景创建顺序
const canvas = document.getElementById('canvas');
if (!canvas) {
    console.error('Canvas element not found');
    return;
}

const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);

// 确保在场景创建后再调用 render
if (scene) {
    engine.runRenderLoop(() => {
        scene.render();
    });
}
```

#### ❌ 错误：`WebGL context lost`

**原因**: WebGL 上下文丢失，通常在移动设备或显卡驱动问题时发生

**解决方案**:
```javascript
canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    console.warn('WebGL context lost');
});

canvas.addEventListener('webglcontextrestored', () => {
    console.log('WebGL context restored');
    // 重新初始化场景
    initScene();
});
```

#### ❌ 错误：`gl.getError() returned 1282`

**原因**: WebGL 无效操作错误

**解决方案**:
```javascript
// 启用 WebGL 调试
const engine = new BABYLON.Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true
});

// 检查 WebGL 状态
const gl = engine.getGlInfo();
console.log('WebGL Info:', gl);
```

### 2. 资源加载错误

#### ❌ 错误：`404 Not Found` 或 `CORS policy`

**原因**: 资源路径错误或跨域问题

**解决方案**:
```javascript
// 1. 检查资源路径
const assetPath = './models/scene.babylon';
console.log('Loading from:', assetPath);

// 2. 处理 CORS
SceneLoader.ImportMesh("", "https://cors-anywhere.herokuapp.com/", "model.glb", scene);

// 3. 使用本地服务器
// 推荐使用 http-server 或 live-server

// 4. 错误处理
SceneLoader.ImportMesh("", "", "model.glb", scene, 
    (meshes) => {
        console.log('Loaded successfully:', meshes);
    },
    (progress) => {
        console.log('Loading progress:', progress);
    },
    (error) => {
        console.error('Loading failed:', error);
    }
);
```

#### ❌ 错误：`Invalid file format`

**原因**: 文件格式不支持或文件损坏

**解决方案**:
```javascript
// 1. 检查支持的格式
const supportedFormats = ['.babylon', '.glb', '.gltf', '.obj', '.stl'];

// 2. 添加必要的加载器
import 'babylonjs-loaders';

// 3. 验证文件完整性
fetch(modelUrl, { method: 'HEAD' })
    .then(response => {
        console.log('File size:', response.headers.get('content-length'));
        console.log('Content type:', response.headers.get('content-type'));
    });
```

### 3. 性能问题

#### ❌ 问题：帧率低于 30 FPS

**诊断步骤**:
```javascript
// 性能分析器
class PerformanceAnalyzer {
    constructor(scene, engine) {
        this.scene = scene;
        this.engine = engine;
        this.frameCount = 0;
        this.lastTime = performance.now();
    }
    
    analyze() {
        const currentTime = performance.now();
        this.frameCount++;
        
        if (currentTime - this.lastTime >= 1000) {
            const fps = this.frameCount;
            const info = this.engine.getGlInfo();
            
            console.log('Performance Report:', {
                fps: fps,
                meshes: this.scene.meshes.length,
                activeMeshes: this.scene.getActiveMeshes().length,
                drawCalls: info.drawCalls || 'N/A',
                triangles: this.getTotalTriangles(),
                textures: this.scene.textures.length,
                materials: this.scene.materials.length
            });
            
            this.frameCount = 0;
            this.lastTime = currentTime;
        }
    }
    
    getTotalTriangles() {
        return this.scene.meshes.reduce((total, mesh) => {
            if (mesh.getTotalVertices) {
                return total + mesh.getTotalVertices() / 3;
            }
            return total;
        }, 0);
    }
}

// 使用分析器
const analyzer = new PerformanceAnalyzer(scene, engine);
scene.registerBeforeRender(() => analyzer.analyze());
```

**优化方案**:
```javascript
// 1. 减少渲染负载
scene.freezeActiveMeshes(); // 冻结静态网格

// 2. 使用 LOD
const lod = new BABYLON.LOD("myLOD", scene);
lod.addLODLevel(100, highDetailMesh);
lod.addLODLevel(50, mediumDetailMesh);
lod.addLODLevel(25, lowDetailMesh);

// 3. 合并网格
const merged = BABYLON.Mesh.MergeMeshes([mesh1, mesh2, mesh3]);

// 4. 使用实例化
for (let i = 0; i < 1000; i++) {
    const instance = originalMesh.createInstance("instance" + i);
}
```

### 4. 内存问题

#### ❌ 问题：内存泄漏和页面崩溃

**检测方法**:
```javascript
// 内存监控
class MemoryMonitor {
    static monitor() {
        if (performance.memory) {
            const memory = performance.memory;
            console.log('Memory Usage:', {
                used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
                total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
                limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB'
            });
        }
    }
}

// 定期监控
setInterval(() => MemoryMonitor.monitor(), 5000);
```

**解决方案**:
```javascript
// 正确的清理流程
class SceneManager {
    cleanup() {
        // 1. 停止动画
        this.scene.stopAllAnimations();
        
        // 2. 清理网格
        this.scene.meshes.forEach(mesh => {
            mesh.dispose();
        });
        
        // 3. 清理材质和纹理
        this.scene.materials.forEach(material => {
            material.dispose();
        });
        
        this.scene.textures.forEach(texture => {
            texture.dispose();
        });
        
        // 4. 清理场景
        this.scene.dispose();
        
        // 5. 清理引擎
        this.engine.dispose();
        
        // 6. 移除事件监听器
        window.removeEventListener('resize', this.resizeHandler);
        canvas.removeEventListener('pointerdown', this.pointerHandler);
    }
}
```

### 5. 移动端特殊问题

#### ❌ 问题：iOS Safari 中场景不渲染

**解决方案**:
```javascript
// iOS Safari 特殊处理
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

if (isIOS) {
    // 1. 降低渲染质量
    engine.setHardwareScalingLevel(0.5);
    
    // 2. 禁用高精度
    const engineOptions = {
        adaptToDeviceRatio: false,
        antialias: false
    };
    
    // 3. 处理触摸事件
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
    }, { passive: false });
    
    // 4. 内存优化
    scene.cleanCachedTextureBuffer();
}
```

#### ❌ 问题：Android 设备触摸控制异常

**解决方案**:
```javascript
// Android 触摸优化
const isAndroid = /Android/.test(navigator.userAgent);

if (isAndroid) {
    // 禁用默认触摸行为
    canvas.style.touchAction = 'none';
    
    // 添加触摸监听器
    let touchStartX, touchStartY;
    
    canvas.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const deltaX = e.touches[0].clientX - touchStartX;
        const deltaY = e.touches[0].clientY - touchStartY;
        
        // 处理摄像机旋转
        camera.alpha += deltaX * 0.01;
        camera.beta += deltaY * 0.01;
    });
}
```

---

## 🛠️ 调试工具和技巧

### 1. 内置调试器

```javascript
// 启用调试层
scene.debugLayer.show({
    overlay: true,
    globalRoot: document.body
});

// 或者嵌入模式
scene.debugLayer.show({
    embedMode: true
});
```

### 2. 自定义调试信息

```javascript
class DebugInfo {
    constructor(scene, engine) {
        this.scene = scene;
        this.engine = engine;
        this.createDebugUI();
    }
    
    createDebugUI() {
        const debugDiv = document.createElement('div');
        debugDiv.id = 'debug-info';
        debugDiv.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px;
            font-family: monospace;
            font-size: 12px;
            border-radius: 5px;
            z-index: 1000;
        `;
        document.body.appendChild(debugDiv);
        
        this.updateDebugInfo();
    }
    
    updateDebugInfo() {
        const debugDiv = document.getElementById('debug-info');
        if (debugDiv) {
            debugDiv.innerHTML = `
                FPS: ${Math.round(this.engine.getFps())}<br>
                Meshes: ${this.scene.meshes.length}<br>
                Active Meshes: ${this.scene.getActiveMeshes().length}<br>
                Materials: ${this.scene.materials.length}<br>
                Textures: ${this.scene.textures.length}<br>
                Draw Calls: ${this.engine.getGlInfo().drawCalls || 'N/A'}<br>
                Memory: ${this.getMemoryUsage()}
            `;
        }
        
        requestAnimationFrame(() => this.updateDebugInfo());
    }
    
    getMemoryUsage() {
        if (performance.memory) {
            return Math.round(performance.memory.usedJSHeapSize / 1048576) + ' MB';
        }
        return 'N/A';
    }
}

// 使用调试信息
const debugInfo = new DebugInfo(scene, engine);
```

### 3. 网络调试

```javascript
// 资源加载监控
class ResourceMonitor {
    static logResourceLoading() {
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url) {
            console.log('Loading resource:', url);
            return originalOpen.apply(this, arguments);
        };
        
        const originalFetch = window.fetch;
        window.fetch = function(url, options) {
            console.log('Fetching:', url);
            return originalFetch.apply(this, arguments);
        };
    }
}

ResourceMonitor.logResourceLoading();
```

---

## 📱 移动端专项排查

### 设备兼容性检查

```javascript
function checkDeviceCompatibility() {
    const report = {
        userAgent: navigator.userAgent,
        webglSupport: checkWebGLSupport(),
        webgl2Support: checkWebGL2Support(),
        touchSupport: 'ontouchstart' in window,
        devicePixelRatio: window.devicePixelRatio,
        screenSize: `${screen.width}x${screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
        memory: performance.memory ? 
            Math.round(performance.memory.jsHeapSizeLimit / 1048576) + ' MB' : 'N/A'
    };
    
    console.table(report);
    return report;
}

function checkWebGLSupport() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return !!gl;
    } catch (e) {
        return false;
    }
}

function checkWebGL2Support() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2');
        return !!gl;
    } catch (e) {
        return false;
    }
}

// 在应用启动时运行
checkDeviceCompatibility();
```

---

## 🔧 高级调试技巧

### 1. 帧分析器

```javascript
class FrameAnalyzer {
    constructor(scene, engine) {
        this.scene = scene;
        this.engine = engine;
        this.frames = [];
        this.maxFrames = 60; // 保留最近60帧数据
    }
    
    captureFrame() {
        const frameData = {
            timestamp: performance.now(),
            fps: this.engine.getFps(),
            drawCalls: this.engine.getGlInfo().drawCalls || 0,
            activeMeshes: this.scene.getActiveMeshes().length,
            triangles: this.getTotalTriangles(),
            memory: this.getMemoryUsage()
        };
        
        this.frames.push(frameData);
        
        if (this.frames.length > this.maxFrames) {
            this.frames.shift();
        }
        
        return frameData;
    }
    
    getPerformanceReport() {
        if (this.frames.length === 0) return null;
        
        const avgFPS = this.frames.reduce((sum, frame) => sum + frame.fps, 0) / this.frames.length;
        const minFPS = Math.min(...this.frames.map(f => f.fps));
        const maxFPS = Math.max(...this.frames.map(f => f.fps));
        
        return {
            averageFPS: Math.round(avgFPS),
            minFPS: minFPS,
            maxFPS: maxFPS,
            frameCount: this.frames.length,
            isStable: (maxFPS - minFPS) < 10 // FPS波动小于10认为稳定
        };
    }
    
    getTotalTriangles() {
        return this.scene.meshes.reduce((total, mesh) => {
            if (mesh.getTotalVertices) {
                return total + mesh.getTotalVertices() / 3;
            }
            return total;
        }, 0);
    }
    
    getMemoryUsage() {
        if (performance.memory) {
            return Math.round(performance.memory.usedJSHeapSize / 1048576);
        }
        return 0;
    }
}
```

### 2. 错误收集器

```javascript
class ErrorCollector {
    constructor() {
        this.errors = [];
        this.setupErrorHandlers();
    }
    
    setupErrorHandlers() {
        // JavaScript 错误
        window.addEventListener('error', (event) => {
            this.logError('JavaScript Error', {
                message: event.message,
                filename: event.filename,
                line: event.lineno,
                column: event.colno,
                stack: event.error?.stack
            });
        });
        
        // Promise 拒绝
        window.addEventListener('unhandledrejection', (event) => {
            this.logError('Unhandled Promise Rejection', {
                reason: event.reason
            });
        });
        
        // WebGL 错误
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(type, attributes) {
            const context = originalGetContext.call(this, type, attributes);
            
            if (type.includes('webgl')) {
                context.addEventListener('webglcontextlost', (event) => {
                    this.logError('WebGL Context Lost', { event });
                });
            }
            
            return context;
        };
    }
    
    logError(type, details) {
        const error = {
            type,
            details,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        this.errors.push(error);
        console.error('Error collected:', error);
        
        // 可以发送到服务器
        // this.sendErrorToServer(error);
    }
    
    getErrorReport() {
        return {
            errorCount: this.errors.length,
            errors: this.errors.slice(-10), // 最近10个错误
            deviceInfo: this.getDeviceInfo()
        };
    }
    
    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            screenResolution: `${screen.width}x${screen.height}`,
            viewportSize: `${window.innerWidth}x${window.innerHeight}`,
            devicePixelRatio: window.devicePixelRatio
        };
    }
}

// 启用错误收集
const errorCollector = new ErrorCollector();
```

---

## 📋 排查清单

### 基础检查 ✅
- [ ] Canvas 元素是否存在
- [ ] WebGL 支持是否正常
- [ ] JavaScript 控制台是否有错误
- [ ] 资源文件路径是否正确
- [ ] 网络连接是否正常

### 性能检查 ✅
- [ ] FPS 是否稳定在 30+ 
- [ ] 内存使用是否持续增长
- [ ] 网格数量是否合理（< 1000）
- [ ] 纹理分辨率是否过大
- [ ] 是否使用了性能优化技术

### 兼容性检查 ✅
- [ ] 在不同浏览器中测试
- [ ] 移动设备兼容性
- [ ] WebGL 版本支持
- [ ] 触摸事件响应
- [ ] 音频权限处理

### 代码质量检查 ✅
- [ ] 是否正确释放资源
- [ ] 事件监听器是否清理
- [ ] 异步操作是否有错误处理
- [ ] 内存泄漏检查
- [ ] 代码是否符合最佳实践

---

**记住**: 好的调试习惯是逐步排除问题，从最基础的配置开始检查，然后逐步深入到具体的技术细节。保持日志记录和系统化的调试方法，这将大大提高问题解决的效率。
