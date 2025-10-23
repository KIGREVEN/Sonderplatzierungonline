import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Switch } from './ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'

export default function CategoriesPage() {
  const { apiRequest, isAdmin } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editCategory, setEditCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    is_active: true
  })
  const [searchTerm, setSearchTerm] = useState('')

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const url = searchTerm 
        ? `/api/categories?search=${encodeURIComponent(searchTerm)}`
        : '/api/categories'
      
      const res = await apiRequest(url)
      if (res.ok) {
        const data = await res.json()
        setCategories(data.data || [])
      }
    } catch (e) {
      console.error('Error fetching categories:', e)
    }
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const method = editCategory ? 'PUT' : 'POST'
      const url = editCategory 
        ? `/api/categories/${editCategory.id}`
        : '/api/categories'

      const res = await apiRequest(url, {
        method,
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setDialogOpen(false)
        setEditCategory(null)
        setFormData({ name: '', is_active: true })
        fetchCategories()
      } else {
        const error = await res.json()
        alert(error.message || 'Fehler beim Speichern der Kategorie')
      }
    } catch (e) {
      console.error('Error saving category:', e)
      alert('Fehler beim Speichern der Kategorie')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Kategorie wirklich löschen?')) return
    
    try {
      const res = await apiRequest(`/api/categories/${id}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        fetchCategories()
      } else {
        const error = await res.json()
        alert(error.message || 'Fehler beim Löschen der Kategorie')
      }
    } catch (e) {
      console.error('Error deleting category:', e)
      alert('Fehler beim Löschen der Kategorie')
    }
  }

  const handleEdit = (category) => {
    setEditCategory(category)
    setFormData({
      name: category.name,
      is_active: category.is_active ?? true
    })
    setDialogOpen(true)
  }

  useEffect(() => {
    fetchCategories()
  }, [searchTerm])

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">🏢 Kategorien / Branchen</h1>
        {isAdmin() && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditCategory(null)
                setFormData({ name: '', is_active: true })
              }} className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-glow">
                Kategorie hinzufügen
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-white">
                  {editCategory ? 'Kategorie bearbeiten' : 'Neue Kategorie'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <Label className="text-gray-900 dark:text-gray-200">Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                    placeholder="z.B. Rechtsanwälte"
                    className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({...prev, is_active: checked}))}
                  />
                  <Label htmlFor="is_active" className="text-gray-900 dark:text-gray-200">Aktiv (für neue Buchungen verfügbar)</Label>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-200">
                    Abbrechen
                  </Button>
                  <Button type="submit" className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-glow">
                    {editCategory ? 'Speichern' : 'Erstellen'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="mb-4">
        <Input
          type="text"
          placeholder="Kategorien durchsuchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-700 dark:text-gray-300">Laden...</div>
      ) : categories.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {searchTerm ? 'Keine Kategorien gefunden' : 'Noch keine Kategorien vorhanden'}
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                {isAdmin() && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Aktionen
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {categories.map((category) => (
                <tr key={category.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 ${!category.is_active ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {category.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      category.is_active 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400'
                    }`}>
                      {category.is_active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                  {isAdmin() && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(category)}
                        className="mr-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-200"
                      >
                        Bearbeiten
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(category.id)}
                        className="bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 text-white"
                      >
                        Löschen
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
