# 05 - 用户交互

## 📚 本章目标

学习如何在 Babylon.js 中实现丰富的用户交互功能，包括鼠标、键盘、触摸等输入处理，以及创建交互式的 3D 体验。

## 🎯 学习内容

- 输入系统概览
- 鼠标和指针交互
- 键盘输入处理
- 触摸和手势控制
- 拾取（Picking）系统
- GUI 用户界面
- 高级交互技术

---

## 1. 输入系统概览

### 1.1 Babylon.js 输入架构

```javascript
// Babylon.js 输入系统组件
// 1. Scene.onPointerObservable - 指针事件（鼠标/触摸）
// 2. Scene.actionManager - 动作管理器
// 3. Engine 键盘输入 - 键盘事件处理
// 4. Camera 控制 - 内置摄像机控制
// 5. GUI 系统 - 用户界面交互
```

### 1.2 事件处理模式

```javascript
// 1. Observable 模式（推荐）
scene.onPointerObservable.add((pointerInfo) => {
    // 处理指针事件
});

// 2. ActionManager 模式
mesh.actionManager = new BABYLON.ActionManager(scene);
mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
    BABYLON.ActionManager.OnPickTrigger,
    () => { /* 处理点击 */ }
));

// 3. 原生 DOM 事件
canvas.addEventListener('click', (event) => {
    // 处理原生事件
});
```

---

## 2. 鼠标和指针交互

### 2.1 基础指针事件

```javascript
// 监听所有指针事件
scene.onPointerObservable.add((pointerInfo) => {
    switch (pointerInfo.type) {
        case BABYLON.PointerEventTypes.POINTERDOWN:
            console.log("指针按下", pointerInfo.pickInfo);
            break;
        case BABYLON.PointerEventTypes.POINTERUP:
            console.log("指针释放", pointerInfo.pickInfo);
            break;
        case BABYLON.PointerEventTypes.POINTERMOVE:
            console.log("指针移动", pointerInfo.pickInfo);
            break;
        case BABYLON.PointerEventTypes.POINTERWHEEL:
            console.log("滚轮滚动", pointerInfo.event);
            break;
        case BABYLON.PointerEventTypes.POINTERDOUBLETAP:
            console.log("双击/双击", pointerInfo.pickInfo);
            break;
    }
});
```

### 2.2 详细的点击处理

```javascript
// 高级点击处理
let clickStartTime = 0;
let clickStartPosition = null;
let isDragging = false;

scene.onPointerObservable.add((pointerInfo) => {
    const event = pointerInfo.event;
    
    switch (pointerInfo.type) {
        case BABYLON.PointerEventTypes.POINTERDOWN:
            clickStartTime = Date.now();
            clickStartPosition = { x: event.clientX, y: event.clientY };
            isDragging = false;
            
            // 检查是否点击到物体
            if (pointerInfo.pickInfo.hit) {
                const pickedMesh = pointerInfo.pickInfo.pickedMesh;
                console.log("点击到:", pickedMesh.name);
                
                // 存储点击状态
                pickedMesh.metadata = pickedMesh.metadata || {};
                pickedMesh.metadata.isClicked = true;
            }
            break;
            
        case BABYLON.PointerEventTypes.POINTERMOVE:
            if (clickStartPosition) {
                const distance = Math.sqrt(
                    Math.pow(event.clientX - clickStartPosition.x, 2) +
                    Math.pow(event.clientY - clickStartPosition.y, 2)
                );
                
                if (distance > 5) { // 移动超过5像素认为是拖拽
                    isDragging = true;
                }
            }
            break;
            
        case BABYLON.PointerEventTypes.POINTERUP:
            const clickDuration = Date.now() - clickStartTime;
            
            if (!isDragging && clickDuration < 300) {
                // 有效点击（短时间且无拖拽）
                handleClick(pointerInfo);
            } else if (isDragging) {
                // 拖拽结束
                handleDragEnd(pointerInfo);
            }
            
            // 重置状态
            clickStartTime = 0;
            clickStartPosition = null;
            isDragging = false;
            break;
    }
});

function handleClick(pointerInfo) {
    if (pointerInfo.pickInfo.hit) {
        const mesh = pointerInfo.pickInfo.pickedMesh;
        console.log(`有效点击: ${mesh.name}`);
        
        // 执行点击动作
        animateClickEffect(mesh);
    }
}

function handleDragEnd(pointerInfo) {
    console.log("拖拽结束");
    // 处理拖拽结束逻辑
}
```

