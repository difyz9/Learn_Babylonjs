# 3D 游戏开发项目

## 🎮 项目概述

使用 Babylon.js 开发的完整 3D 游戏项目，包含角色控制、物理引擎、AI 系统、关卡设计等核心游戏开发功能。适合学习游戏开发基础和进阶技术。

## ✨ 游戏特性

- 🕹️ **第三人称角色控制**: 平滑移动、跳跃、攻击
- 🌍 **开放世界环境**: 大型场景、LOD 优化
- ⚔️ **战斗系统**: 实时战斗、技能系统
- 🤖 **AI 敌人**: 状态机、寻路算法
- 🏆 **任务系统**: 主线任务、支线任务
- 🎵 **音效系统**: 3D 音效、背景音乐
- 💾 **存档系统**: 游戏进度保存
- 📱 **多平台支持**: PC、移动端适配

## 🎯 技术亮点

- 现代游戏引擎架构设计
- 组件化实体系统 (ECS)
- 高性能渲染优化
- 物理引擎集成
- 网络多人游戏支持

---

## 🏗️ 项目结构

```
3d-game-engine/
├── src/
│   ├── core/                    # 核心引擎
│   │   ├── GameEngine.ts        # 游戏引擎主类
│   │   ├── SceneManager.ts      # 场景管理器
│   │   ├── InputManager.ts      # 输入管理
│   │   ├── AssetManager.ts      # 资源管理
│   │   └── GameLoop.ts          # 游戏循环
│   ├── entities/                # 游戏实体
│   │   ├── Player.ts            # 玩家角色
│   │   ├── Enemy.ts             # 敌人 AI
│   │   ├── NPC.ts               # 非玩家角色
│   │   └── GameObject.ts        # 游戏对象基类
│   ├── components/              # ECS 组件
│   │   ├── Transform.ts         # 变换组件
│   │   ├── Renderer.ts          # 渲染组件
│   │   ├── Physics.ts           # 物理组件
│   │   ├── Health.ts            # 生命值组件
│   │   └── AI.ts                # AI 组件
│   ├── systems/                 # ECS 系统
│   │   ├── MovementSystem.ts    # 移动系统
│   │   ├── CombatSystem.ts      # 战斗系统
│   │   ├── AISystem.ts          # AI 系统
│   │   └── RenderSystem.ts      # 渲染系统
│   ├── gameplay/                # 游戏玩法
│   │   ├── QuestSystem.ts       # 任务系统
│   │   ├── InventorySystem.ts   # 物品系统
│   │   ├── SkillSystem.ts       # 技能系统
│   │   └── DialogSystem.ts      # 对话系统
│   ├── physics/                 # 物理系统
│   │   ├── PhysicsWorld.ts      # 物理世界
│   │   ├── CollisionDetection.ts # 碰撞检测
│   │   └── RigidBody.ts         # 刚体组件
│   ├── audio/                   # 音频系统
│   │   ├── AudioManager.ts      # 音频管理
│   │   └── SoundEffect.ts       # 音效处理
│   ├── networking/              # 网络系统
│   │   ├── NetworkManager.ts    # 网络管理
│   │   └── MultiplayerSync.ts   # 多人同步
│   └── ui/                      # 用户界面
│       ├── GameUI.tsx           # 游戏 UI
│       ├── MainMenu.tsx         # 主菜单
│       └── HUD.tsx              # 游戏内 UI
├── assets/                      # 游戏资源
│   ├── models/                  # 3D 模型
│   ├── textures/                # 纹理贴图
│   ├── animations/              # 动画文件
│   ├── audio/                   # 音频文件
│   ├── levels/                  # 关卡数据
│   └── configs/                 # 配置文件
├── levels/                      # 关卡设计
│   ├── Level01.ts               # 第一关
│   └── LevelEditor.ts           # 关卡编辑器
└── tools/                       # 开发工具
    ├── AssetPipeline.ts         # 资源管线
    └── DebugConsole.ts          # 调试控制台
```

---

## 🚀 核心系统实现

### 1. 游戏引擎核心

