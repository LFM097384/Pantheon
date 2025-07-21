import React from 'react'
import { Layout, Menu } from 'antd'
import { 
  HomeOutlined, 
  UserOutlined, 
  TeamOutlined, 
  SettingOutlined,
  PlayCircleOutlined,
  BookOutlined 
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'

const { Sider } = Layout

const Sidebar: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { sidebarCollapsed } = useSelector((state: RootState) => state.ui)
  const { currentUser } = useSelector((state: RootState) => state.user)

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/character',
      icon: <UserOutlined />,
      label: '角色卡',
    },
    ...(currentUser?.role === 'dm' ? [
      {
        key: '/dm',
        icon: <PlayCircleOutlined />,
        label: 'DM 控制台',
        children: [
          {
            key: '/dm/lobby',
            label: 'DM 大厅',
          },
          {
            key: '/dm/scenarios',
            label: '模组管理',
          },
        ],
      },
    ] : [
      {
        key: '/player',
        icon: <TeamOutlined />,
        label: '玩家大厅',
        children: [
          {
            key: '/player/lobby',
            label: '房间列表',
          },
          {
            key: '/player/history',
            label: '游戏历史',
          },
        ],
      },
    ]),
    {
      key: '/library',
      icon: <BookOutlined />,
      label: '资源库',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  return (
    <Sider 
      trigger={null} 
      collapsible 
      collapsed={sidebarCollapsed}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 64, // Header height
        zIndex: 100,
      }}
      width={240}
    >
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        onClick={handleMenuClick}
        items={menuItems}
        style={{ borderRight: 0 }}
      />
    </Sider>
  )
}

export default Sidebar
