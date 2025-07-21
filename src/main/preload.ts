import { contextBridge, ipcRenderer } from 'electron'

// 暴露 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 应用信息
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  getPath: (name: string) => ipcRenderer.invoke('app:getPath', name),
  
  // 窗口控制
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  
  // 房间管理
  createRoom: (config: any) => ipcRenderer.invoke('room:create', config),
  joinRoom: (roomId: string) => ipcRenderer.invoke('room:join', roomId),
  leaveRoom: () => ipcRenderer.invoke('room:leave'),
  
  // 事件监听
  onRoomUpdate: (callback: Function) => {
    ipcRenderer.on('room:update', (_, data) => callback(data))
  },
  onPlayerJoin: (callback: Function) => {
    ipcRenderer.on('player:join', (_, data) => callback(data))
  },
  onPlayerLeave: (callback: Function) => {
    ipcRenderer.on('player:leave', (_, data) => callback(data))
  }
})

// 类型声明
declare global {
  interface Window {
    electronAPI: {
      getVersion: () => Promise<string>
      getPath: (name: string) => Promise<string>
      minimize: () => Promise<void>
      maximize: () => Promise<void>
      close: () => Promise<void>
      createRoom: (config: any) => Promise<any>
      joinRoom: (roomId: string) => Promise<any>
      leaveRoom: () => Promise<void>
      onRoomUpdate: (callback: Function) => void
      onPlayerJoin: (callback: Function) => void
      onPlayerLeave: (callback: Function) => void
    }
  }
}