### 2.3 鼠标悬停效果

```javascript
let hoveredMesh = null;

scene.onPointerObservable.add((pointerInfo) => {
    if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE) {
        const pickInfo = pointerInfo.pickInfo;
        
        if (pickInfo.hit) {
            const mesh = pickInfo.pickedMesh;
            
            // 新的悬停对象
            if (mesh !== hoveredMesh) {
                // 取消之前的悬停效果
                if (hoveredMesh) {
                    removeHoverEffect(hoveredMesh);
                }
                
                // 应用新的悬停效果
                hoveredMesh = mesh;
                applyHoverEffect(mesh);
            }
        } else {
            // 鼠标移出所有对象
            if (hoveredMesh) {
                removeHoverEffect(hoveredMesh);
                hoveredMesh = null;
            }
        }
    }
});

function applyHoverEffect(mesh) {
    // 改变材质颜色
    if (mesh.material) {
        mesh.material.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    }
    
    // 添加外边框效果
    mesh.renderOverlay = true;
    mesh.overlayColor = new BABYLON.Color3(1, 1, 0); // 黄色边框
    mesh.overlayAlpha = 0.3;
    
    // 改变鼠标样式
    document.body.style.cursor = 'pointer';
}

function removeHoverEffect(mesh) {
    // 恢复原始材质
    if (mesh.material) {
        mesh.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
    }
    
    // 移除外边框
    mesh.renderOverlay = false;
    
    // 恢复鼠标样式
    document.body.style.cursor = 'default';
}
```

---

## 3. 键盘输入处理

### 3.1 基础键盘监听

```javascript
// 键盘状态追踪
const keyStates = {};

// 监听键盘事件
scene.actionManager = new BABYLON.ActionManager(scene);

// 按键按下
scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
    BABYLON.ActionManager.OnKeyDownTrigger,
    (evt) => {
        const key = evt.sourceEvent.key.toLowerCase();
        keyStates[key] = true;
        console.log("按键按下:", key);
        
        // 处理特定按键
        handleKeyDown(key);
    }
));

// 按键释放
scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
    BABYLON.ActionManager.OnKeyUpTrigger,
    (evt) => {
        const key = evt.sourceEvent.key.toLowerCase();
        keyStates[key] = false;
        console.log("按键释放:", key);
    }
));

function handleKeyDown(key) {
    switch (key) {
        case 'r':
            resetCamera();
            break;
        case 'space':
            toggleAnimation();
            break;
        case 'escape':
            showMenu();
            break;
        case 'f':
            toggleFullscreen();
            break;
    }
}
```

### 3.2 WASD 移动控制

```javascript
// 移动速度
const moveSpeed = 0.1;
let selectedMesh = null;

// 渲染循环中检查按键状态
scene.registerBeforeRender(() => {
    if (selectedMesh) {
        // WASD 控制选中对象移动
        if (keyStates['w'] || keyStates['arrowup']) {
            selectedMesh.position.z += moveSpeed;
        }
        if (keyStates['s'] || keyStates['arrowdown']) {
            selectedMesh.position.z -= moveSpeed;
        }
        if (keyStates['a'] || keyStates['arrowleft']) {
            selectedMesh.position.x -= moveSpeed;
        }
        if (keyStates['d'] || keyStates['arrowright']) {
            selectedMesh.position.x += moveSpeed;
        }
        if (keyStates['q']) {
            selectedMesh.position.y += moveSpeed;
        }
        if (keyStates['e']) {
            selectedMesh.position.y -= moveSpeed;
        }
    }
    
    // 摄像机控制
    if (keyStates['shift']) {
        // 加速模式
        scene.activeCamera.speed = 1.0;
    } else {
        scene.activeCamera.speed = 0.5;
    }
});
```

### 3.3 组合键处理

