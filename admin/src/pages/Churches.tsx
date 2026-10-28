import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { ImageUploader } from '../components/ImageUploader'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { Church, County, Director, Pastor } from '../types'

type CountyFilter = 'All' | County

const emptyDraft = {
  id: null as string | null,
  name: '',
  location: '',
  county: 'Dallas' as County,
  pastor_id: '' as string,
  director_id: '' as string,
  image_url: null as string | null,
  active: true,
}

interface HistoryRow {
  id: string
  name: string | null
  location: string | null
  county: County | null
  pastor_id: string | null
  director_id: string | null
  image_url: string | null
  active: boolean | null
  changed_at: string
}

export function Churches() {
  const { role } = useAuth()
  const { notify } = useToast()
  const canWrite = role === 'editor' || role === 'super_admin'
  const canDelete = role === 'super_admin'

  const [churches, setChurches] = useState<Church[]>([])
  const [pastors, setPastors] = useState<Pastor[]>([])
  const [directors, setDirectors] = useState<Director[]>([])
  const [loading, setLoading] = useState(true)

  const [countyFilter, setCountyFilter] = useState<CountyFilter>('All')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkCounty, setBulkCounty] = useState<County>('Dallas')
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false)

  const [draft, setDraft] = useState<typeof emptyDraft | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Church | null>(null)
  const [historyFor, setHistoryFor] = useState<Church | null>(null)
  const [history, setHistory] = useState<HistoryRow[]>([])

  async function loadAll() {
    setLoading(true)
    const [c, p, d] = await Promise.all([
      supabase.from('churches').select('*').order('name'),
      supabase.from('pastors').select('*').order('name'),
      supabase.from('directors').select('*').order('name'),
    ])
    if (c.error) notify(c.error.message, 'error')
    else setChurches(c.data as Church[])
    if (p.error) notify(p.error.message, 'error')
    else setPastors(p.data as Pastor[])
    if (d.error) notify(d.error.message, 'error')
    else setDirectors(d.data as Director[])
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    return churches.filter((c) => {
      if (countyFilter !== 'All' && c.county !== countyFilter) return false
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [churches, countyFilter, search])

  function pastorName(id: string | null) {
    return pastors.find((p) => p.id === id)?.name ?? '—'
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function applyBulkCounty() {
    const ids = Array.from(selected)
    const { error } = await supabase.from('churches').update({ county: bulkCounty }).in('id', ids)
    setBulkConfirmOpen(false)
    if (error) {
      notify(error.message, 'error')
      return
    }
    notify(`Updated county for ${ids.length} church${ids.length === 1 ? '' : 'es'}.`)
    setSelected(new Set())
    loadAll()
  }

  function openNew() {
    setDraft({ ...emptyDraft })
  }

  function openEdit(c: Church) {
    setDraft({
      id: c.id,
      name: c.name,
      location: c.location ?? '',
      county: c.county,
      pastor_id: c.pastor_id ?? '',
      director_id: c.director_id ?? '',
      image_url: c.image_url,
      active: c.active,
    })
  }

  async function saveDraft() {
    if (!draft) return
    if (!draft.name.trim()) {
      notify('Church name is required.', 'error')
      return
    }
    setSaving(true)
    const payload = {
      name: draft.name.trim(),
      location: draft.location.trim() || null,
      county: draft.county,
      pastor_id: draft.pastor_id || null,
      director_id: draft.director_id || null,
      image_url: draft.image_url,
      active: draft.active,
    }

    const result = draft.id
      ? await supabase.from('churches').update(payload).eq('id', draft.id)
      : await supabase.from('churches').insert(payload)

    setSaving(false)
    if (result.error) {
      notify(result.error.message, 'error')
      return
    }
    notify(draft.id ? 'Church updated.' : 'Church created.')
    setDraft(null)
    loadAll()
  }

  async function toggleActive(c: Church) {
    const { error } = await supabase.from('churches').update({ active: !c.active }).eq('id', c.id)
    if (error) {
      notify(error.message, 'error')
      return
    }
    notify(c.active ? 'Church deactivated.' : 'Church activated.')
    loadAll()
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    const { error } = await supabase.from('churches').delete().eq('id', deleteTarget.id)
    setDeleteTarget(null)
    if (error) {
      notify(error.message, 'error')
      return
    }
    notify('Church deleted.')
    loadAll()
  }

  async function openHistory(c: Church) {
    setHistoryFor(c)
    const { data, error } = await supabase
      .from('churches_history')
      .select('*')
      .eq('church_id', c.id)
      .order('changed_at', { ascending: false })
    if (error) {
      notify(error.message, 'error')
      return
    }
    setHistory(data as HistoryRow[])
  }

  async function restoreVersion(h: HistoryRow) {
    if (!historyFor) return
    const { error } = await supabase
      .from('churches')
      .update({
        name: h.name,
        location: h.location,
        county: h.county,
        pastor_id: h.pastor_id,
        director_id: h.director_id,
        image_url: h.image_url,
        active: h.active,
      })
      .eq('id', historyFor.id)
    if (error) {
      notify(error.message, 'error')
      return
    }
    notify('Church restored to selected version.')
    setHistoryFor(null)
    loadAll()
  }

  return (
    <div>
      <div className="page-header">
        <h1>Churches</h1>
        {canWrite && (
          <button type="button" className="btn btn-primary" onClick={openNew}>
            + New Church
          </button>
        )}
      </div>

      <div className="toolbar">
        <div className="tabs">
          {(['All', 'Dallas', 'Tarrant'] as CountyFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              className={countyFilter === f ? 'tab tab-active' : 'tab'}
              onClick={() => setCountyFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Search churches…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {canWrite && selected.size > 0 && (
        <div className="bulk-bar">
          <span>{selected.size} selected</span>
          <select value={bulkCounty} onChange={(e) => setBulkCounty(e.target.value as County)}>
            <option value="Dallas">Dallas</option>
            <option value="Tarrant">Tarrant</option>
          </select>
          <button type="button" className="btn btn-secondary" onClick={() => setBulkConfirmOpen(true)}>
            Assign county to selected
          </button>
        </div>
      )}

      {loading ? (
        <p>Loading…</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              {canWrite && <th></th>}
              <th>Name</th>
              <th>County</th>
              <th>Pastor</th>
              <th>Active</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className={c.active ? '' : 'row-inactive'}>
                {canWrite && (
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(c.id)}
                      onChange={() => toggleSelected(c.id)}
                    />
                  </td>
                )}
                <td>{c.name}</td>
                <td>{c.county}</td>
                <td>{pastorName(c.pastor_id)}</td>
                <td>
                  <button
                    type="button"
                    className={c.active ? 'pill pill-active' : 'pill pill-inactive'}
                    onClick={() => canWrite && toggleActive(c)}
                    disabled={!canWrite}
                  >
                    {c.active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="row-actions">
                  <button type="button" className="btn-link" onClick={() => openHistory(c)}>
                    History
                  </button>
                  {canWrite && (
                    <button type="button" className="btn-link" onClick={() => openEdit(c)}>
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button type="button" className="btn-link btn-link-danger" onClick={() => setDeleteTarget(c)}>
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-row">
                  No churches match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {draft && (
        <div className="modal-backdrop" onClick={() => setDraft(null)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <h3>{draft.id ? 'Edit Church' : 'New Church'}</h3>
            <label>
              Name
              <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </label>
            <label>
              Location
              <input
                value={draft.location}
                onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                placeholder="Street address / city"
              />
            </label>
            <label>
              County
              <select value={draft.county} onChange={(e) => setDraft({ ...draft, county: e.target.value as County })}>
                <option value="Dallas">Dallas</option>
                <option value="Tarrant">Tarrant</option>
              </select>
            </label>
            <label>
              Pastor
              <select value={draft.pastor_id} onChange={(e) => setDraft({ ...draft, pastor_id: e.target.value })}>
                <option value="">— None —</option>
                {pastors.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Director
              <select value={draft.director_id} onChange={(e) => setDraft({ ...draft, director_id: e.target.value })}>
                <option value="">— None —</option>
                {directors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Photo
              <ImageUploader
                bucket="churches"
                currentUrl={draft.image_url}
                onUploaded={(url) => setDraft({ ...draft, image_url: url })}
              />
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
              />
              Active (visible on the public site)
            </label>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setDraft(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={saveDraft} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {historyFor && (
        <div className="modal-backdrop" onClick={() => setHistoryFor(null)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <h3>History — {historyFor.name}</h3>
            {history.length === 0 && <p>No prior versions recorded.</p>}
            <ul className="history-list">
              {history.map((h) => (
                <li key={h.id}>
                  <div>
                    <strong>{h.name}</strong> · {h.county} · {h.active ? 'Active' : 'Inactive'}
                    <div className="history-timestamp">{new Date(h.changed_at).toLocaleString()}</div>
                  </div>
                  {canWrite && (
                    <button type="button" className="btn btn-secondary" onClick={() => restoreVersion(h)}>
                      Restore
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setHistoryFor(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete church"
        message={`Permanently delete "${deleteTarget?.name}"? This cannot be undone from the dashboard.`}
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      <ConfirmDialog
        open={bulkConfirmOpen}
        title="Bulk reassign county"
        message={`Set ${selected.size} selected church${selected.size === 1 ? '' : 'es'} to ${bulkCounty} County?`}
        confirmLabel="Apply"
        onConfirm={applyBulkCounty}
        onCancel={() => setBulkConfirmOpen(false)}
      />
    </div>
  )
}
