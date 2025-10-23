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
        <h1 className="text-3xl font-bold">Benutzerverwaltung</h1>
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
              }}>
                Benutzer hinzufügen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editUser ? 'Benutzer bearbeiten' : 'Neuer Benutzer'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <Label>Benutzername</Label>
                  <Input
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="z.B. max.mustermann"
                    required
                  />
                </div>
                <div>
                  <Label>
                    Passwort {editUser && <span className="text-xs text-gray-500">(leer lassen um nicht zu ändern)</span>}
                  </Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder={editUser ? "Leer lassen für keine Änderung" : "Mindestens 6 Zeichen"}
                    required={!editUser}
                    minLength={editUser ? 0 : 6}
                  />
                </div>
                <div>
                  <Label>Rolle</Label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="viewer">Betrachter (Viewer)</option>
                    <option value="admin">Administrator</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Viewer können nur lesen, Admins haben volle Rechte
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Aktiv (kann sich anmelden)</Label>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button type="submit">
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
          className="max-w-md"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-4 text-center">Lade Benutzer...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Benutzername
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rolle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Erstellt
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map(u => {
                const isCurrentUser = currentUser && currentUser.id === u.id
                return (
                  <tr key={u.id} className={`hover:bg-gray-50 ${!u.is_active ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {u.username}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-blue-600">(Sie)</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {u.role === 'admin' ? (
                          <>
                            <Shield className="h-4 w-4 text-red-600 mr-2" />
                            <span className="text-sm text-gray-900">Administrator</span>
                          </>
                        ) : (
                          <>
                            <User className="h-4 w-4 text-gray-600 mr-2" />
                            <span className="text-sm text-gray-900">Betrachter</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {u.is_active ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          Aktiv
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                          Inaktiv
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(u.created_at).toLocaleDateString('de-DE')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(u)}
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
                            >
                              {u.is_active ? <UserX className="h-4 w-4" /> : <User className="h-4 w-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(u.id, u.username)}
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
          <div className="p-4 text-center text-gray-500">
            {searchTerm ? 'Keine Benutzer gefunden' : 'Noch keine Benutzer vorhanden'}
          </div>
        )}
      </div>
    </div>
  )
}
