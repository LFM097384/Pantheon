import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ChatMessage } from '../../../types'

interface ChatState {
  messages: ChatMessage[]
  isConnected: boolean
}

const initialState: ChatState = {
  messages: [],
  isConnected: false,
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload)
    },
    setMessages: (state, action: PayloadAction<ChatMessage[]>) => {
      state.messages = action.payload
    },
    clearMessages: (state) => {
      state.messages = []
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload
    },
  },
})

export const { addMessage, setMessages, clearMessages, setConnected } = chatSlice.actions
export default chatSlice.reducer
