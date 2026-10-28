import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import type { SiteSetting } from '../types'

const KNOWN_KEYS = [
  { key: 'site_name', label: 'Site name' },
  { key: 'site_tagline', label: 'Tagline' },
  { key: 'contact_email', label: 'Contact email' },
  { key: 'primary_color', label: 'Primary brand color' },
  { key: 'logo_url', label: 'Logo URL' },
  { key: 'site_domain', label: 'Site domain' },
]

export function SiteSettings() {
  const { role } = useAuth()
  const { notify } = useToast()
  const canWrite = role === 'editor' || role === 'super_admin'

  const [settings, setSettings] = useState<SiteSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')

  async function loadAll() {
    setLoading(true)
    const { data, error } = await supabase.from('site_settings').select('*').order('key')
    if (error) notify(error.message, 'error')
    else {
      setSettings(data as SiteSetting[])
      const initial: Record<string, string> = {}
      for (const s of data as SiteSetting[]) initial[s.key] = s.value ?? ''
      setEdits(initial)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function save(key: string) {
    setSaving(key)
    const { error } = await supabase.from('site_settings').update({ value: edits[key] }).eq('key', key)
    setSaving(null)
    if (error) {
      notify(error.message, 'error')
      return
    }
    notify('Setting saved.')
    loadAll()
  }

  async function addSetting() {
    if (!newKey.trim()) {
      notify('Key is required.', 'error')
      return
    }
    const { error } = await supabase.from('site_settings').insert({ key: newKey.trim(), value: newValue })
    if (error) {
      notify(error.message, 'error')
      return
    }
    notify('Setting added.')
    setNewKey('')
    setNewValue('')
    loadAll()
  }

  const known = KNOWN_KEYS.map((k) => settings.find((s) => s.key === k.key) ?? { id: k.key, key: k.key, value: '', created_at: '', updated_at: '' })
  const extra = settings.filter((s) => !KNOWN_KEYS.some((k) => k.key === s.key))

  return (
    <div>
      <h1>Site Settings</h1>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <>
          <table className="data-table settings-table">
            <tbody>
              {known.map((s) => {
                const label = KNOWN_KEYS.find((k) => k.key === s.key)?.label ?? s.key
                return (
                  <tr key={s.key}>
                    <td className="settings-label">{label}</td>
                    <td>
                      <input
                        value={edits[s.key] ?? ''}
                        disabled={!canWrite}
                        onChange={(e) => setEdits({ ...edits, [s.key]: e.target.value })}
                      />
                    </td>
                    <td>
                      {canWrite && (
                        <button type="button" className="btn btn-secondary" onClick={() => save(s.key)} disabled={saving === s.key}>
                          {saving === s.key ? 'Saving…' : 'Save'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {extra.map((s) => (
                <tr key={s.key}>
                  <td className="settings-label">
                    <code>{s.key}</code>
                  </td>
                  <td>
                    <input
                      value={edits[s.key] ?? ''}
                      disabled={!canWrite}
                      onChange={(e) => setEdits({ ...edits, [s.key]: e.target.value })}
                    />
                  </td>
                  <td>
                    {canWrite && (
                      <button type="button" className="btn btn-secondary" onClick={() => save(s.key)} disabled={saving === s.key}>
                        {saving === s.key ? 'Saving…' : 'Save'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {canWrite && (
            <div className="add-setting-row">
              <input placeholder="New setting key" value={newKey} onChange={(e) => setNewKey(e.target.value)} />
              <input placeholder="Value" value={newValue} onChange={(e) => setNewValue(e.target.value)} />
              <button type="button" className="btn btn-primary" onClick={addSetting}>
                + Add setting
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
