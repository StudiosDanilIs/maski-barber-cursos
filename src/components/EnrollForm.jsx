import React, { useState } from 'react'
import axios from 'axios'

export default function EnrollForm({ course, token, onClose }){
  const [paymentMethod, setPaymentMethod] = useState('transfer')
  const [file, setFile] = useState(null)
  const [notes, setNotes] = useState('')

  const submit = async () => {
    try{
      const fd = new FormData()
      fd.append('courseId', course.id)
      fd.append('paymentMethod', paymentMethod)
      fd.append('notes', notes)
      if(file) fd.append('paymentProof', file)

      const res = await axios.post('/.netlify/functions/enroll', fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      })
      alert('Solicitud enviada')
      onClose()
    }catch(e){
      alert('Error: '+(e.response?.data || e.message))
    }
  }

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-semibold mb-2">Inscribirse en: {course.title}</h3>
      <label className="block text-sm">Método de pago</label>
      <select value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)} className="w-full mb-3 p-2 border rounded">
        <option value="transfer">Transferencia</option>
        <option value="card">Tarjeta</option>
        <option value="cash">Efectivo</option>
      </select>
      <label className="block text-sm">Comprobante (si aplica)</label>
      <input type="file" accept="image/*,application/pdf" onChange={e=>setFile(e.target.files[0])} className="mb-3" />
      <textarea className="w-full p-2 border rounded mb-3" placeholder="Notas" value={notes} onChange={e=>setNotes(e.target.value)} />
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-indigo-600 text-white rounded" onClick={submit}>Enviar</button>
        <button className="px-4 py-2 border rounded" onClick={onClose}>Cancelar</button>
      </div>
    </div>
  )
}
