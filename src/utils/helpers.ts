// 骰子工具函数
export interface DiceResult {
  notation: string
  total: number
  rolls: number[]
  modifier: number
  breakdown: string
}

export class DiceRoller {
  // 解析骰子表达式 (例如: "2d6+3", "1d20", "3d4-1")
  static parse(notation: string): { count: number; sides: number; modifier: number } {
    const regex = /^(\d+)?d(\d+)([+\-]\d+)?$/i
    const match = notation.trim().match(regex)
    
    if (!match) {
      throw new Error(`无效的骰子表达式: ${notation}`)
    }
    
    const count = parseInt(match[1] || '1')
    const sides = parseInt(match[2])
    const modifier = parseInt(match[3] || '0')
    
    if (count < 1 || count > 100) {
      throw new Error('骰子数量必须在1-100之间')
    }
    
    if (sides < 2 || sides > 1000) {
      throw new Error('骰子面数必须在2-1000之间')
    }
    
    return { count, sides, modifier }
  }
  
  // 投掷骰子
  static roll(notation: string): DiceResult {
    const { count, sides, modifier } = this.parse(notation)
    const rolls: number[] = []
    
    for (let i = 0; i < count; i++) {
      rolls.push(Math.floor(Math.random() * sides) + 1)
    }
    
    const rollSum = rolls.reduce((sum, roll) => sum + roll, 0)
    const total = rollSum + modifier
    
    let breakdown = rolls.join(' + ')
    if (modifier !== 0) {
      breakdown += modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`
    }
    breakdown += ` = ${total}`
    
    return {
      notation,
      total,
      rolls,
      modifier,
      breakdown
    }
  }
  
  // 优势投掷（取较高值）
  static rollAdvantage(notation: string): DiceResult {
    const result1 = this.roll(notation)
    const result2 = this.roll(notation)
    
    if (result1.total >= result2.total) {
      return {
        ...result1,
        breakdown: `优势: [${result1.breakdown}] vs [${result2.breakdown}] 取较高值`
      }
    } else {
      return {
        ...result2,
        breakdown: `优势: [${result1.breakdown}] vs [${result2.breakdown}] 取较高值`
      }
    }
  }
  
  // 劣势投掷（取较低值）
  static rollDisadvantage(notation: string): DiceResult {
    const result1 = this.roll(notation)
    const result2 = this.roll(notation)
    
    if (result1.total <= result2.total) {
      return {
        ...result1,
        breakdown: `劣势: [${result1.breakdown}] vs [${result2.breakdown}] 取较低值`
      }
    } else {
      return {
        ...result2,
        breakdown: `劣势: [${result1.breakdown}] vs [${result2.breakdown}] 取较低值`
      }
    }
  }
}

// 其他工具函数
export const formatDate = (date: Date | string): string => {
  const d = new Date(date)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9)
}

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void => {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void => {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}