#### GameEngine.ts
```typescript
import {
  Engine,
  Scene,
  FreeCamera,
  Vector3,
  HemisphericLight,
  CannonJSPlugin
} from 'babylonjs';
import { SceneManager } from './SceneManager';
import { InputManager } from './InputManager';
import { AssetManager } from './AssetManager';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { AudioManager } from '../audio/AudioManager';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private engine: Engine;
  private sceneManager: SceneManager;
  private inputManager: InputManager;
  private assetManager: AssetManager;
  private physicsWorld: PhysicsWorld;
  private audioManager: AudioManager;
  
  private isRunning = false;
  private lastTime = 0;
  private deltaTime = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true
    });
  }

  async initialize(): Promise<void> {
    console.log('Initializing Game Engine...');

    // 初始化核心系统
    this.sceneManager = new SceneManager(this.engine);
    this.inputManager = new InputManager(this.canvas);
    this.assetManager = new AssetManager();
    this.audioManager = new AudioManager();

    // 创建主场景
    await this.sceneManager.createMainScene();
    
    // 初始化物理世界
    this.physicsWorld = new PhysicsWorld(this.sceneManager.currentScene);
    await this.physicsWorld.initialize();

    // 设置渲染循环
    this.setupRenderLoop();
    
    // 设置窗口大小调整
    this.setupResize();

    console.log('Game Engine initialized successfully');
  }

  private setupRenderLoop(): void {
    this.engine.runRenderLoop(() => {
      const currentTime = performance.now();
      this.deltaTime = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;

      if (this.isRunning) {
        this.update(this.deltaTime);
        this.render();
      }
    });
  }

  private update(deltaTime: number): void {
    // 更新输入
    this.inputManager.update();
    
    // 更新物理
    this.physicsWorld.update(deltaTime);
    
    // 更新场景
    this.sceneManager.update(deltaTime);
    
    // 更新音频
    this.audioManager.update(deltaTime);
  }

  private render(): void {
    const scene = this.sceneManager.currentScene;
    if (scene) {
      scene.render();
    }
  }

  private setupResize(): void {
    window.addEventListener('resize', () => {
      this.engine.resize();
    });
  }

  public start(): void {
    console.log('Starting game...');
    this.isRunning = true;
    this.lastTime = performance.now();
  }

  public pause(): void {
    this.isRunning = false;
  }

  public resume(): void {
    this.isRunning = true;
    this.lastTime = performance.now();
  }

  public stop(): void {
    this.isRunning = false;
  }

  public dispose(): void {
    this.stop();
    this.sceneManager?.dispose();
    this.inputManager?.dispose();
    this.assetManager?.dispose();
    this.physicsWorld?.dispose();
    this.audioManager?.dispose();
    this.engine?.dispose();
  }

  // Getters
  public get scene(): Scene | null {
    return this.sceneManager?.currentScene || null;
  }

  public get input(): InputManager {
    return this.inputManager;
  }

  public get assets(): AssetManager {
    return this.assetManager;
  }

  public get physics(): PhysicsWorld {
    return this.physicsWorld;
  }

  public get audio(): AudioManager {
    return this.audioManager;
  }
}
```

### 2. 玩家角色控制

