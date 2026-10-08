import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import '@fontsource/dm-sans/latin-400.css'
import '@fontsource/dm-sans/latin-500.css'
import '@fontsource/dm-sans/latin-600.css'
import '@fontsource/cormorant-garamond/latin-600.css'
import '@fontsource/cormorant-garamond/latin-600-italic.css'
import '@fontsource/bebas-neue/latin-400.css'
import App from './App'
import './index.css'
import { store } from './store'

const root = document.getElementById('root')
if (!root) throw new Error('Missing root element')

createRoot(root).render(
  <Provider store={store}>
    <App />
  </Provider>
)
