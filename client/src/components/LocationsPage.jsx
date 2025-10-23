import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Switch } from './ui/switch'
import { Label } from './ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'

export default function LocationsPage(){
  const { apiRequest, isAdmin } = useAuth()
  const [search, setSearch] = useState('')
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editLocation, setEditLocation] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    is_active: true
  })

  const fetchLocations = async (s='') =>{
    setLoading(true)
    try{
      const url = s ? `/api/locations?search=${encodeURIComponent(s)}` : '/api/locations'
      const res = await apiRequest(url)
      if(res.ok){ const d = await res.json(); setLocations(d.data || []) }
    }catch(e){ console.error(e) }
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const method = editLocation ? 'PUT' : 'POST'
      const url = editLocation 
        ? `/api/locations/${editLocation.id}`
        : '/api/locations'
      
      const res = await apiRequest(url, {
        method,
        body: JSON.stringify(formData)
      })

      if(res.ok){
        setDialogOpen(false)
        fetchLocations(search)
        setEditLocation(null)
        setFormData({
          name: '',
          code: '',
          is_active: true
        })
      }
    } catch(e) {
      console.error(e)
    }
  }

  const handleDelete = async (id) => {
    if(!confirm('Standort wirklich löschen?')) return
    try{
      const res = await apiRequest(`/api/locations/${id}`, {
        method: 'DELETE'
      })
      if(res.ok){
        fetchLocations(search)
      }
    }catch(e){ console.error(e) }
  }

  const handleEdit = (location) => {
    setEditLocation(location)
    setFormData({
      name: location.name,
      code: location.code || '',
      is_active: location.is_active
    })
    setDialogOpen(true)
  }

  useEffect(()=>{ fetchLocations() },[])

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📍 Orte / Regionen</h1>
        {isAdmin() && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditLocation(null)
                setFormData({
                  name: '',
                  code: '',
                  is_active: true
                })
              }} className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-glow">
                Standort hinzufügen
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-white">{editLocation ? 'Standort bearbeiten' : 'Neuer Standort'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <Label className="text-gray-900 dark:text-gray-200">Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                    placeholder="Standortname"
                    className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    required
                  />
                </div>
                <div>
                  <Label className="text-gray-900 dark:text-gray-200">Code</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({...prev, code: e.target.value}))}
                    placeholder="Code (optional)"
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
                    {editLocation ? 'Speichern' : 'Erstellen'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="mb-4 flex gap-2 items-center">
        <Input 
          value={search} 
          onChange={(e)=>setSearch(e.target.value)} 
          placeholder="Suche Orte" 
          className="max-w-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
        <Button variant="outline" onClick={()=>fetchLocations(search)} className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-200">Suchen</Button>
      </div>

      <div className="glass-card rounded-xl p-6">
        {loading ? <div className="text-gray-700 dark:text-gray-300">Lade Orte...</div> : (
          locations.length===0 ? <div className="text-gray-500 dark:text-gray-400">Keine Orte gefunden</div> : (
            <ul className="space-y-2">
              {locations.map(l => (
                <li key={l.id} className="py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg px-3 transition-all duration-200">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{l.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{l.code}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`text-sm font-medium px-3 py-1 rounded-full ${l.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                      {l.is_active? 'aktiv':'inaktiv'}
                    </div>
                    {isAdmin() && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(l)} className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-200">
                          Bearbeiten
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(l.id)} className="bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 text-white">
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
