import { configureStore } from '@reduxjs/toolkit'
import invoiceReducer from './invoiceSlice'
import settingsReducer from './settingsSlice'

export const store = configureStore({
  reducer: {
    invoice: invoiceReducer,
    settings: settingsReducer
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
