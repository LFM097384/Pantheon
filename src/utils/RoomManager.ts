import { PeerJSSignaling } from './SignalingClient'

export interface RoomMessage {
  type: 'dice_roll' | 'chat' | 'character_update' | 'room_state' | 'player_join' | 'player_leave'
  data: any
  timestamp: number
  playerId: string
}

export interface Room {
  id: string
  name: string
  connectionCode: string
  dmId: string
  players: string[]
  maxPlayers: number
  gameSystem: string
  status: 'waiting' | 'playing'
  createdAt: number
}

// 全局房间注册表 - 使用 localStorage 存储
class RoomRegistry {
  private readonly STORAGE_KEY = 'pantheon_room_registry'
  
  // 注册房间到全局注册表
  registerRoom(connectionCode: string, peerId: string, roomData: Room): void {
    const registry = this.getRegistry()
    registry[connectionCode] = {
      peerId,
      roomData,
      timestamp: Date.now()
    }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(registry))
    
    // 可选：发送到远程注册服务器
    this.syncToRemoteRegistry(connectionCode, peerId, roomData)
  }

  // 查找房间
  findRoom(connectionCode: string): { peerId: string; roomData: Room } | null {
    const registry = this.getRegistry()
    const roomInfo = registry[connectionCode]
    
    if (roomInfo && Date.now() - roomInfo.timestamp < 24 * 60 * 60 * 1000) { // 24小时有效
      return roomInfo
    }
    
    return null
  }

  // 移除房间
  removeRoom(connectionCode: string): void {
    const registry = this.getRegistry()
    delete registry[connectionCode]
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(registry))
  }

  private getRegistry(): any {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      return data ? JSON.parse(data) : {}
    } catch {
      return {}
    }
  }

  // 同步到远程注册服务器（可选）
  private async syncToRemoteRegistry(connectionCode: string, _peerId: string, _roomData: Room): Promise<void> {
    try {
      // 这里可以调用你的后端 API 来注册房间
      // await fetch('https://your-backend.com/api/rooms/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ connectionCode, peerId, roomData })
      // })
      console.log('房间已注册到本地注册表:', connectionCode)
    } catch (error) {
      console.warn('同步到远程注册表失败:', error)
    }
  }
}

const roomRegistry = new RoomRegistry()

export class RoomManager {
  private peerSignaling: PeerJSSignaling
  private connections: Map<string, any> = new Map() // PeerJS 连接
  private currentRoom: Room | null = null
  private isHost: boolean = false
  private myPeerId: string | null = null
  private onMessageCallbacks: ((message: RoomMessage) => void)[] = []

  constructor() {
    this.peerSignaling = new PeerJSSignaling({
      onConnection: this.handlePeerConnection.bind(this),
      onError: this.handleError.bind(this),
    })
  }

  // 初始化 P2P 连接
  async initialize(): Promise<string> {
    this.myPeerId = await this.peerSignaling.initialize()
    return this.myPeerId
  }

  // DM 创建房间
  async createRoom(roomData: {
    name: string
    maxPlayers: number
    gameSystem: string
  }): Promise<Room> {
    if (!this.myPeerId) {
      await this.initialize()
    }

    this.isHost = true
    
    const room: Room = {
      id: this.generateRoomId(),
      name: roomData.name,
      connectionCode: this.generateConnectionCode(),
      dmId: this.myPeerId!,
      players: [],
      maxPlayers: roomData.maxPlayers,
      gameSystem: roomData.gameSystem,
      status: 'waiting',
      createdAt: Date.now()
    }

    this.currentRoom = room
    
    // 注册房间到全局注册表
    roomRegistry.registerRoom(room.connectionCode, this.myPeerId!, room)
    
    console.log(`房间创建成功！`)
    console.log(`连接码: ${room.connectionCode}`)
    console.log(`DM Peer ID: ${this.myPeerId}`)
    console.log(`玩家可以使用此连接码加入房间`)
    
    return room
  }