#### Player.ts
```typescript
import {
  Scene,
  AbstractMesh,
  Vector3,
  Ray,
  AnimationGroup,
  TransformNode,
  UniversalCamera,
  SceneLoader
} from 'babylonjs';
import { GameObject } from './GameObject';
import { InputManager } from '../core/InputManager';

interface PlayerStats {
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  level: number;
  experience: number;
  strength: number;
  agility: number;
  intelligence: number;
}

export class Player extends GameObject {
  private mesh: AbstractMesh | null = null;
  private camera: UniversalCamera | null = null;
  private animations = new Map<string, AnimationGroup>();
  private currentAnimation: AnimationGroup | null = null;
  
  private stats: PlayerStats = {
    health: 100,
    maxHealth: 100,
    mana: 50,
    maxMana: 50,
    level: 1,
    experience: 0,
    strength: 10,
    agility: 10,
    intelligence: 10
  };

  private movement = {
    speed: 5,
    jumpHeight: 8,
    isGrounded: true,
    velocity: Vector3.Zero()
  };

  private combat = {
    isAttacking: false,
    attackCooldown: 0,
    attackDamage: 20,
    attackRange: 2
  };

  constructor(scene: Scene, private input: InputManager) {
    super(scene);
  }

  async initialize(): Promise<void> {
    await this.loadPlayerModel();
    this.setupCamera();
    this.setupPhysics();
    this.setupAnimations();
  }

  private async loadPlayerModel(): Promise<void> {
    try {
      const result = await SceneLoader.ImportMeshAsync(
        '',
        './assets/models/characters/',
        'player.glb',
        this.scene
      );

      this.mesh = result.meshes[0];
      this.mesh.name = 'player';
      this.mesh.position = new Vector3(0, 1, 0);
      
      // 设置碰撞盒
      this.mesh.checkCollisions = true;
      this.mesh.isPickable = true;

      // 加载动画
      if (result.animationGroups.length > 0) {
        result.animationGroups.forEach((animGroup, index) => {
          this.animations.set(animGroup.name, animGroup);
          animGroup.stop(); // 停止自动播放
        });
      }

    } catch (error) {
      console.error('Failed to load player model:', error);
      // 创建临时模型
      this.createTemporaryModel();
    }
  }

  private createTemporaryModel(): void {
    this.mesh = this.scene.createDefaultSphere('player', {
      diameter: 1.8,
      segments: 16
    });
    this.mesh.position = new Vector3(0, 1, 0);
    this.mesh.checkCollisions = true;
  }

  private setupCamera(): void {
    if (!this.mesh) return;

    // 第三人称摄像机
    this.camera = new UniversalCamera(
      'playerCamera',
      new Vector3(0, 5, -10),
      this.scene
    );

    // 摄像机跟随玩家
    this.camera.setTarget(this.mesh.position);
    this.camera.attachToCanvas(this.scene.getEngine().getRenderingCanvas()!, true);

    // 设置摄像机控制
    this.camera.inputs.clear();
    this.setupCameraControls();
  }

  private setupCameraControls(): void {
    // 自定义摄像机控制
    let mouseX = 0;
    let mouseY = 0;
    let cameraDistance = 10;

    this.input.onMouseMove((x, y) => {
      mouseX += x * 0.01;
      mouseY += y * 0.01;
      mouseY = Math.max(-Math.PI/3, Math.min(Math.PI/3, mouseY));
    });

    this.input.onMouseWheel((delta) => {
      cameraDistance += delta * 0.1;
      cameraDistance = Math.max(3, Math.min(20, cameraDistance));
    });

    // 更新摄像机位置
    this.scene.onBeforeRenderObservable.add(() => {
      if (this.mesh && this.camera) {
        const targetPos = this.mesh.position.clone();
        targetPos.y += 2; // 稍微高一点

        const cameraPos = new Vector3(
          targetPos.x + Math.sin(mouseX) * cameraDistance,
          targetPos.y + Math.sin(mouseY) * cameraDistance,
          targetPos.z + Math.cos(mouseX) * cameraDistance
        );

        this.camera.position = cameraPos;
        this.camera.setTarget(targetPos);
      }
    });
  }

  private setupPhysics(): void {
    if (!this.mesh) return;

    // 设置重力
    this.scene.gravity = new Vector3(0, -9.81, 0);
    this.mesh.applyGravity = true;
  }

  private setupAnimations(): void {
    // 动画状态管理
    this.playAnimation('idle');
  }

  public update(deltaTime: number): void {
    if (!this.mesh) return;

    this.updateMovement(deltaTime);
    this.updateCombat(deltaTime);
    this.updateStats(deltaTime);
    this.checkGrounded();
  }

  private updateMovement(deltaTime: number): void {
    if (!this.mesh) return;

    const moveVector = Vector3.Zero();
    let isMoving = false;

    // 获取输入
    if (this.input.isKeyPressed('w') || this.input.isKeyPressed('ArrowUp')) {
      moveVector.z += 1;
      isMoving = true;
    }
    if (this.input.isKeyPressed('s') || this.input.isKeyPressed('ArrowDown')) {
      moveVector.z -= 1;
      isMoving = true;
    }
    if (this.input.isKeyPressed('a') || this.input.isKeyPressed('ArrowLeft')) {
      moveVector.x -= 1;
      isMoving = true;
    }
    if (this.input.isKeyPressed('d') || this.input.isKeyPressed('ArrowRight')) {
      moveVector.x += 1;
      isMoving = true;
    }

    // 跳跃
    if (this.input.isKeyPressed(' ') && this.movement.isGrounded) {
      this.movement.velocity.y = this.movement.jumpHeight;
      this.movement.isGrounded = false;
      this.playAnimation('jump');
    }

    // 标准化移动向量
    if (moveVector.length() > 0) {
      moveVector.normalize();
      moveVector.scaleInPlace(this.movement.speed * deltaTime);

      // 相对于摄像机方向的移动
      if (this.camera) {
        const cameraForward = this.camera.getForwardRay().direction;
        cameraForward.y = 0;
        cameraForward.normalize();
        
        const cameraRight = Vector3.Cross(cameraForward, Vector3.Up());
        
        const worldMove = cameraForward.scale(moveVector.z)
          .add(cameraRight.scale(moveVector.x));
        
        this.mesh.position.addInPlace(worldMove);
        
        // 角色面向移动方向
        const lookDirection = worldMove.normalize();
        this.mesh.lookAt(this.mesh.position.add(lookDirection));
      }

      // 播放移动动画
      if (this.currentAnimation?.name !== 'run') {
        this.playAnimation('run');
      }
    } else {
      // 播放待机动画
      if (this.currentAnimation?.name !== 'idle' && this.movement.isGrounded) {
        this.playAnimation('idle');
      }
    }

    // 应用重力
    if (!this.movement.isGrounded) {
      this.movement.velocity.y -= 30 * deltaTime; // 重力加速度
      this.mesh.position.y += this.movement.velocity.y * deltaTime;
    }
  }

  private updateCombat(deltaTime: number): void {
    // 更新攻击冷却
    if (this.combat.attackCooldown > 0) {
      this.combat.attackCooldown -= deltaTime;
    }

    // 攻击输入
    if (this.input.isMouseButtonPressed(0) && !this.combat.isAttacking) {
      this.performAttack();
    }

    // 技能输入
    if (this.input.isKeyPressed('q')) {
      this.useSkill('fireball');
    }
  }

  private updateStats(deltaTime: number): void {
    // 自然回复
    if (this.stats.health < this.stats.maxHealth) {
      this.stats.health += 5 * deltaTime;
      this.stats.health = Math.min(this.stats.health, this.stats.maxHealth);
    }

    if (this.stats.mana < this.stats.maxMana) {
      this.stats.mana += 10 * deltaTime;
      this.stats.mana = Math.min(this.stats.mana, this.stats.maxMana);
    }
  }

  private checkGrounded(): void {
    if (!this.mesh) return;

    // 射线检测地面
    const ray = new Ray(this.mesh.position, Vector3.Down());
    const hit = this.scene.pickWithRay(ray);

    if (hit?.hit && hit.distance < 1.1) {
      if (!this.movement.isGrounded) {
        this.movement.isGrounded = true;
        this.movement.velocity.y = 0;
        // 调整位置到地面
        this.mesh.position.y = hit.pickedPoint!.y + 0.9;
      }
    } else {
      this.movement.isGrounded = false;
    }
  }

  private performAttack(): void {
    if (this.combat.attackCooldown > 0) return;

    this.combat.isAttacking = true;
    this.combat.attackCooldown = 1.0; // 1秒冷却

    this.playAnimation('attack');

    // 攻击检测
    this.detectAttackTargets();

    setTimeout(() => {
      this.combat.isAttacking = false;
    }, 500);
  }

  private detectAttackTargets(): void {
    if (!this.mesh) return;

    // 在攻击范围内检测敌人
    const attackRay = new Ray(
      this.mesh.position,
      this.mesh.getDirection(Vector3.Forward())
    );

    const hit = this.scene.pickWithRay(attackRay, (mesh) => {
      return mesh.name.includes('enemy');
    });

    if (hit?.hit && hit.distance <= this.combat.attackRange) {
      // 对目标造成伤害
      this.dealDamageToTarget(hit.pickedMesh!, this.combat.attackDamage);
    }
  }

  private dealDamageToTarget(target: AbstractMesh, damage: number): void {
    // 这里会调用目标的受伤函数
    console.log(`Player dealt ${damage} damage to ${target.name}`);
  }

  private useSkill(skillName: string): void {
    // 技能系统
    console.log(`Using skill: ${skillName}`);
  }

  private playAnimation(animationName: string): void {
    const animation = this.animations.get(animationName);
    if (!animation) return;

    if (this.currentAnimation && this.currentAnimation !== animation) {
      this.currentAnimation.stop();
    }

    this.currentAnimation = animation;
    animation.start(true); // 循环播放
  }

  // 玩家状态接口
  public takeDamage(damage: number): void {
    this.stats.health -= damage;
    if (this.stats.health <= 0) {
      this.die();
    }
  }

  public heal(amount: number): void {
    this.stats.health += amount;
    this.stats.health = Math.min(this.stats.health, this.stats.maxHealth);
  }

  public gainExperience(amount: number): void {
    this.stats.experience += amount;
    // 检查是否升级
    this.checkLevelUp();
  }

  private checkLevelUp(): void {
    const requiredExp = this.stats.level * 100;
    if (this.stats.experience >= requiredExp) {
      this.levelUp();
    }
  }

  private levelUp(): void {
    this.stats.level++;
    this.stats.experience = 0;
    this.stats.maxHealth += 20;
    this.stats.maxMana += 10;
    this.stats.health = this.stats.maxHealth;
    this.stats.mana = this.stats.maxMana;
    
    console.log(`Level up! Now level ${this.stats.level}`);
  }

  private die(): void {
    this.playAnimation('death');
    console.log('Player died');
    // 触发死亡事件
  }

  public getStats(): PlayerStats {
    return { ...this.stats };
  }

  public getPosition(): Vector3 {
    return this.mesh?.position.clone() || Vector3.Zero();
  }

  public dispose(): void {
    this.animations.forEach(anim => anim.dispose());
    this.mesh?.dispose();
    this.camera?.dispose();
    super.dispose();
  }
}
```

