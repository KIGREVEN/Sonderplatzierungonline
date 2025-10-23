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
  const [platforms, setPlatforms] = useState([])
  const [products, setProducts] = useState([])
  const [articleTypes, setArticleTypes] = useState([])
  const [selectedType, setSelectedType] = useState('')
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [typeDialogOpen, setTypeDialogOpen] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [formData, setFormData] = useState({
    platforms: [],
    key: '',
    name: '',
    description: '',
    article_type_id: '',
    is_active: true
  })
  const [typeFormData, setTypeFormData] = useState({
    name: '',
    description: ''
  })

  const fetchArticleTypes = async () => {
    try {
      const res = await apiRequest('/api/article-types')
      if(res.ok){
        const data = await res.json()
        setArticleTypes(data.data || [])
      }
    }catch(e){ console.error(e) }
  }

  const fetchPlatforms = async () => {
    try {
      const res = await apiRequest('/api/platforms')
      if(res.ok){
        const data = await res.json()
        setPlatforms(data.data || [])
      }
    }catch(e){ console.error(e) }
  }

  const fetchProducts = async () =>{
    setLoading(true)
    try{
      const params = new URLSearchParams()
      
      if (selectedPlatformFilter) {
        params.append('platformKey', selectedPlatformFilter)
      }
      
      if (selectedType) {
        params.append('articleTypeId', selectedType)
      }
      
      const url = `/api/products${params.toString() ? '?' + params.toString() : ''}`
      console.log('Fetching products with URL:', url)
      
      const res = await apiRequest(url)
      if(res.ok){
        const d = await res.json()
        console.log('Received products:', d.data)
        setProducts(d.data || [])
      }
    }catch(e){ 
      console.error('Error fetching products:', e) 
    }
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
        body: JSON.stringify(formData)
      })

      if(res.ok){
        setDialogOpen(false)
        fetchProducts()
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
        fetchProducts()
      }
    }catch(e){ console.error(e) }
  }

  const handleEdit = (product) => {
    setEditProduct(product)
    setFormData({
      platforms: product.platforms || [],
      key: product.key,
      name: product.name,
      description: product.description || '',
      article_type_id: product.article_type_id || '',
      is_active: product.is_active
    })
    setDialogOpen(true)
  }

  const handleTypeSubmit = async (e) => {
    e.preventDefault()
    try {
      // Generate key from name: lowercase, replace spaces with hyphens, remove special chars
      const generatedKey = typeFormData.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')

      const res = await apiRequest('/api/article-types', {
        method: 'POST',
        body: JSON.stringify({
          key: generatedKey,
          name: typeFormData.name,
          description: typeFormData.description
        })
      })

      if(res.ok){
        setTypeDialogOpen(false)
        fetchArticleTypes()
        setTypeFormData({
          name: '',
          description: ''
        })
      }
    } catch(e) {
      console.error(e)
    }
  }

  useEffect(()=>{ 
    fetchPlatforms();
    fetchArticleTypes();
  },[])
  useEffect(()=>{ 
    fetchProducts()
  },[selectedType, selectedPlatformFilter])

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📦 Artikel</h1>
        {isAdmin() && (
          <div className="flex gap-2">
            <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={() => {
                  setTypeFormData({
                    name: '',
                    description: ''
                  })
                }} className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-200">
                  Artikel-Typ hinzufügen
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                <DialogHeader>
                  <DialogTitle className="text-gray-900 dark:text-white">Neuer Artikel-Typ</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleTypeSubmit} className="space-y-4 mt-4">
                  <div>
                    <Label className="text-gray-900 dark:text-gray-200">Name</Label>
                    <Input
                      value={typeFormData.name}
                      onChange={(e) => setTypeFormData(prev => ({...prev, name: e.target.value}))}
                      placeholder="z.B. Top Ranking 8"
                      className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-gray-900 dark:text-gray-200">Beschreibung</Label>
                    <Textarea
                      value={typeFormData.description}
                      onChange={(e) => setTypeFormData(prev => ({...prev, description: e.target.value}))}
                      placeholder="Beschreibung (optional)"
                      className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button type="button" variant="outline" onClick={() => setTypeDialogOpen(false)} className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-200">
                      Abbrechen
                    </Button>
                    <Button type="submit" className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-glow">
                      Erstellen
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                setEditProduct(null)
                setFormData({
                  platforms: [],
                  key: '',
                  name: '',
                  description: '',
                  article_type_id: '',
                  is_active: true
                })
              }} className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-glow">
                Artikel hinzufügen
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-white">{editProduct ? 'Artikel bearbeiten' : 'Neuer Artikel'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <Label className="text-gray-900 dark:text-gray-200">Plattformen</Label>
                  <div className="space-y-2 border border-gray-300 dark:border-gray-600 rounded-xl p-3 bg-gray-50 dark:bg-gray-900/50">
                    {platforms.map(platform => (
                      <div key={platform.key} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`platform-${platform.key}`}
                          checked={(formData.platforms || []).includes(platform.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                platforms: [...(prev.platforms || []), platform.key]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                platforms: (prev.platforms || []).filter(key => key !== platform.key)
                              }));
                            }
                          }}
                          className="mr-2"
                        />
                        <Label htmlFor={`platform-${platform.key}`} className="text-gray-900 dark:text-gray-200">{platform.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-900 dark:text-gray-200">Artikel-Typ</Label>
                  <select 
                    value={formData.article_type_id}
                    onChange={(e) => setFormData(prev => ({...prev, article_type_id: e.target.value}))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                    disabled={!!editProduct}
                  >
                    <option value="">Artikel-Typ auswählen</option>
                    {articleTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-gray-900 dark:text-gray-200">Schlüssel (Key)</Label>
                  <Input
                    value={formData.key}
                    onChange={(e) => setFormData(prev => ({...prev, key: e.target.value}))}
                    placeholder="z.B. banner-1"
                    className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    required
                  />
                </div>
                <div>
                  <Label className="text-gray-900 dark:text-gray-200">Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                    placeholder="Artikelname"
                    className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    required
                  />
                </div>
                <div>
                  <Label className="text-gray-900 dark:text-gray-200">Beschreibung</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                    placeholder="Beschreibung (optional)"
                    className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({...prev, is_active: checked}))}
                  />
                  <Label htmlFor="is_active" className="text-gray-900 dark:text-gray-200">Aktiv</Label>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-200">
                    Abbrechen
                  </Button>
                  <Button type="submit" className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-glow">
                    {editProduct ? 'Speichern' : 'Erstellen'}
                  </Button>
                </div>
              </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <div className="mb-4 flex gap-4">
        <div className="flex gap-2 items-center">
          <label className="text-sm text-gray-700 dark:text-gray-200">Plattform filtern</label>
          <select 
            value={selectedPlatformFilter} 
            onChange={(e)=>setSelectedPlatformFilter(e.target.value)} 
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">Alle Plattformen</option>
            {platforms.map(p=> (
              <option key={p.key} value={p.key}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 items-center">
          <label className="text-sm text-gray-700 dark:text-gray-200">Artikel-Typ</label>
          <select 
            value={selectedType} 
            onChange={(e) => setSelectedType(e.target.value)} 
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">Alle Artikel-Typen</option>
            {articleTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6">
        {loading ? <div className="text-gray-700 dark:text-gray-300">Lade Artikel...</div> : (
          products.length===0 ? <div className="text-gray-500 dark:text-gray-400">Keine Artikel</div> : (
            <ul className="space-y-2">
              {products.map(prod => (
                <li key={prod.id} className="py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg px-3 transition-all duration-200">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{prod.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{prod.description}</div>
                    {prod.platforms && prod.platforms.length > 0 && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Plattformen: {prod.platforms.map(pk => {
                          const platform = platforms.find(p => p.key === pk);
                          return platform ? platform.name : pk;
                        }).join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`text-sm font-medium px-3 py-1 rounded-full ${prod.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                      {prod.is_active? 'aktiv':'inaktiv'}
                    </div>
                    {isAdmin() && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(prod)} className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-200">
                          Bearbeiten
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(prod.id)} className="bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 text-white">
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
