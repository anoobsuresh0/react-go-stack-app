import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getCounter, incrementCounter, decrementCounter, type Counter } from './api'

interface CounterState {
  counter: Counter | null
  loading: boolean
  updating: boolean
  error: string | null
}

const initialState: CounterState = {
  counter: null,
  loading: false,
  updating: false,
  error: null,
}

export const fetchCounter = createAsyncThunk('counter/fetch', async () => {
  return await getCounter()
})

export const increment = createAsyncThunk('counter/increment', async () => {
  return await incrementCounter()
})

export const decrement = createAsyncThunk('counter/decrement', async () => {
  return await decrementCounter()
})

const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCounter.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCounter.fulfilled, (state, action) => {
        state.loading = false
        state.counter = action.payload
      })
      .addCase(fetchCounter.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch counter'
      })
      .addCase(increment.pending, (state) => {
        state.updating = true
      })
      .addCase(increment.fulfilled, (state, action) => {
        state.updating = false
        state.counter = action.payload
      })
      .addCase(increment.rejected, (state, action) => {
        state.updating = false
        state.error = action.error.message || 'Failed to increment'
      })
      .addCase(decrement.pending, (state) => {
        state.updating = true
      })
      .addCase(decrement.fulfilled, (state, action) => {
        state.updating = false
        state.counter = action.payload
      })
      .addCase(decrement.rejected, (state, action) => {
        state.updating = false
        state.error = action.error.message || 'Failed to decrement'
      })
  },
})

export default counterSlice.reducer
