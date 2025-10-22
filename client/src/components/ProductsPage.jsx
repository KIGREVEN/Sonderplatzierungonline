import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Switch } from './ui/switch'
import { Label } from './ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'

export default function ProductsPage(){
  const { apiRequest, isAdmin } = useAuth()
  const [platform, setPlatform] = useState('gelbe_seiten')
  const [platforms, setPlatforms] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [formData, setFormData] = useState({
    platform_key: '',
    key: '',
    name: '',
    description: '',
    is_active: true
  })

  const fetchPlatforms = async () => {
    try {
      const res = await apiRequest('/api/platforms')
      if(res.ok){
        const data = await res.json()
        setPlatforms(data.data || [])
        if(data.data?.length > 0 && !platform){
          setPlatform(data.data[0].key)
        }
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const method = editProduct ? 'PUT' : 'POST'
      const url = editProduct 
        ? `/api/products/${editProduct.id}`
        : '/api/products'
      
      const res = await apiRequest(url, {
        method,
        body: JSON.stringify({
          ...formData,
          platform_key: platform
        })
      })

      if(res.ok){
        setDialogOpen(false)
        fetchProducts(platform)
        setEditProduct(null)
        setFormData({
          platform_key: '',
          key: '',
          name: '',
          description: '',
          is_active: true
        })
      }
    } catch(e) {
      console.error(e)
    }
  }

  const handleDelete = async (id) => {
    if(!confirm('Produkt wirklich löschen?')) return
    try{
      const res = await apiRequest(`/api/products/${id}`, {
        method: 'DELETE'
      })
      if(res.ok){
        fetchProducts(platform)
      }
    }catch(e){ console.error(e) }
  }

  const handleEdit = (product) => {
    setEditProduct(product)
    setFormData({
      platform_key: product.platform_key,
      key: product.key,
      name: product.name,
      description: product.description || '',
      is_active: product.is_active
    })
    setDialogOpen(true)
  }

  useEffect(()=>{ fetchPlatforms() },[])
  useEffect(()=>{ if(platform) fetchProducts(platform) },[platform])

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Produkte</h1>
        {isAdmin() && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditProduct(null)
                setFormData({
                  platform_key: '',
                  key: '',
                  name: '',
                  description: '',
                  is_active: true
                })
              }}>
                Produkt hinzufügen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editProduct ? 'Produkt bearbeiten' : 'Neues Produkt'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <Label>Schlüssel</Label>
                  <Input
                    value={formData.key}
                    onChange={(e) => setFormData(prev => ({...prev, key: e.target.value}))}
                    placeholder="produkt-key"
                    required
                    disabled={!!editProduct}
                  />
                </div>
                <div>
                  <Label>Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                    placeholder="Produktname"
                    required
                  />
                </div>
                <div>
                  <Label>Beschreibung</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                    placeholder="Beschreibung (optional)"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({...prev, is_active: checked}))}
                  />
                  <Label htmlFor="is_active">Aktiv</Label>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button type="submit">
                    {editProduct ? 'Speichern' : 'Erstellen'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

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
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-600">{prod.is_active? 'aktiv':'inaktiv'}</div>
                    {isAdmin() && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(prod)}>
                          Bearbeiten
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(prod.id)}>
                          Löschen
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )
        )}
      </div>
    </div>
  )
}
