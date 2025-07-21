import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UIState {
  sidebarCollapsed: boolean
  currentPage: string
  theme: 'light' | 'dark'
  isFullscreen: boolean
  notifications: Notification[]
}

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  duration?: number
}

const initialState: UIState = {
  sidebarCollapsed: false,
  currentPage: '/',
  theme: 'light',
  isFullscreen: false,
  notifications: [],
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload
    },
    setCurrentPage: (state, action: PayloadAction<string>) => {
      state.currentPage = action.payload
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload
    },
    setFullscreen: (state, action: PayloadAction<boolean>) => {
      state.isFullscreen = action.payload
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.push(action.payload)
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload)
    },
    clearNotifications: (state) => {
      state.notifications = []
    },
  },
})

export const {
  toggleSidebar,
  setSidebarCollapsed,
  setCurrentPage,
  setTheme,
  setFullscreen,
  addNotification,
  removeNotification,
  clearNotifications,
} = uiSlice.actions

export default uiSlice.reducer
