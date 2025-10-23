import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Switch } from './ui/switch'
import { Label } from './ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'

export default function CampaignsPage(){
  const { apiRequest, isAdmin } = useAuth()
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editCampaign, setEditCampaign] = useState(null)
  const [formData, setFormData] = useState({
    label: '',
    is_active: true
  })

  const fetchCampaigns = async () => {
    setLoading(true)
    try{ 
      const res = await apiRequest('/api/campaigns')
      if(res.ok){ const d=await res.json(); setCampaigns(d.data||[]) }
    } catch(e) { console.error(e) }
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const method = editCampaign ? 'PUT' : 'POST'
      const url = editCampaign 
        ? `/api/campaigns/${editCampaign.id}`
        : '/api/campaigns'
      
      const res = await apiRequest(url, {
        method,
        body: JSON.stringify(formData)
      })

      if(res.ok){
        setDialogOpen(false)
        fetchCampaigns()
        setEditCampaign(null)
        setFormData({
          label: '',
          is_active: true
        })
      }
    } catch(e) {
      console.error(e)
    }
  }

  const handleDelete = async (id) => {
    if(!confirm('Kampagne wirklich löschen?')) return
    try{
      const res = await apiRequest(`/api/campaigns/${id}`, {
        method: 'DELETE'
      })
      if(res.ok){
        fetchCampaigns()
      }
    }catch(e){ console.error(e) }
  }

  const handleEdit = (campaign) => {
    setEditCampaign(campaign)
    setFormData({
      label: campaign.label,
      is_active: campaign.is_active
    })
    setDialogOpen(true)
  }

  useEffect(()=>{ fetchCampaigns() },[])

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Kampagnen</h1>
        {isAdmin() && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditCampaign(null)
                setFormData({
                  label: '',
                  is_active: true
                })
              }}>
                Kampagne hinzufügen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editCampaign ? 'Kampagne bearbeiten' : 'Neue Kampagne'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <Label>Label</Label>
                  <Input
                    value={formData.label}
                    onChange={(e) => setFormData(prev => ({...prev, label: e.target.value}))}
                    placeholder="Kampagnen-Label"
                    required
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
                    {editCampaign ? 'Speichern' : 'Erstellen'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="bg-white rounded shadow p-4">
        {loading ? <div>Lade Kampagnen...</div> : (
          campaigns.length===0 ? <div className="text-gray-500">Keine Kampagnen</div> : (
            <ul>
              {campaigns.map(c => (
                <li key={c.id} className="py-2 border-b flex justify-between items-center">
                  <div>
                    <div className="font-medium">{c.label}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-600">{c.is_active? 'aktiv':'inaktiv'}</div>
                    {isAdmin() && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(c)}>
                          Bearbeiten
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(c.id)}>
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
