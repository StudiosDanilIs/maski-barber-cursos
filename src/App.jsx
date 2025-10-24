import React, { useState } from 'react'
import Login from './components/Login'
import Courses from './components/Courses'

export default function App(){
  const [token, setToken] = useState(localStorage.getItem('token')||null)
  if(!token) return <div className="min-h-screen flex items-center justify-center"><Login onLogin={t=>{localStorage.setItem('token', t); setToken(t)}} /></div>
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Plataforma de Cursos</h1>
        <button onClick={()=>{localStorage.removeItem('token'); setToken(null)}} className="px-3 py-1 border rounded">Cerrar sesión</button>
      </header>
      <Courses token={token} />
    </div>
  )
}
