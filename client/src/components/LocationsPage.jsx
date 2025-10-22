import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LocationsPage(){
  const { apiRequest } = useAuth()
  const [search, setSearch] = useState('')
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchLocations = async (s='') =>{
    setLoading(true)
    try{
      const url = s ? `/api/locations?search=${encodeURIComponent(s)}` : '/api/locations'
      const res = await apiRequest(url)
      if(res.ok){ const d = await res.json(); setLocations(d.data || []) }
    }catch(e){ console.error(e) }
    setLoading(false)
  }

  useEffect(()=>{ fetchLocations() },[])

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Orte / Regionen</h1>
      <div className="mb-4 flex gap-2 items-center">
        <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Suche Orte" className="p-2 border rounded" />
        <button className="px-3 py-2 bg-gray-100 rounded" onClick={()=>fetchLocations(search)}>Suchen</button>
      </div>

      <div className="bg-white rounded shadow p-4">
        {loading ? <div>Lade Orte...</div> : (
          locations.length===0 ? <div className="text-gray-500">Keine Orte gefunden</div> : (
            <ul>
              {locations.map(l => (
                <li key={l.id} className="py-2 border-b flex justify-between items-center">
                  <div>
                    <div className="font-medium">{l.name}</div>
                    <div className="text-xs text-gray-500">{l.code}</div>
                  </div>
                  <div className="text-sm text-gray-600">{l.is_active? 'aktiv':'inaktiv'}</div>
                </li>
              ))}
            </ul>
          )
        )}
      </div>
    </div>
  )
}