  // 玩家加入房间
  async joinRoom(connectionCode: string): Promise<void> {
    if (!this.myPeerId) {
      await this.initialize()
    }

    this.isHost = false
    
    try {
      // 从注册表查找房间
      const roomInfo = roomRegistry.findRoom(connectionCode)
      if (!roomInfo) {
        throw new Error('房间不存在或已过期')
      }

      console.log(`找到房间，DM Peer ID: ${roomInfo.peerId}`)
      
      // 连接到 DM
      const connection = await this.peerSignaling.connectToPeer(roomInfo.peerId)
      this.connections.set(roomInfo.peerId, connection)
      
      // 设置连接事件
      this.setupConnectionEvents(connection)
      
      // 发送加入请求
      this.sendMessage({
        type: 'player_join',
        data: {
          playerId: this.myPeerId,
          playerName: 'Player' // 应该从用户状态获取
        },
        timestamp: Date.now(),
        playerId: this.myPeerId!
      })

      console.log('成功连接到房间')
    } catch (error) {
      console.error('加入房间失败:', error)
      throw error
    }
  }

  // 发送消息到房间
  sendMessage(message: RoomMessage): void {
    if (this.isHost) {
      // DM 广播给所有玩家
      this.connections.forEach((connection) => {
        if (connection.open) {
          connection.send(message)
        }
      })
    } else {
      // 玩家发送给DM
      this.connections.forEach((connection) => {
        if (connection.open) {
          connection.send(message)
        }
      })
    }
  }

  // 监听房间消息
  onMessage(callback: (message: RoomMessage) => void): void {
    this.onMessageCallbacks.push(callback)
  }

  // 处理新的 P2P 连接
  private handlePeerConnection(connection: any): void {
    console.log('新玩家连接:', connection.peer)
    
    this.connections.set(connection.peer, connection)
    this.setupConnectionEvents(connection)
    
    if (this.isHost && this.currentRoom) {
      this.currentRoom.players.push(connection.peer)
      
      // 向新玩家发送房间状态
      connection.send({
        type: 'room_state',
        data: this.currentRoom,
        timestamp: Date.now(),
        playerId: this.myPeerId
      })
    }
  }

  // 设置连接事件处理
  private setupConnectionEvents(connection: any): void {
    connection.on('data', (message: RoomMessage) => {
      console.log('收到消息:', message)
      this.handleMessage(connection.peer, message)
    })

    connection.on('close', () => {
      console.log('连接关闭:', connection.peer)
      this.connections.delete(connection.peer)
      this.handlePeerLeave(connection.peer)
    })

    connection.on('error', (error: Error) => {
      console.error('连接错误:', error)
    })
  }

  // 处理错误
  private handleError(error: Error): void {
    console.error('PeerJS 错误:', error)
  }

  // 处理消息
  private handleMessage(peerId: string, message: RoomMessage): void {
    console.log('收到消息:', message)
    
    // 通知所有监听器
    this.onMessageCallbacks.forEach(callback => callback(message))
    
    // 如果是DM，转发消息给其他玩家
    if (this.isHost && message.type !== 'player_join') {
      this.connections.forEach((connection, connPeerId) => {
        if (connPeerId !== peerId && connection.open) {
          connection.send(message)
        }
      })
    }
  }

  // 处理玩家离开
  private handlePeerLeave(peerId: string): void {
    console.log('玩家离开:', peerId)
    
    if (this.isHost && this.currentRoom) {
      this.currentRoom.players = this.currentRoom.players.filter(id => id !== peerId)
      
      // 广播玩家离开消息
      this.sendMessage({
        type: 'player_leave',
        data: { playerId: peerId },
        timestamp: Date.now(),
        playerId: this.myPeerId!
      })
    }
  }

  // 获取当前房间信息
  getCurrentRoom(): Room | null {
    return this.currentRoom
  }

  // 离开房间
  leaveRoom(): void {
    if (this.currentRoom) {
      this.sendMessage({
        type: 'player_leave',
        data: { playerId: this.myPeerId },
        timestamp: Date.now(),
        playerId: this.myPeerId!
      })

      // 移除房间注册
      if (this.isHost) {
        roomRegistry.removeRoom(this.currentRoom.connectionCode)
      }
    }
    
    // 关闭所有连接
    this.connections.forEach((connection) => {
      connection.close()
    })
    this.connections.clear()
    
    this.peerSignaling.disconnect()
    this.currentRoom = null
    this.isHost = false
  }

  // 生成房间ID
  private generateRoomId(): string {
    return Math.random().toString(36).substring(2, 15)
  }

  // 生成6位连接码
  private generateConnectionCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }
}

// 全局房间管理器实例
export const roomManager = new RoomManager()