### 3. AI 敌人系统

#### Enemy.ts
```typescript
import {
  Scene,
  AbstractMesh,
  Vector3,
  Animation,
  AnimationGroup,
  SceneLoader,
  Ray
} from 'babylonjs';
import { GameObject } from './GameObject';

enum EnemyState {
  IDLE = 'idle',
  PATROL = 'patrol',
  CHASE = 'chase',
  ATTACK = 'attack',
  HURT = 'hurt',
  DEATH = 'death'
}

interface EnemyStats {
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
  detectionRange: number;
  attackRange: number;
  patrolRadius: number;
}

export class Enemy extends GameObject {
  private mesh: AbstractMesh | null = null;
  private animations = new Map<string, AnimationGroup>();
  private currentState = EnemyState.IDLE;
  private target: Vector3 | null = null;
  private patrolCenter: Vector3;
  private patrolTarget: Vector3;
  
  private stats: EnemyStats = {
    health: 80,
    maxHealth: 80,
    damage: 15,
    speed: 3,
    detectionRange: 8,
    attackRange: 2,
    patrolRadius: 5
  };

  private ai = {
    stateTimer: 0,
    lastAttackTime: 0,
    attackCooldown: 2.0,
    pathfindingTimer: 0
  };

  private player: GameObject | null = null;

  constructor(scene: Scene, position: Vector3) {
    super(scene);
    this.patrolCenter = position.clone();
    this.patrolTarget = position.clone();
  }

  async initialize(): Promise<void> {
    await this.loadEnemyModel();
    this.setupAI();
  }

  private async loadEnemyModel(): Promise<void> {
    try {
      const result = await SceneLoader.ImportMeshAsync(
        '',
        './assets/models/enemies/',
        'goblin.glb',
        this.scene
      );

      this.mesh = result.meshes[0];
      this.mesh.name = 'enemy';
      this.mesh.position = this.patrolCenter.clone();
      this.mesh.checkCollisions = true;

      // 加载动画
      if (result.animationGroups.length > 0) {
        result.animationGroups.forEach((animGroup) => {
          this.animations.set(animGroup.name, animGroup);
          animGroup.stop();
        });
      }

    } catch (error) {
      console.error('Failed to load enemy model:', error);
      this.createTemporaryModel();
    }
  }

  private createTemporaryModel(): void {
    this.mesh = this.scene.createDefaultSphere('enemy', {
      diameter: 1.5,
      segments: 12
    });
    this.mesh.position = this.patrolCenter.clone();
    this.mesh.checkCollisions = true;
    
    // 创建简单材质以区分敌人
    const material = this.scene.createDefaultMaterial('enemyMaterial', {});
    this.mesh.material = material;
  }

  private setupAI(): void {
    this.changeState(EnemyState.IDLE);
    this.generatePatrolTarget();
  }

  public setPlayer(player: GameObject): void {
    this.player = player;
  }

  public update(deltaTime: number): void {
    if (!this.mesh || this.stats.health <= 0) return;

    this.ai.stateTimer += deltaTime;
    this.ai.pathfindingTimer += deltaTime;

    // AI 状态机
    switch (this.currentState) {
      case EnemyState.IDLE:
        this.updateIdle(deltaTime);
        break;
      case EnemyState.PATROL:
        this.updatePatrol(deltaTime);
        break;
      case EnemyState.CHASE:
        this.updateChase(deltaTime);
        break;
      case EnemyState.ATTACK:
        this.updateAttack(deltaTime);
        break;
      case EnemyState.HURT:
        this.updateHurt(deltaTime);
        break;
      case EnemyState.DEATH:
        this.updateDeath(deltaTime);
        break;
    }

    // 检测玩家
    if (this.currentState !== EnemyState.DEATH && this.currentState !== EnemyState.HURT) {
      this.detectPlayer();
    }
  }

  private updateIdle(deltaTime: number): void {
    if (this.ai.stateTimer > 2.0) {
      this.changeState(EnemyState.PATROL);
    }
  }

  private updatePatrol(deltaTime: number): void {
    if (!this.mesh) return;

    const distanceToPatrolTarget = Vector3.Distance(
      this.mesh.position,
      this.patrolTarget
    );

    if (distanceToPatrolTarget < 0.5) {
      // 到达巡逻点，生成新的巡逻目标
      this.generatePatrolTarget();
      this.changeState(EnemyState.IDLE);
    } else {
      // 移动到巡逻点
      this.moveTowards(this.patrolTarget, this.stats.speed * 0.5 * deltaTime);
    }
  }

  private updateChase(deltaTime: number): void {
    if (!this.mesh || !this.player) return;

    const playerPosition = this.player.getPosition();
    const distanceToPlayer = Vector3.Distance(this.mesh.position, playerPosition);

    if (distanceToPlayer > this.stats.detectionRange * 1.5) {
      // 玩家超出追击范围，返回巡逻
      this.changeState(EnemyState.PATROL);
      return;
    }

    if (distanceToPlayer <= this.stats.attackRange) {
      // 进入攻击范围
      this.changeState(EnemyState.ATTACK);
      return;
    }

    // 追击玩家
    this.moveTowards(playerPosition, this.stats.speed * deltaTime);
  }

  private updateAttack(deltaTime: number): void {
    if (!this.mesh || !this.player) return;

    const playerPosition = this.player.getPosition();
    const distanceToPlayer = Vector3.Distance(this.mesh.position, playerPosition);

    if (distanceToPlayer > this.stats.attackRange) {
      // 玩家离开攻击范围，继续追击
      this.changeState(EnemyState.CHASE);
      return;
    }

    // 面向玩家
    this.mesh.lookAt(playerPosition);

    // 攻击冷却检查
    const currentTime = Date.now() / 1000;
    if (currentTime - this.ai.lastAttackTime >= this.ai.attackCooldown) {
      this.performAttack();
      this.ai.lastAttackTime = currentTime;
    }
  }

  private updateHurt(deltaTime: number): void {
    if (this.ai.stateTimer > 0.5) {
      this.changeState(EnemyState.CHASE);
    }
  }

  private updateDeath(deltaTime: number): void {
    // 死亡动画播放完毕后销毁
    if (this.ai.stateTimer > 3.0) {
      this.dispose();
    }
  }

  private detectPlayer(): void {
    if (!this.mesh || !this.player) return;

    const playerPosition = this.player.getPosition();
    const distance = Vector3.Distance(this.mesh.position, playerPosition);

    if (distance <= this.stats.detectionRange) {
      // 视线检查
      if (this.hasLineOfSight(playerPosition)) {
        if (this.currentState !== EnemyState.CHASE && this.currentState !== EnemyState.ATTACK) {
          this.changeState(EnemyState.CHASE);
        }
      }
    }
  }

  private hasLineOfSight(targetPosition: Vector3): boolean {
    if (!this.mesh) return false;

    const direction = targetPosition.subtract(this.mesh.position).normalize();
    const ray = new Ray(this.mesh.position.add(Vector3.Up().scale(0.5)), direction);
    
    const hit = this.scene.pickWithRay(ray, (mesh) => {
      return mesh.name === 'player' || mesh.name.includes('wall');
    });

    return hit?.hit && hit.pickedMesh?.name === 'player';
  }

  private moveTowards(target: Vector3, distance: number): void {
    if (!this.mesh) return;

    const direction = target.subtract(this.mesh.position).normalize();
    const movement = direction.scale(distance);
    
    this.mesh.position.addInPlace(movement);
    this.mesh.lookAt(target);
  }

  private generatePatrolTarget(): void {
    // 在巡逻半径内生成随机位置
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * this.stats.patrolRadius;
    
    this.patrolTarget = this.patrolCenter.add(new Vector3(
      Math.cos(angle) * distance,
      0,
      Math.sin(angle) * distance
    ));
  }

  private performAttack(): void {
    if (!this.player) return;

    this.playAnimation('attack');
    
    // 对玩家造成伤害
    setTimeout(() => {
      if (this.player) {
        this.player.takeDamage(this.stats.damage);
        console.log(`Enemy dealt ${this.stats.damage} damage to player`);
      }
    }, 300); // 攻击动画延迟
  }

  private changeState(newState: EnemyState): void {
    this.currentState = newState;
    this.ai.stateTimer = 0;
    
    // 播放对应动画
    this.playAnimation(newState);
  }

  private playAnimation(animationName: string): void {
    const animation = this.animations.get(animationName);
    if (animation) {
      // 停止当前动画
      this.animations.forEach(anim => anim.stop());
      // 播放新动画
      animation.start(true);
    }
  }

  public takeDamage(damage: number): void {
    this.stats.health -= damage;
    
    if (this.stats.health <= 0) {
      this.die();
    } else {
      this.changeState(EnemyState.HURT);
    }
  }

  private die(): void {
    this.changeState(EnemyState.DEATH);
    
    // 掉落奖励
    this.dropRewards();
    
    console.log('Enemy died');
  }

  private dropRewards(): void {
    // 生成经验值和物品
    if (this.player) {
      this.player.gainExperience(50);
    }
  }

  public getPosition(): Vector3 {
    return this.mesh?.position.clone() || Vector3.Zero();
  }

  public isAlive(): boolean {
    return this.stats.health > 0;
  }

  public dispose(): void {
    this.animations.forEach(anim => anim.dispose());
    this.mesh?.dispose();
    super.dispose();
  }
}
```

