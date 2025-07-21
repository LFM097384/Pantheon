import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Character } from '../../../types'

interface CharacterState {
  characters: Character[]
  activeCharacter: Character | null
  isLoading: boolean
}

const initialState: CharacterState = {
  characters: [],
  activeCharacter: null,
  isLoading: false,
}

const characterSlice = createSlice({
  name: 'character',
  initialState,
  reducers: {
    setCharacters: (state, action: PayloadAction<Character[]>) => {
      state.characters = action.payload
    },
    addCharacter: (state, action: PayloadAction<Character>) => {
      state.characters.push(action.payload)
    },
    updateCharacter: (state, action: PayloadAction<Character>) => {
      const index = state.characters.findIndex(c => c.id === action.payload.id)
      if (index !== -1) {
        state.characters[index] = action.payload
      }
    },
    setActiveCharacter: (state, action: PayloadAction<Character | null>) => {
      state.activeCharacter = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
  },
})

export const {
  setCharacters,
  addCharacter,
  updateCharacter,
  setActiveCharacter,
  setLoading,
} = characterSlice.actions

export default characterSlice.reducer