```javascript
// 组合键检测
function isKeyComboPressed(...keys) {
    return keys.every(key => keyStates[key.toLowerCase()]);
}

// 在按键处理中检查组合键
function handleKeyDown(key) {
    // Ctrl+S: 保存
    if (isKeyComboPressed('control', 's')) {
        saveScene();
        return;
    }
    
    // Ctrl+Z: 撤销
    if (isKeyComboPressed('control', 'z')) {
        undo();
        return;
    }
    
    // Alt+F4: 退出
    if (isKeyComboPressed('alt', 'f4')) {
        exitApplication();
        return;
    }
    
    // 单独按键处理
    switch (key) {
        case 'delete':
            deleteSelectedMesh();
            break;
        case 'tab':
            selectNextMesh();
            break;
    }
}
```

---

## 4. 触摸和手势控制

### 4.1 触摸事件处理

```javascript
// 触摸状态追踪
let touchState = {
    touching: false,
    startPos: null,
    currentPos: null,
    startTime: 0,
    touches: {}
};

// 监听触摸事件
canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

function handleTouchStart(event) {
    event.preventDefault();
    
    touchState.touching = true;
    touchState.startTime = Date.now();
    
    const touch = event.touches[0];
    touchState.startPos = { x: touch.clientX, y: touch.clientY };
    touchState.currentPos = { x: touch.clientX, y: touch.clientY };
    
    // 多点触摸
    for (let i = 0; i < event.touches.length; i++) {
        const touch = event.touches[i];
        touchState.touches[touch.identifier] = {
            x: touch.clientX,
            y: touch.clientY,
            startX: touch.clientX,
            startY: touch.clientY
        };
    }
    
    // 检测触摸到的对象
    const pickResult = scene.pick(touch.clientX, touch.clientY);
    if (pickResult.hit) {
        console.log("触摸到:", pickResult.pickedMesh.name);
    }
}

function handleTouchMove(event) {
    event.preventDefault();
    
    if (!touchState.touching) return;
    
    const touch = event.touches[0];
    touchState.currentPos = { x: touch.clientX, y: touch.clientY };
    
    // 更新多点触摸状态
    for (let i = 0; i < event.touches.length; i++) {
        const touch = event.touches[i];
        if (touchState.touches[touch.identifier]) {
            touchState.touches[touch.identifier].x = touch.clientX;
            touchState.touches[touch.identifier].y = touch.clientY;
        }
    }
    
    // 检测手势
    detectGestures(event);
}

function handleTouchEnd(event) {
    event.preventDefault();
    
    const touchDuration = Date.now() - touchState.startTime;
    const distance = calculateDistance(touchState.startPos, touchState.currentPos);
    
    // 判断是否为点击
    if (touchDuration < 300 && distance < 10) {
        handleTouchTap();
    }
    
    // 重置状态
    touchState.touching = false;
    touchState.touches = {};
}
```

### 4.2 手势识别

```javascript
function detectGestures(event) {
    const touches = Object.values(touchState.touches);
    
    if (touches.length === 2) {
        // 双指手势
        const touch1 = touches[0];
        const touch2 = touches[1];
        
        // 计算当前距离和初始距离
        const currentDistance = calculateDistance(touch1, touch2);
        const startDistance = calculateDistance(
            { x: touch1.startX, y: touch1.startY },
            { x: touch2.startX, y: touch2.startY }
        );
        
        const scale = currentDistance / startDistance;
        
        // 缩放手势
        if (Math.abs(scale - 1) > 0.1) {
            handlePinchGesture(scale);
        }
        
        // 旋转手势
        const currentAngle = calculateAngle(touch1, touch2);
        const startAngle = calculateAngle(
            { x: touch1.startX, y: touch1.startY },
            { x: touch2.startX, y: touch2.startY }
        );
        
        const rotation = currentAngle - startAngle;
        if (Math.abs(rotation) > 0.1) {
            handleRotationGesture(rotation);
        }
    } else if (touches.length === 1) {
        // 单指拖拽
        const touch = touches[0];
        const deltaX = touch.x - touch.startX;
        const deltaY = touch.y - touch.startY;
        
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
            handleDragGesture(deltaX, deltaY);
        }
    }
}

function handlePinchGesture(scale) {
    // 缩放摄像机
    if (scene.activeCamera instanceof BABYLON.ArcRotateCamera) {
        scene.activeCamera.radius *= (2 - scale);
        scene.activeCamera.radius = Math.max(2, Math.min(50, scene.activeCamera.radius));
    }
}

function handleRotationGesture(rotation) {
    // 旋转选中对象
    if (selectedMesh) {
        selectedMesh.rotation.y += rotation;
    }
}

function handleDragGesture(deltaX, deltaY) {
    // 拖拽移动对象
    if (selectedMesh) {
        const sensitivity = 0.01;
        selectedMesh.position.x += deltaX * sensitivity;
        selectedMesh.position.y -= deltaY * sensitivity;
    }
}

// 辅助函数
function calculateDistance(pos1, pos2) {
    return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
}

function calculateAngle(pos1, pos2) {
    return Math.atan2(pos2.y - pos1.y, pos2.x - pos1.x);
}
```

