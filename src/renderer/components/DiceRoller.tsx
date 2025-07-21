import React, { useState } from 'react'
import {
  Card,
  Button,
  Input,
  Space,
  Typography,
  List,
  Tag,
  message,
  Row,
  Col,
  Tooltip,
  Modal
} from 'antd'
import {
  DashboardOutlined,
  HistoryOutlined,
  DeleteOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography

interface DiceResult {
  id: string
  notation: string
  total: number
  rolls: number[]
  modifier: number
  breakdown: string
  timestamp: string
  reason?: string
}

interface DiceButtonConfig {
  label: string
  notation: string
  color: string
}

const DiceRoller: React.FC = () => {
  const [customNotation, setCustomNotation] = useState('')
  const [rollHistory, setRollHistory] = useState<DiceResult[]>([])
  const [reason, setReason] = useState('')
  const [helpVisible, setHelpVisible] = useState(false)

  // 预设骰子按钮
  const presetDice: DiceButtonConfig[] = [
    { label: 'D4', notation: '1d4', color: '#f50' },
    { label: 'D6', notation: '1d6', color: '#2db7f5' },
    { label: 'D8', notation: '1d8', color: '#87d068' },
    { label: 'D10', notation: '1d10', color: '#108ee9' },
    { label: 'D12', notation: '1d12', color: '#f56a00' },
    { label: 'D20', notation: '1d20', color: '#722ed1' },
    { label: 'D100', notation: '1d100', color: '#eb2f96' },
  ]

  const commonRolls: DiceButtonConfig[] = [
    { label: '属性检定', notation: '1d20', color: '#722ed1' },
    { label: '优势', notation: '2d20k1', color: '#52c41a' },
    { label: '劣势', notation: '2d20l1', color: '#f5222d' },
    { label: '伤害 (剑)', notation: '1d8+3', color: '#fa8c16' },
    { label: '治疗术', notation: '1d4+1', color: '#13c2c2' },
  ]

  // 解析骰子表达式
  const parseDiceNotation = (notation: string): { count: number; sides: number; modifier: number } => {
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
  const rollDice = (notation: string, rollReason?: string) => {
    try {
      const { count, sides, modifier } = parseDiceNotation(notation)
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
      
      const result: DiceResult = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        notation,
        total,
        rolls,
        modifier,
        breakdown,
        timestamp: new Date().toLocaleTimeString('zh-CN'),
        reason: rollReason || reason
      }
      
      setRollHistory(prev => [result, ...prev])
      
      // 播放音效提示（可选）
      message.success(`🎲 投掷结果: ${total}`)
      
      // 清空原因
      if (!rollReason) {
        setReason('')
      }
      
    } catch (error) {
      message.error((error as Error).message)
    }
  }

  // 快速投掷
  const quickRoll = (notation: string) => {
    rollDice(notation)
  }

  // 自定义投掷
  const handleCustomRoll = () => {
    if (!customNotation.trim()) {
      message.warning('请输入骰子表达式')
      return
    }
    rollDice(customNotation)
    setCustomNotation('')
  }

  // 清除历史
  const clearHistory = () => {
    setRollHistory([])
    message.info('投掷历史已清除')
  }

  return (
    <Card title={<Space><DashboardOutlined />骰子投掷器</Space>} style={{ height: '100%' }}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        
        {/* 投掷原因 */}
        <Input
          placeholder="投掷原因（可选）"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          style={{ marginBottom: 8 }}
        />

        {/* 预设骰子 */}
        <div>
          <Text strong style={{ marginBottom: 8, display: 'block' }}>
            标准骰子
            <Tooltip title="点击查看骰子表达式说明">
              <Button 
                type="link" 
                icon={<QuestionCircleOutlined />} 
                size="small"
                onClick={() => setHelpVisible(true)}
              />
            </Tooltip>
          </Text>
          <Space wrap>
            {presetDice.map(dice => (
              <Button
                key={dice.notation}
                onClick={() => quickRoll(dice.notation)}
                style={{ 
                  borderColor: dice.color,
                  color: dice.color
                }}
              >
                {dice.label}
              </Button>
            ))}
          </Space>
        </div>

        {/* 常用投掷 */}
        <div>
          <Text strong style={{ marginBottom: 8, display: 'block' }}>常用投掷</Text>
          <Space wrap>
            {commonRolls.map(roll => (
              <Button
                key={roll.notation}
                onClick={() => quickRoll(roll.notation)}
                style={{ 
                  borderColor: roll.color,
                  color: roll.color
                }}
              >
                {roll.label}
              </Button>
            ))}
          </Space>
        </div>

        {/* 自定义投掷 */}
        <div>
          <Text strong style={{ marginBottom: 8, display: 'block' }}>自定义表达式</Text>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder="例如: 2d6+3, 4d8-1"
              value={customNotation}
              onChange={(e) => setCustomNotation(e.target.value)}
              onPressEnter={handleCustomRoll}
            />
            <Button type="primary" onClick={handleCustomRoll}>
              投掷
            </Button>
          </Space.Compact>
        </div>

        {/* 投掷历史 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text strong>
              <HistoryOutlined /> 投掷历史
            </Text>
            {rollHistory.length > 0 && (
              <Button 
                size="small" 
                icon={<DeleteOutlined />} 
                onClick={clearHistory}
                danger
              >
                清除
              </Button>
            )}
          </div>
          
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {rollHistory.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#666', padding: '20px 0' }}>
                还没有投掷记录
              </div>
            ) : (
              <List
                size="small"
                dataSource={rollHistory}
                renderItem={(result) => (
                  <List.Item
                    key={result.id}
                    style={{ padding: '8px 0' }}
                  >
                    <div style={{ width: '100%' }}>
                      <Row justify="space-between" align="middle">
                        <Col>
                          <Space direction="vertical" size={2}>
                            <div>
                              <Tag color="blue">{result.notation}</Tag>
                              <Text strong style={{ fontSize: '16px' }}>
                                {result.total}
                              </Text>
                              {result.reason && (
                                <Text type="secondary" style={{ marginLeft: 8 }}>
                                  ({result.reason})
                                </Text>
                              )}
                            </div>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {result.breakdown}
                            </Text>
                          </Space>
                        </Col>
                        <Col>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {result.timestamp}
                          </Text>
                        </Col>
                      </Row>
                    </div>
                  </List.Item>
                )}
              />
            )}
          </div>
        </div>
      </Space>

      {/* 帮助对话框 */}
      <Modal
        title="骰子表达式说明"
        open={helpVisible}
        onCancel={() => setHelpVisible(false)}
        footer={[
          <Button key="close" onClick={() => setHelpVisible(false)}>
            关闭
          </Button>
        ]}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Title level={5}>基本格式</Title>
            <p><code>XdY+Z</code> - 投掷X个Y面骰子，加上修正值Z</p>
          </div>
          
          <div>
            <Title level={5}>示例</Title>
            <ul>
              <li><code>1d20</code> - 投掷1个20面骰子</li>
              <li><code>2d6+3</code> - 投掷2个6面骰子，加3</li>
              <li><code>4d8-1</code> - 投掷4个8面骰子，减1</li>
              <li><code>d6</code> - 投掷1个6面骰子（省略1）</li>
            </ul>
          </div>

          <div>
            <Title level={5}>特殊功能（即将支持）</Title>
            <ul>
              <li><code>2d20k1</code> - 投掷2个d20，取最高值（优势）</li>
              <li><code>2d20l1</code> - 投掷2个d20，取最低值（劣势）</li>
              <li><code>4d6d1</code> - 投掷4个d6，丢弃最低值</li>
            </ul>
          </div>
        </Space>
      </Modal>
    </Card>
  )
}

export default DiceRoller
