import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const style = document.createElement('style')
style.textContent = `
@keyframes slideUp { from { transform: translateY(12px); opacity:0 } to { transform:translateY(0); opacity:1 } }
`
document.head.appendChild(style)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
)
