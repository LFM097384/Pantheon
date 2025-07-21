import React from 'react'
import { Card, Row, Col, Button, Typography, Space, Statistic, Alert } from 'antd'
import { PlusOutlined, TeamOutlined, UserOutlined, SettingOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store'
import { logout } from '../store/slices/userSlice'
import DiceRoller from '../components/DiceRoller'

const { Title, Paragraph } = Typography

const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { currentUser } = useSelector((state: RootState) => state.user)

  const quickActions = currentUser?.role === 'dm' ? [
    {
      title: '创建房间',
      description: '开启一个新的P2P跑团房间',
      icon: <PlusOutlined />,
      action: () => navigate('/dm/lobby'),
      color: '#722ed1',
    },
    {
      title: '角色管理',
      description: '管理NPC和玩家角色',
      icon: <UserOutlined />,
      action: () => navigate('/character'),
      color: '#13c2c2',
    },
  ] : [
    {
      title: '加入房间',
      description: '使用连接码加入DM房间',
      icon: <TeamOutlined />,
      action: () => navigate('/player/lobby'),
      color: '#722ed1',
    },
    {
      title: '角色管理',
      description: '创建和编辑你的角色',
      icon: <UserOutlined />,
      action: () => navigate('/character'),
      color: '#13c2c2',
    },
  ]

  const handleLogout = () => {
    localStorage.removeItem('pantheon_user')
    dispatch(logout())
  }

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2}>
            欢迎来到 Pantheon 众神殿 🎲
          </Title>
          <Paragraph>
            本地P2P跑团软件，无需服务器，直接连接开始游戏
          </Paragraph>
        </div>

        {currentUser && (
          <Card>
            <Row gutter={[16, 16]} align="middle">
              <Col span={18}>
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Statistic 
                      title="当前身份" 
                      value={currentUser.role === 'dm' ? '🎭 DM 主持人' : '🎲 玩家'} 
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic 
                      title="用户名" 
                      value={currentUser.name} 
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic 
                      title="本次会话" 
                      value="活跃中"
                      valueStyle={{ color: '#3f8600' }}
                    />
                  </Col>
                </Row>
              </Col>
              <Col span={6} style={{ textAlign: 'right' }}>
                <Space>
                  <Button 
                    icon={<SettingOutlined />}
                    onClick={() => navigate('/setup')}
                  >
                    重新设置
                  </Button>
                  <Button 
                    danger
                    onClick={handleLogout}
                  >
                    退出
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        )}

        <Alert
          message="🌟 P2P连接模式"
          description="Pantheon使用点对点技术，DM创建房间后生成连接码，玩家使用连接码直接连接，无需中央服务器。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Row gutter={[24, 24]}>
          {/* 快速操作 */}
          <Col span={12}>
            <Card title="🚀 快速开始" style={{ height: '100%' }}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {quickActions.map((action, index) => (
                  <Card
                    key={index}
                    hoverable
                    onClick={action.action}
                    style={{ 
                      borderColor: action.color,
                      cursor: 'pointer',
                      borderWidth: 2
                    }}
                    bodyStyle={{ padding: '16px' }}
                  >
                    <Space align="center">
                      <div style={{ fontSize: '24px', color: action.color }}>
                        {action.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                          {action.title}
                        </div>
                        <div style={{ color: '#666', fontSize: '12px' }}>
                          {action.description}
                        </div>
                      </div>
                    </Space>
                  </Card>
                ))}
              </Space>
            </Card>
          </Col>

          {/* 骰子工具 */}
          <Col span={12}>
            <DiceRoller />
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Card title="📖 使用指南" size="small">
              <Space direction="vertical" size="small">
                <div><strong>DM用户：</strong></div>
                <div>1. 点击"创建房间"</div>
                <div>2. 设置房间信息</div>
                <div>3. 分享连接码给玩家</div>
                <div>4. 等待玩家连接</div>
              </Space>
            </Card>
          </Col>
          <Col span={8}>
            <Card title="🎮 玩家流程" size="small">
              <Space direction="vertical" size="small">
                <div><strong>玩家用户：</strong></div>
                <div>1. 获取DM的连接码</div>
                <div>2. 点击"加入房间"</div>
                <div>3. 输入连接码</div>
                <div>4. 等待DM接受连接</div>
              </Space>
            </Card>
          </Col>
          <Col span={8}>
            <Card title="💡 功能特性" size="small">
              <Space direction="vertical" size="small">
                <div>✅ 本地P2P连接</div>
                <div>✅ 实时语音通话</div>
                <div>✅ 骰子投掷工具</div>
                <div>✅ 角色卡管理</div>
                <div>🚧 地图和战斗</div>
              </Space>
            </Card>
          </Col>
        </Row>
      </Space>
    </div>
  )
}

export default HomePage