---

## 🎮 游戏玩法系统

### 任务系统 (QuestSystem.ts)
```typescript
interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'kill' | 'collect' | 'talk' | 'reach';
  requirements: Record<string, any>;
  rewards: {
    experience: number;
    items: string[];
    gold: number;
  };
  completed: boolean;
  progress: Record<string, number>;
}

export class QuestSystem {
  private quests = new Map<string, Quest>();
  private activeQuests = new Set<string>();
  private onQuestUpdate?: (quest: Quest) => void;

  public addQuest(quest: Quest): void {
    this.quests.set(quest.id, quest);
    this.activeQuests.add(quest.id);
    console.log(`New quest added: ${quest.title}`);
  }

  public updateProgress(questId: string, progressType: string, amount: number): void {
    const quest = this.quests.get(questId);
    if (!quest || quest.completed) return;

    quest.progress[progressType] = (quest.progress[progressType] || 0) + amount;
    
    // 检查完成条件
    if (this.checkQuestCompletion(quest)) {
      this.completeQuest(quest);
    }

    this.onQuestUpdate?.(quest);
  }

  private checkQuestCompletion(quest: Quest): boolean {
    return Object.entries(quest.requirements).every(([key, required]) => {
      return (quest.progress[key] || 0) >= required;
    });
  }

  private completeQuest(quest: Quest): void {
    quest.completed = true;
    this.activeQuests.delete(quest.id);
    
    // 给予奖励
    console.log(`Quest completed: ${quest.title}`);
    console.log(`Rewards: ${quest.rewards.experience} XP, ${quest.rewards.gold} gold`);
  }

  public getActiveQuests(): Quest[] {
    return Array.from(this.activeQuests).map(id => this.quests.get(id)!);
  }
}
```

