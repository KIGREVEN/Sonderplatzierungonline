import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function CampaignsPage(){
  const { apiRequest } = useAuth()
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(false)

  const fetch = async ()=>{
    setLoading(true)
    try{ const res = await apiRequest('/api/campaigns'); if(res.ok){ const d=await res.json(); setCampaigns(d.data||[]) } }catch(e){console.error(e)}
    setLoading(false)
  }

  useEffect(()=>{ fetch() },[])

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Kampagnen</h1>
      <div className="bg-white rounded shadow p-4">
        {loading ? <div>Lade Kampagnen...</div> : (
          campaigns.length===0 ? <div className="text-gray-500">Keine Kampagnen</div> : (
            <ul>
              {campaigns.map(c=> (
                <li key={c.id} className="py-2 border-b flex justify-between items-center">
                  <div>
                    <div className="font-medium">{c.label}</div>
                    <div className="text-xs text-gray-500">{c.from_date || '-'} → {c.to_date || '-'}</div>
                  </div>
                  <div className="text-sm text-gray-600">{c.is_active? 'aktiv':'inaktiv'}</div>
                </li>
              ))}
            </ul>
          )
        )}
      </div>
    </div>
  )
}
