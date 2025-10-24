import React, { useEffect, useState } from 'react'
import axios from 'axios'
import EnrollForm from './EnrollForm'

export default function Courses({ token }){
  const [courses,setCourses]=useState([])
  const [selected,setSelected]=useState(null)

  useEffect(()=>{
    axios.get('/.netlify/functions/courses').then(r=>setCourses(r.data || []))
  },[])

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map(c=>(
          <div key={c.id} className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold">{c.title}</h3>
            <p className="text-sm text-gray-600">{c.description}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="font-medium">S/ {c.price}</span>
              <button className="px-3 py-1 border rounded" onClick={()=>setSelected(c)}>Inscribirse</button>
            </div>
          </div>
        ))}
      </div>

      {selected && <div className="mt-6"><EnrollForm course={selected} token={token} onClose={()=>setSelected(null)} /></div>}
    </div>
  )
}