### 物品系统 (InventorySystem.ts)
```typescript
interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'consumable' | 'material';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  stats?: Record<string, number>;
  stackable: boolean;
  maxStack: number;
}

interface InventorySlot {
  item: Item | null;
  quantity: number;
}

export class InventorySystem {
  private slots: InventorySlot[] = [];
  private maxSlots = 40;
  private equippedItems = new Map<string, Item>();

  constructor() {
    // 初始化背包槽位
    for (let i = 0; i < this.maxSlots; i++) {
      this.slots.push({ item: null, quantity: 0 });
    }
  }

  public addItem(item: Item, quantity: number = 1): boolean {
    // 检查是否可以堆叠
    if (item.stackable) {
      for (const slot of this.slots) {
        if (slot.item?.id === item.id && slot.quantity < item.maxStack) {
          const canAdd = Math.min(quantity, item.maxStack - slot.quantity);
          slot.quantity += canAdd;
          quantity -= canAdd;
          
          if (quantity <= 0) return true;
        }
      }
    }

    // 找空槽位
    for (const slot of this.slots) {
      if (!slot.item) {
        slot.item = item;
        slot.quantity = quantity;
        return true;
      }
    }

    return false; // 背包已满
  }

  public removeItem(itemId: string, quantity: number = 1): boolean {
    for (const slot of this.slots) {
      if (slot.item?.id === itemId) {
        if (slot.quantity >= quantity) {
          slot.quantity -= quantity;
          if (slot.quantity <= 0) {
            slot.item = null;
            slot.quantity = 0;
          }
          return true;
        }
      }
    }
    return false;
  }

  public equipItem(itemId: string): boolean {
    // 装备物品逻辑
    return true;
  }

  public getItems(): InventorySlot[] {
    return this.slots;
  }
}
```

