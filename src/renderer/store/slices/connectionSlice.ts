import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ConnectionState } from '../../../types'

const initialState: ConnectionState = {
  isConnected: false,
  peers: {},
  localStream: undefined,
}

const connectionSlice = createSlice({
  name: 'connection',
  initialState,
  reducers: {
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload
    },
    addPeer: (state, action: PayloadAction<{ id: string; connection: RTCPeerConnection }>) => {
      state.peers[action.payload.id] = action.payload.connection
    },
    removePeer: (state, action: PayloadAction<string>) => {
      delete state.peers[action.payload]
    },
    setLocalStream: (state, action: PayloadAction<MediaStream | undefined>) => {
      state.localStream = action.payload
    },
    clearConnections: (state) => {
      state.isConnected = false
      state.peers = {}
      state.localStream = undefined
    },
  },
})

export const {
  setConnected,
  addPeer,
  removePeer,
  setLocalStream,
  clearConnections,
} = connectionSlice.actions

export default connectionSlice.reducer
