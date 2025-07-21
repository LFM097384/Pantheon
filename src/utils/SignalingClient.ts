// 信令服务器客户端 - 用于 WebRTC 连接建立
export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join-room' | 'leave-room' | 'room-full' | 'peer-joined' | 'peer-left'
  roomCode?: string
  peerId?: string
  data?: any
}

export class SignalingClient {
  private ws: WebSocket | null = null
  private callbacks: {
    onMessage?: (message: SignalingMessage) => void
    onConnected?: () => void
    onDisconnected?: () => void
    onError?: (error: Error) => void
  } = {}

  // 使用免费的信令服务器或自部署
  private readonly SIGNALING_SERVER = 'wss://connect.peerjs.com/peerjs'
  // 备用方案：'wss://signaling.yourdomain.com'

  constructor(callbacks: typeof this.callbacks = {}) {
    this.callbacks = callbacks
  }

  // 连接到信令服务器
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // 使用 PeerJS 的公共信令服务器
        this.ws = new WebSocket(`${this.SIGNALING_SERVER}?key=peerjs&id=${this.generatePeerId()}`)
        
        this.ws.onopen = () => {
          console.log('信令服务器连接成功')
          this.callbacks.onConnected?.()
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as SignalingMessage
            this.callbacks.onMessage?.(message)
          } catch (error) {
            console.error('解析信令消息失败:', error)
          }
        }

        this.ws.onclose = () => {
          console.log('信令服务器连接关闭')
          this.callbacks.onDisconnected?.()
        }

        this.ws.onerror = (error) => {
          console.error('信令服务器连接错误:', error)
          this.callbacks.onError?.(new Error('信令服务器连接失败'))
          reject(error)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  // 加入房间
  joinRoom(roomCode: string, peerId: string): void {
    this.sendMessage({
      type: 'join-room',
      roomCode,
      peerId
    })
  }

  // 离开房间
  leaveRoom(roomCode: string, peerId: string): void {
    this.sendMessage({
      type: 'leave-room',
      roomCode,
      peerId
    })
  }

  // 发送 WebRTC offer
  sendOffer(roomCode: string, peerId: string, offer: RTCSessionDescriptionInit): void {
    this.sendMessage({
      type: 'offer',
      roomCode,
      peerId,
      data: offer
    })
  }

  // 发送 WebRTC answer
  sendAnswer(roomCode: string, peerId: string, answer: RTCSessionDescriptionInit): void {
    this.sendMessage({
      type: 'answer',
      roomCode,
      peerId,
      data: answer
    })
  }

  // 发送 ICE candidate
  sendIceCandidate(roomCode: string, peerId: string, candidate: RTCIceCandidate): void {
    this.sendMessage({
      type: 'ice-candidate',
      roomCode,
      peerId,
      data: candidate
    })
  }

  // 发送消息到信令服务器
  private sendMessage(message: SignalingMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.error('信令服务器未连接')
    }
  }

  // 生成唯一的 Peer ID
  private generatePeerId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  // 断开连接
  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

// 使用 PeerJS 的简化版本（推荐方案）
export class PeerJSSignaling {
  private peer: any = null // PeerJS 实例
  private callbacks: {
    onConnection?: (conn: any) => void
    onCall?: (call: any) => void
    onError?: (error: Error) => void
  } = {}

  constructor(callbacks: typeof this.callbacks = {}) {
    this.callbacks = callbacks
  }

  // 初始化 PeerJS
  async initialize(peerId?: string): Promise<string> {
    // 需要安装 peerjs: npm install peerjs
    const Peer = (window as any).Peer || require('peerjs')
    
    return new Promise((resolve, reject) => {
      this.peer = new Peer(peerId, {
        host: 'peerjs.com',
        port: 443,
        path: '/peerjs',
        secure: true,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            // 添加 TURN 服务器用于 NAT 穿透
            {
              urls: 'turn:openrelay.metered.ca:80',
              username: 'openrelayproject',
              credential: 'openrelayproject'
            },
            {
              urls: 'turn:openrelay.metered.ca:443',
              username: 'openrelayproject',
              credential: 'openrelayproject'
            }
          ]
        }
      })

      this.peer.on('open', (id: string) => {
        console.log('PeerJS 连接成功, ID:', id)
        resolve(id)
      })

      this.peer.on('connection', (conn: any) => {
        console.log('收到新连接:', conn.peer)
        this.callbacks.onConnection?.(conn)
      })

      this.peer.on('call', (call: any) => {
        console.log('收到通话请求:', call.peer)
        this.callbacks.onCall?.(call)
      })

      this.peer.on('error', (error: Error) => {
        console.error('PeerJS 错误:', error)
        this.callbacks.onError?.(error)
        reject(error)
      })
    })
  }

  // 连接到另一个 peer
  connectToPeer(peerId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.peer) {
        reject(new Error('PeerJS 未初始化'))
        return
      }

      const conn = this.peer.connect(peerId)
      
      conn.on('open', () => {
        console.log('连接到 peer 成功:', peerId)
        resolve(conn)
      })

      conn.on('error', (error: Error) => {
        console.error('连接 peer 失败:', error)
        reject(error)
      })
    })
  }

  // 获取当前 peer ID
  getPeerId(): string | null {
    return this.peer ? this.peer.id : null
  }

  // 断开连接
  disconnect(): void {
    if (this.peer) {
      this.peer.destroy()
      this.peer = null
    }
  }
}
