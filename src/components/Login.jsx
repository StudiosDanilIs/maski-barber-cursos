import React, { useState } from 'react'
import axios from 'axios'

export default function Login({ onLogin }) {
  const [email,setEmail]=useState('admin@example.com')
  const [password,setPassword]=useState('password')

  const submit = async () => {
    try{
      const res = await axios.post('/.netlify/functions/login', { email, password })
      if(res.data && res.data.token){
        onLogin(res.data.token)
      } else alert('Respuesta inválida del servidor')
    }catch(e){
      alert('Error al iniciar sesión: '+(e.response?.data || e.message))
    }
  }

  return (
    <div className="w-full max-w-sm bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-medium mb-4">Iniciar sesión</h2>
      <label className="block text-sm">Correo</label>
      <input className="w-full p-2 border rounded mb-3" value={email} onChange={e=>setEmail(e.target.value)} />
      <label className="block text-sm">Contraseña</label>
      <input className="w-full p-2 border rounded mb-4" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button className="w-full py-2 bg-indigo-600 text-white rounded" onClick={submit}>Ingresar</button>
    </div>
  )
}