---

## 5. 拾取（Picking）系统

### 5.1 基础拾取

```javascript
// 屏幕坐标拾取
function pickObject(x, y) {
    const pickResult = scene.pick(x, y);
    
    if (pickResult.hit) {
        console.log("拾取到对象:", pickResult.pickedMesh.name);
        console.log("拾取点:", pickResult.pickedPoint);
        console.log("距离:", pickResult.distance);
        
        return pickResult.pickedMesh;
    }
    
    return null;
}

// 射线拾取
function pickWithRay(origin, direction) {
    const ray = new BABYLON.Ray(origin, direction);
    const pickResult = scene.pickWithRay(ray);
    
    return pickResult;
}

// 多物体拾取
function pickMultiple(x, y) {
    const pickResults = scene.multiPick(x, y);
    
    console.log(`拾取到 ${pickResults.length} 个对象`);
    pickResults.forEach((result, index) => {
        console.log(`${index}: ${result.pickedMesh.name} (距离: ${result.distance})`);
    });
    
    return pickResults;
}
```

### 5.2 高级拾取技术

```javascript
// 自定义拾取谓词
function pickWithPredicate(x, y, predicate) {
    const pickResult = scene.pick(x, y, predicate);
    return pickResult;
}

// 示例：只拾取可移动的对象
const movableOnly = (mesh) => {
    return mesh.metadata && mesh.metadata.movable === true;
};

const pickResult = pickWithPredicate(mouseX, mouseY, movableOnly);

// 球形拾取
function pickInSphere(center, radius) {
    const pickedMeshes = [];
    
    scene.meshes.forEach(mesh => {
        const distance = BABYLON.Vector3.Distance(center, mesh.position);
        if (distance <= radius) {
            pickedMeshes.push(mesh);
        }
    });
    
    return pickedMeshes;
}

// 矩形区域拾取
function pickInRectangle(startX, startY, endX, endY) {
    const pickedMeshes = [];
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    const steps = 10;
    
    for (let x = 0; x <= steps; x++) {
        for (let y = 0; y <= steps; y++) {
            const pickX = startX + (width * x / steps);
            const pickY = startY + (height * y / steps);
            
            const pickResult = scene.pick(pickX, pickY);
            if (pickResult.hit && !pickedMeshes.includes(pickResult.pickedMesh)) {
                pickedMeshes.push(pickResult.pickedMesh);
            }
        }
    }
    
    return pickedMeshes;
}
```

---

## 6. GUI 用户界面

### 6.1 2D GUI

```javascript
// 创建全屏 GUI
const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

// 创建按钮
const button = BABYLON.GUI.Button.CreateSimpleButton("button", "点击我");
button.widthInPixels = 150;
button.heightInPixels = 40;
button.color = "white";
button.cornerRadius = 20;
button.background = "green";
button.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
button.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
button.topInPixels = 50;

// 按钮点击事件
button.onPointerUpObservable.add(() => {
    console.log("GUI 按钮被点击");
});

advancedTexture.addControl(button);

// 创建文本标签
const textBlock = new BABYLON.GUI.TextBlock();
textBlock.text = "Hello Babylon.js!";
textBlock.color = "white";
textBlock.fontSize = 24;
textBlock.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
textBlock.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;

advancedTexture.addControl(textBlock);

// 创建输入框
const inputText = new BABYLON.GUI.InputText();
inputText.widthInPixels = 200;
inputText.heightInPixels = 40;
inputText.text = "输入文本...";
inputText.color = "white";
inputText.background = "black";
inputText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
inputText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
inputText.topInPixels = -50;

advancedTexture.addControl(inputText);
```

