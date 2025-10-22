# 🛠️ Köln Branchen Portal - Fix Scripts

## 🚀 Schnell-Fixes

| Problem | Script | Beschreibung |
|---------|--------|--------------|
| 🌐 Extern kein Login | `fix_external_access.sh` | Frontend von interner auf externe IP |
| 🚨 Backend "errored" | `fix_backend.sh` | PM2 Backend-Reparatur |
| 👤 "users does not exist" | `fix_users_table.sh` | Users-Tabelle erstellen |
| 🔄 Database-Reset | `fix_migration_seeding.sh` | Migration/Seeding trennen |
| 🌍 CORS-Fehler | `quick_cors_fix.sh` | CORS-Probleme lösen |

## 📖 Verwendung

```bash
chmod +x *.sh
./fix_external_access.sh
```
