import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Switch } from './ui/switch'
import { Label } from './ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Shield, UserX, User } from 'lucide-react'

export default function UsersPage() {
  const { apiRequest, isAdmin, user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'viewer',
    is_active: true
  })

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await apiRequest('/api/users')
      if (res.ok) {
        const d = await res.json()
        setUsers(d.data || [])
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const method = editUser ? 'PUT' : 'POST'
      const url = editUser 
        ? `/api/users/${editUser.id}`
        : '/api/users'
      
      // Wenn bearbeiten und Passwort leer, nicht senden
      const payload = { ...formData }
      if (editUser && !payload.password) {
        delete payload.password
      }

      const res = await apiRequest(url, {
        method,
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        setDialogOpen(false)
        fetchUsers()
        setEditUser(null)
        setFormData({
          username: '',
          password: '',
          role: 'viewer',
          is_active: true
        })
      } else {
        const errorData = await res.json()
        alert(errorData.message || 'Fehler beim Speichern')
      }
    } catch (e) {
      console.error(e)
      alert('Fehler beim Speichern')
    }
  }

  const handleDelete = async (id, username) => {
    if (!confirm(`Benutzer "${username}" wirklich löschen?`)) return
    try {
      const res = await apiRequest(`/api/users/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        fetchUsers()
      } else {
        const errorData = await res.json()
        alert(errorData.message || 'Fehler beim Löschen')
      }
    } catch (e) {
      console.error(e)
      alert('Fehler beim Löschen')
    }
  }

  const handleToggleActive = async (id, username, currentStatus) => {
    try {
      const res = await apiRequest(`/api/users/${id}/toggle-active`, {
        method: 'PATCH'
      })
      if (res.ok) {
        fetchUsers()
      } else {
        const errorData = await res.json()
        alert(errorData.message || 'Fehler beim Ändern des Status')
      }
    } catch (e) {
      console.error(e)
      alert('Fehler beim Ändern des Status')
    }
  }

  const handleEdit = (user) => {
    setEditUser(user)
    setFormData({
      username: user.username,
      password: '', // Leer lassen beim Bearbeiten
      role: user.role,
      is_active: user.is_active
    })
    setDialogOpen(true)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">👥 Benutzerverwaltung</h1>
        {isAdmin() && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditUser(null)
                setFormData({
                  username: '',
                  password: '',
                  role: 'viewer',
                  is_active: true
                })
              }} className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-glow">
                Benutzer hinzufügen
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-white">
                  {editUser ? 'Benutzer bearbeiten' : 'Neuer Benutzer'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <Label className="text-gray-900 dark:text-gray-200">Benutzername</Label>
                  <Input
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="z.B. max.mustermann"
                    className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    required
                  />
                </div>
                <div>
                  <Label className="text-gray-900 dark:text-gray-200">
                    Passwort {editUser && <span className="text-xs text-gray-500 dark:text-gray-400">(leer lassen um nicht zu ändern)</span>}
                  </Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder={editUser ? "Leer lassen für keine Änderung" : "Mindestens 6 Zeichen"}
                    className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    required={!editUser}
                    minLength={editUser ? 0 : 6}
                  />
                </div>
                <div>
                  <Label className="text-gray-900 dark:text-gray-200">Rolle</Label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="viewer">Betrachter (Viewer)</option>
                    <option value="admin">Administrator</option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Viewer können nur lesen, Admins haben volle Rechte
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active" className="text-gray-900 dark:text-gray-200">Aktiv (kann sich anmelden)</Label>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-200">
                    Abbrechen
                  </Button>
                  <Button type="submit" className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-glow">
                    {editUser ? 'Speichern' : 'Erstellen'}
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
          placeholder="Benutzer durchsuchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-4 text-center text-gray-700 dark:text-gray-300">Lade Benutzer...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Benutzername
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rolle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Erstellt
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map(u => {
                const isCurrentUser = currentUser && currentUser.id === u.id
                return (
                  <tr key={u.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 ${!u.is_active ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {u.username}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(Sie)</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {u.role === 'admin' ? (
                          <>
                            <Shield className="h-4 w-4 text-red-600 dark:text-red-400 mr-2" />
                            <span className="text-sm text-gray-900 dark:text-white">Administrator</span>
                          </>
                        ) : (
                          <>
                            <User className="h-4 w-4 text-gray-600 dark:text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900 dark:text-white">Betrachter</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {u.is_active ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                          Aktiv
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
                          Inaktiv
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(u.created_at).toLocaleDateString('de-DE')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(u)}
                          className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-200"
                        >
                          Bearbeiten
                        </Button>
                        {!isCurrentUser && (
                          <>
                            <Button
                              size="sm"
                              variant={u.is_active ? "outline" : "default"}
                              onClick={() => handleToggleActive(u.id, u.username, u.is_active)}
                              title={u.is_active ? "Deaktivieren" : "Aktivieren"}
                              className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-200"
                            >
                              {u.is_active ? <UserX className="h-4 w-4" /> : <User className="h-4 w-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(u.id, u.username)}
                              className="bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 text-white"
                            >
                              Löschen
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {!loading && filteredUsers.length === 0 && (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            {searchTerm ? 'Keine Benutzer gefunden' : 'Noch keine Benutzer vorhanden'}
          </div>
        )}
      </div>
    </div>
  )
}
