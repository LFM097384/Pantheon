import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout } from 'antd'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from './store'
import { setUser } from './store/slices/userSlice'
import Sidebar from './components/Layout/Sidebar'
import Header from './components/Layout/Header'
import HomePage from './pages/HomePage'
import UserSetup from './pages/UserSetup'
import DMLobby from './pages/DM/DMLobby'
import PlayerLobby from './pages/Player/PlayerLobby'
import GameRoom from './pages/GameRoom'
import CharacterSheet from './pages/CharacterSheet'

const { Content } = Layout

const App: React.FC = () => {
  const { currentUser } = useSelector((state: RootState) => state.user)
  const { sidebarCollapsed } = useSelector((state: RootState) => state.ui)
  const dispatch = useDispatch()

  // 检查本地存储的用户信息
  useEffect(() => {
    const savedUser = localStorage.getItem('pantheon_user')
    if (savedUser && !currentUser) {
      try {
        const user = JSON.parse(savedUser)
        dispatch(setUser(user))
      } catch (error) {
        console.error('解析用户信息失败:', error)
        localStorage.removeItem('pantheon_user')
      }
    }
  }, [dispatch, currentUser])

  const sidebarWidth = sidebarCollapsed ? 80 : 240

  return (
    <Layout style={{ height: '100vh' }}>
      <Header />
      <Layout>
        <Sidebar />
        <Layout style={{ marginLeft: sidebarWidth, transition: 'margin-left 0.2s' }}>
          <Content style={{ padding: '24px', overflow: 'auto' }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/dm/lobby" element={<DMLobby />} />
              <Route path="/player/lobby" element={<PlayerLobby />} />
              <Route path="/room/:roomId" element={<GameRoom />} />
              <Route path="/character" element={<CharacterSheet />} />
              <Route path="/setup" element={<UserSetup />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
}

export default App
