import React from 'react'
import { Layout, Typography, Button, Space, Avatar, Dropdown, message } from 'antd'
import { MenuUnfoldOutlined, MenuFoldOutlined, SettingOutlined, UserOutlined, LoginOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RootState } from '../../store'
import { toggleSidebar } from '../../store/slices/uiSlice'
import { logout } from '../../store/slices/userSlice'

const { Header: AntHeader } = Layout
const { Title } = Typography

const Header: React.FC = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { sidebarCollapsed } = useSelector((state: RootState) => state.ui)
  const { currentUser } = useSelector((state: RootState) => state.user)

  const handleLogout = () => {
    dispatch(logout())
    localStorage.removeItem('pantheon_user')
    message.success('已退出登录')
  }

  const handleLogin = () => {
    navigate('/setup')
  }

  const userMenuItems = [
    {
      key: 'profile',
      label: '个人资料',
      icon: <UserOutlined />,
    },
    {
      key: 'settings',
      label: '设置',
      icon: <SettingOutlined />,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  return (
    <AntHeader style={{ 
      padding: '0 16px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      background: '#fff',
      borderBottom: '1px solid #f0f0f0'
    }}>
      <Space align="center">
        <Button
          type="text"
          icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => dispatch(toggleSidebar())}
          style={{ fontSize: '16px', width: 64, height: 64 }}
        />
        <Title level={3} style={{ margin: 0, color: '#722ed1' }}>
          Pantheon 众神殿
        </Title>
      </Space>

      <Space>
        {currentUser ? (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar src={currentUser.avatar} icon={<UserOutlined />} />
              <span>{currentUser.name}</span>
            </Space>
          </Dropdown>
        ) : (
          <Button 
            type="primary" 
            icon={<LoginOutlined />}
            onClick={handleLogin}
          >
            登录
          </Button>
        )}
      </Space>
    </AntHeader>
  )
}

export default Header