---

## 🎵 音效和用户界面

### 游戏 UI 组件
```tsx
import React, { useState, useEffect } from 'react';

interface GameUIProps {
  playerStats: any;
  questSystem: any;
  inventorySystem: any;
}

export const GameUI: React.FC<GameUIProps> = ({
  playerStats,
  questSystem,
  inventorySystem
}) => {
  const [showInventory, setShowInventory] = useState(false);
  const [showQuests, setShowQuests] = useState(false);

  return (
    <div className="game-ui">
      {/* 生命值和法力值条 */}
      <div className="status-bars">
        <div className="health-bar">
          <div 
            className="health-fill"
            style={{ width: `${(playerStats.health / playerStats.maxHealth) * 100}%` }}
          />
        </div>
        <div className="mana-bar">
          <div 
            className="mana-fill"
            style={{ width: `${(playerStats.mana / playerStats.maxMana) * 100}%` }}
          />
        </div>
      </div>

      {/* 快捷栏 */}
      <div className="hotbar">
        {[1,2,3,4,5,6,7,8,9,0].map(key => (
          <div key={key} className="hotbar-slot">
            <span>{key === 10 ? 0 : key}</span>
          </div>
        ))}
      </div>

      {/* 小地图 */}
      <div className="minimap">
        <canvas width="150" height="150"></canvas>
      </div>

      {/* 控制按钮 */}
      <div className="control-buttons">
        <button onClick={() => setShowInventory(!showInventory)}>
          背包 (I)
        </button>
        <button onClick={() => setShowQuests(!showQuests)}>
          任务 (J)
        </button>
      </div>

      {/* 背包界面 */}
      {showInventory && (
        <InventoryPanel 
          inventory={inventorySystem}
          onClose={() => setShowInventory(false)}
        />
      )}

      {/* 任务界面 */}
      {showQuests && (
        <QuestPanel 
          questSystem={questSystem}
          onClose={() => setShowQuests(false)}
        />
      )}
    </div>
  );
};
```

