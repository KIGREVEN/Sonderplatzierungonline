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
        <h1 className="text-3xl font-bold">Orte / Regionen</h1>
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
              }}>
                Standort hinzufügen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editLocation ? 'Standort bearbeiten' : 'Neuer Standort'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                    placeholder="Standortname"
                    required
                  />
                </div>
                <div>
                  <Label>Code</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({...prev, code: e.target.value}))}
                    placeholder="Code (optional)"
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
          className="max-w-xs"
        />
        <Button variant="outline" onClick={()=>fetchLocations(search)}>Suchen</Button>
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
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-600">{l.is_active? 'aktiv':'inaktiv'}</div>
                    {isAdmin() && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(l)}>
                          Bearbeiten
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(l.id)}>
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
