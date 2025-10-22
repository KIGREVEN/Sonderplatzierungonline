import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function ProductsPage(){
  const { apiRequest, isAdmin } = useAuth()
  const [platform, setPlatform] = useState('gelbe_seiten')
  const [platforms, setPlatforms] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchPlatforms = async () => {
    try {
      const res = await apiRequest('/api/platforms')
      if(res.ok){
        const data = await res.json()
        setPlatforms(data.data || [])
      }
    }catch(e){ console.error(e) }
  }

  const fetchProducts = async (pkey) =>{
    setLoading(true)
    try{
      const res = await apiRequest(`/api/products?platformKey=${encodeURIComponent(pkey)}`)
      if(res.ok){
        const d = await res.json()
        setProducts(d.data || [])
      }
    }catch(e){ console.error(e) }
    setLoading(false)
  }

  useEffect(()=>{ fetchPlatforms() },[])
  useEffect(()=>{ if(platform) fetchProducts(platform) },[platform])

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Produkte</h1>
      <div className="mb-4 flex gap-2">
        <label className="text-sm">Plattform</label>
        <select value={platform} onChange={(e)=>setPlatform(e.target.value)} className="p-2 border rounded">
          {platforms.map(p=> (
            <option key={p.key} value={p.key}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded shadow p-4">
        {loading ? <div>Lade Produkte...</div> : (
          products.length===0 ? <div className="text-gray-500">Keine Produkte</div> : (
            <ul>
              {products.map(prod => (
                <li key={prod.id} className="py-2 border-b flex justify-between items-center">
                  <div>
                    <div className="font-medium">{prod.name}</div>
                    <div className="text-xs text-gray-500">{prod.description}</div>
                  </div>
                  <div className="text-sm text-gray-600">{prod.is_active? 'aktiv':'inaktiv'}</div>
                </li>
              ))}
            </ul>
          )
        )}
      </div>
    </div>
  )
}
