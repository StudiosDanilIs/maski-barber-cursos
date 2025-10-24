import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Login from './components/Login'
import Courses from './components/Courses'

export default function App(){
  const [token, setToken] = useState(localStorage.getItem('token')||null)
  const [user, setUser] = useState(null)

  useEffect(()=>{
    if(token){
      localStorage.setItem('token', token)
      setUser({})
    } else {
      localStorage.removeItem('token')
      setUser(null)
    }
  },[token])

  if(!token) return <div className="min-h-screen flex items-center justify-center"><Login onLogin={t=>setToken(t)} /></div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Plataforma de Cursos</h1>
        <div>
          <button className="mr-3 px-3 py-1 rounded" onClick={()=>{setToken(null)}}>Cerrar sesión</button>
        </div>
      </header>
      <Courses token={token} />
    </div>
  )
}