### 游戏样式
```css
.game-ui {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1000;
}

.game-ui > * {
  pointer-events: auto;
}

.status-bars {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 300px;
}

.health-bar, .mana-bar {
  width: 100%;
  height: 20px;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid #fff;
  margin-bottom: 5px;
  position: relative;
}

.health-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff0000 0%, #ff6666 100%);
  transition: width 0.3s ease;
}

.mana-fill {
  height: 100%;
  background: linear-gradient(90deg, #0066ff 0%, #6699ff 100%);
  transition: width 0.3s ease;
}

.hotbar {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 5px;
}

.hotbar-slot {
  width: 50px;
  height: 50px;
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid #666;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
}

.minimap {
  position: absolute;
  top: 20px;
  right: 20px;
  border: 2px solid #fff;
  background: rgba(0, 0, 0, 0.5);
}

.control-buttons {
  position: absolute;
  bottom: 100px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.control-buttons button {
  padding: 10px 15px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: 2px solid #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.control-buttons button:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #fff;
}
```

---

## 🚀 部署和优化

### 性能优化技巧
```typescript
// 实例化渲染优化
export class InstancedRenderingManager {
  private instancedMeshes = new Map<string, InstancedMesh>();

  public createInstancedMesh(baseModel: AbstractMesh, count: number): InstancedMesh {
    const instances = [];
    for (let i = 0; i < count; i++) {
      instances.push(baseModel.createInstance(`instance_${i}`));
    }
    
    // 合并实例以提高性能
    return this.optimizeInstances(instances);
  }

  private optimizeInstances(instances: AbstractMesh[]): InstancedMesh {
    // 实现实例化优化逻辑
    return instances[0] as InstancedMesh;
  }
}

// LOD (细节层次) 系统
export class LODManager {
  public setupLOD(mesh: AbstractMesh, distances: number[], models: string[]): void {
    for (let i = 0; i < distances.length; i++) {
      mesh.addLODLevel(distances[i], null); // 加载对应的LOD模型
    }
  }
}
```

### 构建配置
```json
{
  "scripts": {
    "build": "webpack --mode production",
    "dev": "webpack serve --mode development",
    "build:assets": "node tools/asset-pipeline.js"
  },
  "dependencies": {
    "babylonjs": "^6.0.0",
    "babylonjs-loaders": "^6.0.0",
    "babylonjs-materials": "^6.0.0",
    "cannon": "^0.20.0"
  }
}
```

这个 3D 游戏开发项目展示了使用 Babylon.js 构建完整游戏的核心技术和架构。包含了角色控制、AI 系统、物理引擎、游戏玩法等所有关键组件，可以作为游戏开发学习和实践的完整参考。