### 6.2 3D GUI

```javascript
// 创建 3D GUI 管理器
const manager = new BABYLON.GUI.GUI3DManager(scene);

// 创建 3D 按钮
const button3D = new BABYLON.GUI.Button3D("button3D");
button3D.onPointerUpObservable.add(() => {
    console.log("3D 按钮被点击");
});

// 创建按钮面板
const panel = new BABYLON.GUI.PlanePanel();
panel.margin = 0.2;
panel.rows = 2;
panel.columns = 2;

// 添加按钮到面板
panel.addControl(button3D);

// 设置面板位置
panel.position = new BABYLON.Vector3(0, 3, 0);

manager.addControl(panel);

// 创建浮动标签
function createFloatingLabel(mesh, text) {
    const label = new BABYLON.GUI.Rectangle("label");
    label.background = "black";
    label.height = "30px";
    label.alpha = 0.8;
    label.widthInPixels = 100;
    label.cornerRadius = 10;
    label.thickness = 1;
    label.linkOffsetY = -30;
    
    const textBlock = new BABYLON.GUI.TextBlock();
    textBlock.text = text;
    textBlock.color = "white";
    label.addControl(textBlock);
    
    label.linkWithMesh(mesh);
    advancedTexture.addControl(label);
    
    return label;
}
```

---

## 7. 高级交互技术

### 7.1 拖拽系统

```javascript
class DragDropSystem {
    constructor(scene) {
        this.scene = scene;
        this.draggedMesh = null;
        this.startingPoint = null;
        this.currentMesh = null;
        
        this.setupDragDrop();
    }
    
    setupDragDrop() {
        this.scene.onPointerObservable.add((pointerInfo) => {
            switch (pointerInfo.type) {
                case BABYLON.PointerEventTypes.POINTERDOWN:
                    this.onPointerDown(pointerInfo);
                    break;
                case BABYLON.PointerEventTypes.POINTERMOVE:
                    this.onPointerMove(pointerInfo);
                    break;
                case BABYLON.PointerEventTypes.POINTERUP:
                    this.onPointerUp(pointerInfo);
                    break;
            }
        });
    }
    
    onPointerDown(pointerInfo) {
        if (pointerInfo.pickInfo.hit) {
            const mesh = pointerInfo.pickInfo.pickedMesh;
            
            // 检查是否可拖拽
            if (mesh.metadata && mesh.metadata.draggable) {
                this.draggedMesh = mesh;
                this.startingPoint = this.getGroundPosition();
                
                // 禁用摄像机控制
                this.scene.activeCamera.detachControl();
                
                // 视觉反馈
                this.draggedMesh.material.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0);
            }
        }
    }
    
    onPointerMove(pointerInfo) {
        if (!this.draggedMesh) return;
        
        const current = this.getGroundPosition();
        if (!current) return;
        
        const diff = current.subtract(this.startingPoint);
        this.draggedMesh.position.addInPlace(diff);
        this.startingPoint = current;
    }
    
    onPointerUp(pointerInfo) {
        if (this.draggedMesh) {
            // 恢复摄像机控制
            this.scene.activeCamera.attachToCanvas(this.scene.getEngine().getRenderingCanvas());
            
            // 恢复视觉效果
            this.draggedMesh.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
            
            this.draggedMesh = null;
        }
    }
    
    getGroundPosition() {
        const pickinfo = this.scene.pick(
            this.scene.pointerX, 
            this.scene.pointerY,
            (mesh) => mesh.name === "ground"
        );
        
        if (pickinfo.hit) {
            return pickinfo.pickedPoint;
        }
        
        return null;
    }
}

// 使用拖拽系统
const dragSystem = new DragDropSystem(scene);

// 设置对象为可拖拽
sphere.metadata = { draggable: true };
box.metadata = { draggable: true };
```

### 7.2 选择框系统

