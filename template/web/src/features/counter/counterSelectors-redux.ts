import type { RootState } from '@/app/store'

export const selectCounter = (state: RootState) => state.counter.counter
export const selectCounterLoading = (state: RootState) => state.counter.loading
export const selectCounterUpdating = (state: RootState) => state.counter.updating
export const selectCounterError = (state: RootState) => state.counter.error
