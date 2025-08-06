/// <reference types="next" />
/// <reference types="next/image-types/global" />

// 注意：此文件不应手动编辑
// 它由 Next.js 自动生成并管理

// Babylon.js 类型声明
declare module 'babylonjs' {
  export * from '@babylonjs/core';
}

declare module 'babylonjs-loaders' {
  export * from '@babylonjs/loaders';
}

declare module 'babylonjs-materials' {
  export * from '@babylonjs/materials';
}

declare module 'babylonjs-post-process' {
  export * from '@babylonjs/post-processes';
}

declare module 'babylonjs-serializers' {
  export * from '@babylonjs/serializers';
}

// 全局类型扩展
declare global {
  interface Window {
    BABYLON?: any;
  }
}

export {};