```javascript
class SelectionBox {
    constructor(scene) {
        this.scene = scene;
        this.isSelecting = false;
        this.startX = 0;
        this.startY = 0;
        this.selectionRectangle = null;
        this.selectedMeshes = [];
        
        this.setupSelectionBox();
    }
    
    setupSelectionBox() {
        // 创建选择框 GUI
        this.selectionRectangle = new BABYLON.GUI.Rectangle();
        this.selectionRectangle.background = "rgba(0, 100, 255, 0.2)";
        this.selectionRectangle.color = "blue";
        this.selectionRectangle.thickness = 2;
        this.selectionRectangle.isVisible = false;
        
        const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        advancedTexture.addControl(this.selectionRectangle);
        
        // 监听事件
        this.scene.onPointerObservable.add((pointerInfo) => {
            this.handlePointerEvent(pointerInfo);
        });
    }
    
    handlePointerEvent(pointerInfo) {
        switch (pointerInfo.type) {
            case BABYLON.PointerEventTypes.POINTERDOWN:
                if (pointerInfo.event.ctrlKey) {
                    this.startSelection(pointerInfo.event.clientX, pointerInfo.event.clientY);
                }
                break;
                
            case BABYLON.PointerEventTypes.POINTERMOVE:
                if (this.isSelecting) {
                    this.updateSelection(pointerInfo.event.clientX, pointerInfo.event.clientY);
                }
                break;
                
            case BABYLON.PointerEventTypes.POINTERUP:
                if (this.isSelecting) {
                    this.endSelection(pointerInfo.event.clientX, pointerInfo.event.clientY);
                }
                break;
        }
    }
    
    startSelection(x, y) {
        this.isSelecting = true;
        this.startX = x;
        this.startY = y;
        this.selectionRectangle.isVisible = true;
        this.selectionRectangle.leftInPixels = x;
        this.selectionRectangle.topInPixels = y;
        this.selectionRectangle.widthInPixels = 0;
        this.selectionRectangle.heightInPixels = 0;
    }
    
    updateSelection(x, y) {
        const width = x - this.startX;
        const height = y - this.startY;
        
        this.selectionRectangle.leftInPixels = Math.min(this.startX, x);
        this.selectionRectangle.topInPixels = Math.min(this.startY, y);
        this.selectionRectangle.widthInPixels = Math.abs(width);
        this.selectionRectangle.heightInPixels = Math.abs(height);
    }
    
    endSelection(x, y) {
        this.isSelecting = false;
        this.selectionRectangle.isVisible = false;
        
        // 计算选择区域
        const minX = Math.min(this.startX, x);
        const maxX = Math.max(this.startX, x);
        const minY = Math.min(this.startY, y);
        const maxY = Math.max(this.startY, y);
        
        // 清除之前的选择
        this.clearSelection();
        
        // 检查哪些对象在选择区域内
        this.scene.meshes.forEach(mesh => {
            if (this.isMeshInSelection(mesh, minX, minY, maxX, maxY)) {
                this.selectMesh(mesh);
            }
        });
    }
    
    isMeshInSelection(mesh, minX, minY, maxX, maxY) {
        // 将 3D 位置转换为屏幕坐标
        const screenPos = BABYLON.Vector3.Project(
            mesh.position,
            BABYLON.Matrix.Identity(),
            this.scene.getTransformMatrix(),
            this.scene.activeCamera.getViewport(this.scene.getEngine())
        );
        
        const canvas = this.scene.getEngine().getRenderingCanvas();
        const screenX = screenPos.x * canvas.width;
        const screenY = screenPos.y * canvas.height;
        
        return screenX >= minX && screenX <= maxX && screenY >= minY && screenY <= maxY;
    }
    
    selectMesh(mesh) {
        this.selectedMeshes.push(mesh);
        
        // 添加选择效果
        mesh.renderOverlay = true;
        mesh.overlayColor = new BABYLON.Color3(0, 1, 0);
        mesh.overlayAlpha = 0.3;
    }
    
    clearSelection() {
        this.selectedMeshes.forEach(mesh => {
            mesh.renderOverlay = false;
        });
        this.selectedMeshes = [];
    }
}

// 使用选择框系统
const selectionBox = new SelectionBox(scene);
```

---

## 8. 完整交互示例

