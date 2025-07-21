import React, { useState } from 'react'
import { 
  Card, 
  Button, 
  Form, 
  Input, 
  Select, 
  Space, 
  Typography, 
  message, 
  Table, 
  Tag,
  Modal,
  Row,
  Col,
  Statistic,
  Alert
} from 'antd'
import { 
  PlusOutlined, 
  ShareAltOutlined, 
  UsergroupAddOutlined,
  SettingOutlined,
  PlayCircleOutlined
} from '@ant-design/icons'
import { roomManager } from '../../../utils/RoomManager'

const { Title, Paragraph, Text } = Typography
const { Option } = Select

interface Room {
  id: string
  name: string
  gameSystem: string
  maxPlayers: number
  currentPlayers: number
  status: 'waiting' | 'playing'
  connectionCode: string
  createdAt: string
}

const DMLobby: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([])
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [shareModalVisible, setShareModalVisible] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  // 创建房间
  const handleCreateRoom = async (values: any) => {
    setLoading(true)
    try {
      // 使用 P2P 房间管理器创建房间
      const p2pRoom = await roomManager.createRoom({
        name: values.name,
        gameSystem: values.gameSystem,
        maxPlayers: values.maxPlayers
      })

      const newRoom: Room = {
        id: p2pRoom.id,
        name: p2pRoom.name,
        gameSystem: p2pRoom.gameSystem,
        maxPlayers: p2pRoom.maxPlayers,
        currentPlayers: 1, // DM本身
        status: 'waiting',
        connectionCode: p2pRoom.connectionCode,
        createdAt: new Date().toISOString()
      }

      setRooms(prev => [...prev, newRoom])
      setCreateModalVisible(false)
      form.resetFields()
      message.success(`房间创建成功！连接码: ${p2pRoom.connectionCode}`)
      
      // 监听房间消息
      roomManager.onMessage((roomMessage) => {
        console.log('收到房间消息:', roomMessage)
        if (roomMessage.type === 'player_join') {
          message.success(`玩家 ${roomMessage.data.playerName} 已加入房间`)
          // 更新房间玩家数量
          setRooms(prev => prev.map(room => 
            room.id === p2pRoom.id 
              ? { ...room, currentPlayers: room.currentPlayers + 1 }
              : room
          ))
        }
      })
      
      // 自动显示分享窗口
      setSelectedRoom(newRoom)
      setShareModalVisible(true)
    } catch (error) {
      message.error('创建房间失败')
    } finally {
      setLoading(false)
    }
  }

  // 分享房间
  const handleShareRoom = (room: Room) => {
    setSelectedRoom(room)
    setShareModalVisible(true)
  }

  // 复制连接码
  const copyConnectionCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      message.success('连接码已复制到剪贴板')
    } catch (error) {
      message.error('复制失败，请手动复制')
    }
  }

  // 开始游戏
  const startGame = (_room: Room) => {
    // 这里应该启动P2P连接
    message.info('正在启动游戏...')
    // TODO: 实现WebRTC连接逻辑
  }

  // 房间表格列定义
  const columns = [
    {
      title: '房间名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '游戏系统',
      dataIndex: 'gameSystem',
      key: 'gameSystem',
    },
    {
      title: '玩家',
      key: 'players',
      render: (_: any, record: Room) => (
        <Text>{record.currentPlayers}/{record.maxPlayers}</Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'playing' ? 'green' : 'blue'}>
          {status === 'playing' ? '游戏中' : '等待中'}
        </Tag>
      ),
    },
    {
      title: '连接码',
      dataIndex: 'connectionCode',
      key: 'connectionCode',
      render: (code: string) => (
        <Text code copyable={{ onCopy: () => copyConnectionCode(code) }}>
          {code}
        </Text>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Room) => (
        <Space>
          <Button 
            icon={<ShareAltOutlined />} 
            onClick={() => handleShareRoom(record)}
            size="small"
          >
            分享
          </Button>
          <Button 
            type="primary" 
            icon={<PlayCircleOutlined />}
            onClick={() => startGame(record)}
            disabled={record.currentPlayers < 2}
            size="small"
          >
            开始
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 标题和统计 */}
        <div>
          <Title level={2}>🎭 DM 控制台</Title>
          <Paragraph>创建和管理你的P2P跑团房间</Paragraph>
        </div>

        {/* 统计信息 */}
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic title="活跃房间" value={rooms.length} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="总玩家数" 
                value={rooms.reduce((sum, room) => sum + room.currentPlayers, 0)} 
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="游戏中房间" 
                value={rooms.filter(room => room.status === 'playing').length} 
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="本周游戏时长" value="12.5小时" />
            </Card>
          </Col>
        </Row>

        {/* 操作按钮 */}
        <Card>
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => setCreateModalVisible(true)}
              size="large"
            >
              创建新房间
            </Button>
            <Button icon={<SettingOutlined />} size="large">
              房间设置
            </Button>
          </Space>
        </Card>

        {/* P2P连接提示 */}
        <Alert
          message="P2P连接模式"
          description="Pantheon使用点对点连接，无需中央服务器。玩家通过连接码直接连接到你的房间。"
          type="info"
          showIcon
        />

        {/* 房间列表 */}
        <Card title="我的房间">
          <Table 
            columns={columns} 
            dataSource={rooms} 
            rowKey="id"
            pagination={false}
            locale={{ emptyText: '还没有创建房间，点击上方按钮创建第一个房间' }}
          />
        </Card>
      </Space>

      {/* 创建房间对话框 */}
      <Modal
        title="创建新房间"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateRoom}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="name"
            label="房间名称"
            rules={[{ required: true, message: '请输入房间名称' }]}
          >
            <Input placeholder="例如：龙与地下城 - 失落矿洞" />
          </Form.Item>

          <Form.Item
            name="gameSystem"
            label="游戏系统"
            rules={[{ required: true, message: '请选择游戏系统' }]}
            initialValue="dnd5e"
          >
            <Select>
              <Option value="dnd5e">D&D 5E</Option>
              <Option value="pathfinder">Pathfinder</Option>
              <Option value="coc">克苏鲁的呼唤</Option>
              <Option value="custom">自定义</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="maxPlayers"
            label="最大玩家数"
            rules={[{ required: true, message: '请选择最大玩家数' }]}
            initialValue={4}
          >
            <Select>
              <Option value={2}>2人</Option>
              <Option value={3}>3人</Option>
              <Option value={4}>4人</Option>
              <Option value={5}>5人</Option>
              <Option value={6}>6人</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCreateModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                创建房间
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 分享房间对话框 */}
      <Modal
        title="分享房间"
        open={shareModalVisible}
        onCancel={() => setShareModalVisible(false)}
        footer={null}
        width={500}
      >
        {selectedRoom && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Alert
              message="房间创建成功！"
              description="将连接码分享给玩家，他们可以直接连接到你的房间。"
              type="success"
              showIcon
            />
            
            <Card>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>房间名称：</Text>
                  <Text>{selectedRoom.name}</Text>
                </div>
                <div>
                  <Text strong>连接码：</Text>
                  <Text 
                    code 
                    copyable={{ onCopy: () => copyConnectionCode(selectedRoom.connectionCode) }}
                    style={{ fontSize: '18px', fontWeight: 'bold' }}
                  >
                    {selectedRoom.connectionCode}
                  </Text>
                </div>
              </Space>
            </Card>

            <div style={{ textAlign: 'center' }}>
              <Button 
                type="primary" 
                icon={<UsergroupAddOutlined />}
                onClick={() => copyConnectionCode(selectedRoom.connectionCode)}
                size="large"
              >
                复制连接码
              </Button>
            </div>
          </Space>
        )}
      </Modal>
    </div>
  )
}

export default DMLobby
