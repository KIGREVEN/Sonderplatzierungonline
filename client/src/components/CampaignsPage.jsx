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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">🎯 Kampagnen</h1>
        {isAdmin() && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditCampaign(null)
                setFormData({
                  label: '',
                  is_active: true
                })
              }} className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg shadow-red-500/50">
                Kampagne hinzufügen
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-white">{editCampaign ? 'Kampagne bearbeiten' : 'Neue Kampagne'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <Label className="text-gray-900 dark:text-gray-200">Label</Label>
                  <Input
                    value={formData.label}
                    onChange={(e) => setFormData(prev => ({...prev, label: e.target.value}))}
                    placeholder="Kampagnen-Label"
                    className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-red-500"
                    required
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
                    {editCampaign ? 'Speichern' : 'Erstellen'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="glass-card rounded-xl p-6">
        {loading ? <div className="text-gray-700 dark:text-gray-300">Lade Kampagnen...</div> : (
          campaigns.length===0 ? <div className="text-gray-500 dark:text-gray-400">Keine Kampagnen</div> : (
            <ul className="space-y-2">
              {campaigns.map(c => (
                <li key={c.id} className="py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg px-3 transition-all duration-200">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{c.label}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`text-sm font-medium px-3 py-1 rounded-full ${c.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                      {c.is_active? 'aktiv':'inaktiv'}
                    </div>
                    {isAdmin() && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(c)} className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-200">
                          Bearbeiten
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(c.id)} className="bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 text-white">
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