```html
<!DOCTYPE html>
<html>
<head>
    <title>完整交互示例</title>
    <script src="https://cdn.babylonjs.com/babylon.js"></script>
    <script src="https://cdn.babylonjs.com/gui/babylon.gui.min.js"></script>
    <style>
        html, body { margin: 0; padding: 0; overflow: hidden; }
        canvas { width: 100%; height: 100%; touch-action: none; }
        .info {
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            border-radius: 5px;
            font-family: Arial, sans-serif;
            max-width: 300px;
        }
    </style>
</head>
<body>
    <canvas id="renderCanvas"></canvas>
    <div class="info">
        <h3>交互说明</h3>
        <p>• 点击对象选择</p>
        <p>• 拖拽移动对象</p>
        <p>• 双击改变颜色</p>
        <p>• WASD 移动选中对象</p>
        <p>• R 键重置摄像机</p>
        <p>• Delete 删除选中对象</p>
    </div>

    <script>
        const canvas = document.getElementById("renderCanvas");
        const engine = new BABYLON.Engine(canvas, true);
        
        let scene, selectedMesh = null;
        const keyStates = {};
        
        function createScene() {
            scene = new BABYLON.Scene(engine);
            scene.clearColor = new BABYLON.Color3(0.1, 0.1, 0.15);
            
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
            
            // 创建对象
            createInteractiveObjects();
            
            // 设置交互
            setupInteractions();
            
            return scene;
        }
        
        function createInteractiveObjects() {
            // 地面
            const ground = BABYLON.MeshBuilder.CreateGround(
                "ground", { width: 10, height: 10 }, scene
            );
            const groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
            groundMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
            ground.material = groundMaterial;
            
            // 创建多个彩色对象
            const colors = [
                new BABYLON.Color3(1, 0, 0),  // 红
                new BABYLON.Color3(0, 1, 0),  // 绿
                new BABYLON.Color3(0, 0, 1),  // 蓝
                new BABYLON.Color3(1, 1, 0),  // 黄
                new BABYLON.Color3(1, 0, 1)   // 紫
            ];
            
            for (let i = 0; i < 5; i++) {
                const sphere = BABYLON.MeshBuilder.CreateSphere(
                    `sphere${i}`, { diameter: 1 }, scene
                );
                sphere.position.x = (i - 2) * 2;
                sphere.position.y = 0.5;
                
                const material = new BABYLON.StandardMaterial(`mat${i}`, scene);
                material.diffuseColor = colors[i];
                sphere.material = material;
                
                // 设置为可交互
                sphere.metadata = { 
                    interactive: true,
                    originalColor: colors[i].clone()
                };
            }
        }
        
        function setupInteractions() {
            // 键盘事件
            scene.actionManager = new BABYLON.ActionManager(scene);
            
            scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnKeyDownTrigger,
                (evt) => {
                    const key = evt.sourceEvent.key.toLowerCase();
                    keyStates[key] = true;
                    handleKeyDown(key);
                }
            ));
            
            scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnKeyUpTrigger,
                (evt) => {
                    keyStates[evt.sourceEvent.key.toLowerCase()] = false;
                }
            ));
            
            // 鼠标/触摸事件
            let clickCount = 0;
            let clickTimer = null;
            
            scene.onPointerObservable.add((pointerInfo) => {
                switch (pointerInfo.type) {
                    case BABYLON.PointerEventTypes.POINTERDOWN:
                        handlePointerDown(pointerInfo);
                        break;
                    case BABYLON.PointerEventTypes.POINTERUP:
                        handlePointerUp(pointerInfo);
                        break;
                }
            });
        }
        
        function handlePointerDown(pointerInfo) {
            if (pointerInfo.pickInfo.hit) {
                const mesh = pointerInfo.pickInfo.pickedMesh;
                
                if (mesh.metadata && mesh.metadata.interactive) {
                    selectMesh(mesh);
                    
                    // 双击检测
                    clickCount++;
                    if (clickTimer) clearTimeout(clickTimer);
                    
                    clickTimer = setTimeout(() => {
                        if (clickCount === 2) {
                            handleDoubleClick(mesh);
                        }
                        clickCount = 0;
                    }, 300);
                }
            } else {
                deselectMesh();
            }
        }
        
        function handlePointerUp(pointerInfo) {
            // 处理拖拽结束等
        }
        
        function selectMesh(mesh) {
            // 取消之前的选择
            if (selectedMesh) {
                deselectMesh();
            }
            
            selectedMesh = mesh;
            
            // 添加选择效果
            mesh.renderOverlay = true;
            mesh.overlayColor = new BABYLON.Color3(1, 1, 0);
            mesh.overlayAlpha = 0.3;
            
            console.log("选中:", mesh.name);
        }
        
        function deselectMesh() {
            if (selectedMesh) {
                selectedMesh.renderOverlay = false;
                selectedMesh = null;
            }
        }
        
        function handleDoubleClick(mesh) {
            // 随机改变颜色
            const newColor = new BABYLON.Color3(
                Math.random(),
                Math.random(),
                Math.random()
            );
            
            mesh.material.diffuseColor = newColor;
            console.log("改变颜色:", mesh.name);
        }
        
        function handleKeyDown(key) {
            switch (key) {
                case 'r':
                    // 重置摄像机
                    scene.activeCamera.setTarget(BABYLON.Vector3.Zero());
                    scene.activeCamera.alpha = -Math.PI / 2;
                    scene.activeCamera.beta = Math.PI / 2.5;
                    scene.activeCamera.radius = 10;
                    break;
                    
                case 'delete':
                    if (selectedMesh) {
                        selectedMesh.dispose();
                        selectedMesh = null;
                    }
                    break;
                    
                case 'c':
                    // 创建新对象
                    createRandomSphere();
                    break;
            }
        }
        
        function createRandomSphere() {
            const sphere = BABYLON.MeshBuilder.CreateSphere(
                `sphere_${Date.now()}`, { diameter: 1 }, scene
            );
            
            sphere.position = new BABYLON.Vector3(
                (Math.random() - 0.5) * 8,
                0.5,
                (Math.random() - 0.5) * 8
            );
            
            const material = new BABYLON.StandardMaterial("randomMat", scene);
            material.diffuseColor = new BABYLON.Color3(
                Math.random(),
                Math.random(),
                Math.random()
            );
            sphere.material = material;
            sphere.metadata = { interactive: true };
        }
        
        // 渲染循环中的键盘处理
        scene.registerBeforeRender(() => {
            if (selectedMesh) {
                const moveSpeed = 0.1;
                
                if (keyStates['w']) selectedMesh.position.z += moveSpeed;
                if (keyStates['s']) selectedMesh.position.z -= moveSpeed;
                if (keyStates['a']) selectedMesh.position.x -= moveSpeed;
                if (keyStates['d']) selectedMesh.position.x += moveSpeed;
                if (keyStates['q']) selectedMesh.position.y += moveSpeed;
                if (keyStates['e']) selectedMesh.position.y -= moveSpeed;
            }
        });
        
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

## 9. 性能优化

### 9.1 事件优化

```javascript
// 节流函数
function throttle(func, delay) {
    let timeoutId;
    let lastExecTime = 0;
    
    return function (...args) {
        const currentTime = Date.now();
        
        if (currentTime - lastExecTime > delay) {
            func.apply(this, args);
            lastExecTime = currentTime;
        } else {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
                lastExecTime = Date.now();
            }, delay - (currentTime - lastExecTime));
        }
    };
}

// 应用节流到鼠标移动事件
const throttledMouseMove = throttle((pointerInfo) => {
    // 处理鼠标移动
}, 16); // 约 60fps
```

### 9.2 批量操作

```javascript
// 批量更新对象
function batchUpdateMeshes(meshes, updateFunction) {
    scene.freezeActiveMeshes();
    
    meshes.forEach(mesh => {
        updateFunction(mesh);
    });
    
    scene.unfreezeActiveMeshes();
}
```

---

## 10. 下一步

完成本章学习后，你应该掌握：

✅ 各种输入事件的处理方法
✅ 鼠标、键盘、触摸交互的实现
✅ 拾取系统的使用技巧
✅ GUI 界面的创建和控制
✅ 高级交互系统的设计

继续学习：[06 - 资源加载](./06-asset-loading.md)

---

## 11. 参考资源

- [Babylon.js 交互文档](https://doc.babylonjs.com/divingDeeper/events)
- [GUI 系统指南](https://doc.babylonjs.com/divingDeeper/gui)
- [拾取系统详解](https://doc.babylonjs.com/divingDeeper/mesh/interactions/picking_collisions)
- [触摸和手势控制](https://doc.babylonjs.com/divingDeeper/cameras/camera_introduction)
