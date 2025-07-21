import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Room } from '../../../types'

interface RoomState {
  currentRoom: Room | null
  availableRooms: Room[]
  isLoading: boolean
  error: string | null
}

const initialState: RoomState = {
  currentRoom: null,
  availableRooms: [],
  isLoading: false,
  error: null,
}

const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    setCurrentRoom: (state, action: PayloadAction<Room>) => {
      state.currentRoom = action.payload
    },
    updateRoom: (state, action: PayloadAction<Partial<Room>>) => {
      if (state.currentRoom) {
        state.currentRoom = { ...state.currentRoom, ...action.payload }
      }
    },
    setAvailableRooms: (state, action: PayloadAction<Room[]>) => {
      state.availableRooms = action.payload
    },
    addRoom: (state, action: PayloadAction<Room>) => {
      state.availableRooms.push(action.payload)
    },
    removeRoom: (state, action: PayloadAction<string>) => {
      state.availableRooms = state.availableRooms.filter(
        room => room.id !== action.payload
      )
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    leaveRoom: (state) => {
      state.currentRoom = null
    },
  },
})

export const {
  setCurrentRoom,
  updateRoom,
  setAvailableRooms,
  addRoom,
  removeRoom,
  setLoading,
  setError,
  leaveRoom,
} = roomSlice.actions

export default roomSlice.reducer
