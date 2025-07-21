import React, { useState } from 'react'
import { Card, Form, Input, Button, Radio, message, Space, Typography } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { setUser } from '../store/slices/userSlice'

const { Title, Paragraph } = Typography

interface UserSetupForm {
  name: string
  role: 'dm' | 'player'
}

const UserSetup: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const generateId = (): string => {
    return Math.random().toString(36).substr(2, 9)
  }

  const handleFinish = async (values: UserSetupForm) => {
    setLoading(true)
    try {
      const user = {
        id: generateId(),
        name: values.name,
        role: values.role,
        isOnline: true
      }
      
      // 保存到本地存储
      localStorage.setItem('pantheon_user', JSON.stringify(user))
      dispatch(setUser(user))
      message.success('设置完成！')
      
      // 根据角色跳转到对应页面
      if (values.role === 'dm') {
        navigate('/dm/lobby')
      } else {
        navigate('/player/lobby')
      }
    } catch (error) {
      message.error('设置失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      height: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Card
        style={{ 
          width: 500, 
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}
        bodyStyle={{ padding: '40px' }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
          <div>
            <Title level={2} style={{ color: '#722ed1', marginBottom: 8 }}>
              欢迎来到 Pantheon 众神殿
            </Title>
            <Paragraph type="secondary">
              本地P2P跑团软件 - 设置你的用户信息开始游戏
            </Paragraph>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            size="large"
            style={{ width: '100%' }}
          >
            <Form.Item
              name="name"
              label="用户名"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 2, max: 20, message: '用户名长度为2-20字符' }
              ]}
            >
              <Input placeholder="请输入你的用户名" prefix={<UserOutlined />} />
            </Form.Item>

            <Form.Item
              name="role"
              label="选择角色"
              rules={[{ required: true, message: '请选择你的角色' }]}
            >
              <Radio.Group style={{ width: '100%' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Radio value="dm" style={{ width: '100%', padding: '12px', border: '1px solid #d9d9d9', borderRadius: 8 }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>🎭 DM (主持人)</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>创建P2P房间，主持游戏</div>
                    </div>
                  </Radio>
                  <Radio value="player" style={{ width: '100%', padding: '12px', border: '1px solid #d9d9d9', borderRadius: 8 }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>🎲 玩家</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>连接DM房间，参与游戏</div>
                    </div>
                  </Radio>
                </Space>
              </Radio.Group>
            </Form.Item>

            <Form.Item style={{ marginTop: 32 }}>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                style={{ 
                  width: '100%', 
                  height: 48,
                  background: 'linear-gradient(135deg, #722ed1 0%, #9c27b0 100%)',
                  border: 'none',
                  borderRadius: 8
                }}
              >
                开始使用 Pantheon
              </Button>
            </Form.Item>
          </Form>

          <Paragraph type="secondary" style={{ fontSize: '12px', marginTop: 16 }}>
            💡 提示：DM可以创建房间并分享连接码，玩家通过连接码加入房间
          </Paragraph>
        </Space>
      </Card>
    </div>
  )
}

export default UserSetup
