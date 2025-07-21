import { configureStore } from '@reduxjs/toolkit'
import userSlice from './slices/userSlice'
import roomSlice from './slices/roomSlice'
import characterSlice from './slices/characterSlice'
import chatSlice from './slices/chatSlice'
import connectionSlice from './slices/connectionSlice'
import uiSlice from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    user: userSlice,
    room: roomSlice,
    character: characterSlice,
    chat: chatSlice,
    connection: connectionSlice,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // 忽略 WebRTC 相关的非序列化值
        ignoredPaths: ['connection.peers', 'connection.localStream'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
