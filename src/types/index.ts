// 用户相关类型
export interface User {
  id: string
  name: string
  avatar?: string
  role: 'dm' | 'player'
  isOnline: boolean
}

// 房间相关类型
export interface Room {
  id: string
  name: string
  description?: string
  dmId: string
  players: User[]
  maxPlayers: number
  isPrivate: boolean
  gameSystem: GameSystem
  status: 'waiting' | 'playing' | 'paused'
  createdAt: string
}

export interface RoomConfig {
  name: string
  description?: string
  maxPlayers: number
  isPrivate: boolean
  password?: string
  gameSystem: GameSystem
}

// 游戏系统类型
export type GameSystem = 'dnd5e' | 'pathfinder' | 'coc' | 'custom'

// 角色卡相关类型
export interface Character {
  id: string
  playerId: string
  name: string
  level: number
  race: string
  class: string
  background: string
  attributes: CharacterAttributes
  skills: CharacterSkill[]
  equipment: Equipment[]
  spells?: Spell[]
  notes?: string
  avatar?: string
}

export interface CharacterAttributes {
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
  hitPoints: number
  maxHitPoints: number
  armorClass: number
  speed: number
}

export interface CharacterSkill {
  name: string
  modifier: number
  proficient: boolean
}

export interface Equipment {
  id: string
  name: string
  type: 'weapon' | 'armor' | 'tool' | 'consumable' | 'misc'
  quantity: number
  equipped?: boolean
  description?: string
}

export interface Spell {
  id: string
  name: string
  level: number
  school: string
  castingTime: string
  range: string
  duration: string
  description: string
  prepared?: boolean
}

// 聊天消息类型
export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  content: string
  type: 'text' | 'dice' | 'system' | 'whisper'
  timestamp: string
  targetId?: string // for whispers
}

// 骰子相关类型
export interface DiceRoll {
  notation: string // e.g., "2d6+3"
  result: number
  rolls: number[]
  modifier: number
  reason?: string
}

// WebRTC 连接状态
export interface ConnectionState {
  isConnected: boolean
  peers: Record<string, RTCPeerConnection>
  localStream?: MediaStream
}

// 应用状态类型
export interface AppState {
  user: User | null
  currentRoom: Room | null
  characters: Character[]
  chatMessages: ChatMessage[]
  connection: ConnectionState
  ui: {
    sidebarCollapsed: boolean
    currentPage: string
    theme: 'light' | 'dark'
  }
}
