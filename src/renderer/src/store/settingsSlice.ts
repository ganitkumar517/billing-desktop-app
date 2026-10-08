import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { defaultSettings, type Settings } from '@shared/types'
import { bootstrap, exportDraftPdf, persistDraft, printDraft } from './invoiceSlice'

export const saveSettings = createAsyncThunk<Settings, Settings, { rejectValue: string }>(
  'settings/save',
  async (settings, { rejectWithValue }) => {
    try {
      return await window.billing.saveSettings(settings)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save studio details.'
      return rejectWithValue(message)
    }
  }
)

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    current: defaultSettings,
    dataPath: ''
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(bootstrap.fulfilled, (state, action) => {
        state.current = action.payload.settings
        state.dataPath = action.payload.dataPath
      })
      .addCase(saveSettings.fulfilled, (state, action) => {
        state.current = action.payload
      })
      .addCase(persistDraft.fulfilled, (state, action) => {
        state.current = action.payload.settings
      })
      .addCase(printDraft.fulfilled, (state, action) => {
        state.current = action.payload.settings
      })
      .addCase(exportDraftPdf.fulfilled, (state, action) => {
        state.current = action.payload.settings
      })
  }
})

export default settingsSlice.reducer
