// WebRTC 连接管理器
export class ConnectionManager {
  private peers: Map<string, RTCPeerConnection> = new Map()
  private localStream: MediaStream | null = null
  private callbacks: {
    onPeerJoin?: (peerId: string) => void
    onPeerLeave?: (peerId: string) => void
    onMessage?: (peerId: string, message: any) => void
    onStreamReceived?: (peerId: string, stream: MediaStream) => void
  } = {}

  constructor(callbacks: typeof this.callbacks = {}) {
    this.callbacks = callbacks
  }

  // 初始化本地媒体流
  async initializeMedia(audioOnly: boolean = false): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: !audioOnly
      })
      return this.localStream
    } catch (error) {
      console.error('获取媒体设备失败:', error)
      throw error
    }
  }

  // 创建新的peer连接
  createPeerConnection(peerId: string): RTCPeerConnection {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    })

    // 添加本地流
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream!)
      })
    }

    // 处理远程流
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams
      this.callbacks.onStreamReceived?.(peerId, remoteStream)
    }

    // 处理ICE候选者
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // 发送ICE候选者给对方
        this.sendSignalingMessage(peerId, {
          type: 'ice-candidate',
          candidate: event.candidate
        })
      }
    }

    // 连接状态变化
    peerConnection.onconnectionstatechange = () => {
      console.log(`Peer ${peerId} connection state:`, peerConnection.connectionState)
      if (peerConnection.connectionState === 'disconnected') {
        this.removePeer(peerId)
      }
    }

    this.peers.set(peerId, peerConnection)
    this.callbacks.onPeerJoin?.(peerId)
    
    return peerConnection
  }

  // 创建offer
  async createOffer(peerId: string): Promise<RTCSessionDescriptionInit> {
    const peerConnection = this.peers.get(peerId)
    if (!peerConnection) {
      throw new Error(`Peer ${peerId} not found`)
    }

    const offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)
    
    return offer
  }

  // 创建answer
  async createAnswer(peerId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    const peerConnection = this.peers.get(peerId)
    if (!peerConnection) {
      throw new Error(`Peer ${peerId} not found`)
    }

    await peerConnection.setRemoteDescription(offer)
    const answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)
    
    return answer
  }

  // 处理answer
  async handleAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const peerConnection = this.peers.get(peerId)
    if (!peerConnection) {
      throw new Error(`Peer ${peerId} not found`)
    }

    await peerConnection.setRemoteDescription(answer)
  }

  // 处理ICE候选者
  async handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peerConnection = this.peers.get(peerId)
    if (!peerConnection) {
      throw new Error(`Peer ${peerId} not found`)
    }

    await peerConnection.addIceCandidate(candidate)
  }

  // 移除peer连接
  removePeer(peerId: string): void {
    const peerConnection = this.peers.get(peerId)
    if (peerConnection) {
      peerConnection.close()
      this.peers.delete(peerId)
      this.callbacks.onPeerLeave?.(peerId)
    }
  }

  // 发送信令消息（需要由上层实现）
  private sendSignalingMessage(peerId: string, message: any): void {
    // 这里应该通过Socket.IO或其他信令服务器发送消息
    console.log('发送信令消息到', peerId, message)
  }

  // 广播消息给所有peers
  broadcastMessage(message: any, excludePeerId?: string): void {
    this.peers.forEach((peer, peerId) => {
      if (excludePeerId && peerId === excludePeerId) return
      
      const dataChannel = peer.createDataChannel('messages')
      if (dataChannel.readyState === 'open') {
        dataChannel.send(JSON.stringify(message))
      }
    })
  }

  // 发送消息给主机
  sendMessageToHost(message: any): void {
    // 假设第一个peer是主机
    const hostPeerId = this.getPeerIds()[0]
    if (hostPeerId) {
      this.sendMessage(hostPeerId, message)
    }
  }

  // 发送消息给特定peer
  sendMessage(peerId: string, message: any): void {
    const peer = this.peers.get(peerId)
    if (peer) {
      const dataChannel = peer.createDataChannel('messages')
      if (dataChannel.readyState === 'open') {
        dataChannel.send(JSON.stringify(message))
      }
    }
  }

  // 切换音频
  toggleAudio(): boolean {
    if (!this.localStream) return false
    
    const audioTrack = this.localStream.getAudioTracks()[0]
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled
      return audioTrack.enabled
    }
    return false
  }

  // 切换视频
  toggleVideo(): boolean {
    if (!this.localStream) return false
    
    const videoTrack = this.localStream.getVideoTracks()[0]
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled
      return videoTrack.enabled
    }
    return false
  }

  // 清理所有连接
  cleanup(): void {
    this.peers.forEach((_peer, peerId) => {
      this.removePeer(peerId)
    })
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }
  }

  // 获取所有peer ID
  getPeerIds(): string[] {
    return Array.from(this.peers.keys())
  }

  // 获取本地流
  getLocalStream(): MediaStream | null {
    return this.localStream
  }

  // 断开所有连接
  disconnect(): void {
    this.cleanup()
  }
}
