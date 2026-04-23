import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// 🔥 TAMBAHAN
import { MapProvider } from "./context/MapContext";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* 🔥 WRAP DI SINI */}
      <MapProvider>
        <App />
      </MapProvider>
    </BrowserRouter>
  </React.StrictMode>,
)