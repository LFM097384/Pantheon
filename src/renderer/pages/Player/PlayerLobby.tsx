import React, { useState } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Space,
  message,
  Alert
} from 'antd'
import { 
  LinkOutlined,
  UsergroupAddOutlined
} from '@ant-design/icons'
import { roomManager } from '../../../utils/RoomManager'

const { Title, Paragraph } = Typography

const PlayerLobby: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  
  // 加入房间
  const handleJoinRoom = async (values: { connectionCode: string }) => {
    setLoading(true)
    try {
      const code = values.connectionCode.toUpperCase().trim()
      
      if (code.length !== 6) {
        message.error('连接码格式错误，应为6位字符')
        return
      }

      message.loading('正在连接房间...', 2)
      
      // 使用 P2P 房间管理器加入房间
      await roomManager.joinRoom(code)
      
      message.success('成功连接到房间！')
      form.resetFields()
      
      // 监听房间消息
      roomManager.onMessage((roomMessage) => {
        console.log('收到房间消息:', roomMessage)
        if (roomMessage.type === 'dice_roll') {
          message.info(`${roomMessage.playerId} 投掷了骰子: ${roomMessage.data.result}`)
        } else if (roomMessage.type === 'chat') {
          console.log('聊天消息:', roomMessage.data.message)
        }
      })
      
    } catch (error) {
      message.error('连接失败，请检查连接码是否正确')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2}>🎲 玩家大厅</Title>
          <Paragraph>连接到DM的房间开始你的冒险之旅</Paragraph>
        </div>

        <Alert
          message="点对点连接"
          description="Pantheon使用P2P技术，你可以直接连接到DM的房间，无需注册账号。"
          type="info"
          showIcon
        />

        <Card title={<Space><LinkOutlined />加入房间</Space>} style={{ maxWidth: 600 }}>
          <Form form={form} layout="vertical" onFinish={handleJoinRoom}>
            <Form.Item
              name="connectionCode"
              label="房间连接码"
              rules={[
                { required: true, message: '请输入连接码' },
                { len: 6, message: '连接码为6位字符' }
              ]}
            >
              <Input 
                placeholder="输入6位连接码，如：ABC123"
                style={{ fontSize: '16px', textAlign: 'center' }}
                maxLength={6}
              />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<UsergroupAddOutlined />}
                style={{ width: '100%' }}
                size="large"
              >
                连接房间
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Space>
    </div>
  )
}

export default PlayerLobby
