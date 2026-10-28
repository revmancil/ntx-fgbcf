import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { ImageUploader } from '../components/ImageUploader'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { EventRow } from '../types'

const emptyDraft = {
  id: null as string | null,
  title: '',
  description: '',
  date: '',
  location: '',
  image_url: null as string | null,
  active: true,
}

interface HistoryRow {
  id: string
  title: string | null
  description: string | null
  date: string | null
  location: string | null
  image_url: string | null
  active: boolean | null
  changed_at: string
}

export function Events() {
  const { role } = useAuth()
  const { notify } = useToast()
  const canWrite = role === 'editor' || role === 'super_admin'
  const canDelete = role === 'super_admin'

  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true)
  const [activeOnly, setActiveOnly] = useState(true)

  const [draft, setDraft] = useState<typeof emptyDraft | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<EventRow | null>(null)
  const [historyFor, setHistoryFor] = useState<EventRow | null>(null)
  const [history, setHistory] = useState<HistoryRow[]>([])

  async function loadAll() {
    setLoading(true)
    const { data, error } = await supabase.from('events').select('*').order('date', { ascending: true })
    if (error) notify(error.message, 'error')
    else setEvents(data as EventRow[])
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const visible = useMemo(
    () => (activeOnly ? events.filter((e) => e.active) : events),
    [events, activeOnly]
  )
  const now = Date.now()
  const upcoming = visible.filter((e) => new Date(e.date).getTime() >= now)
  const past = visible.filter((e) => new Date(e.date).getTime() < now)

  function openNew() {
    setDraft({ ...emptyDraft })
  }

  function openEdit(e: EventRow) {
    setDraft({
      id: e.id,
      title: e.title,
      description: e.description ?? '',
      date: e.date.slice(0, 16),
      location: e.location ?? '',
      image_url: e.image_url,
      active: e.active,
    })
  }

  async function saveDraft() {
    if (!draft) return
    if (!draft.title.trim() || !draft.date || !draft.location.trim()) {
      notify('Title, date, and location are required.', 'error')
      return
    }
    setSaving(true)
    const payload = {
      title: draft.title.trim(),
      description: draft.description.trim() || null,
      date: new Date(draft.date).toISOString(),
      location: draft.location.trim(),
      image_url: draft.image_url,
      active: draft.active,
    }
    const result = draft.id
      ? await supabase.from('events').update(payload).eq('id', draft.id)
      : await supabase.from('events').insert(payload)
    setSaving(false)
    if (result.error) {
      notify(result.error.message, 'error')
      return
    }
    notify(draft.id ? 'Event updated.' : 'Event created.')
    setDraft(null)
    loadAll()
  }

  async function toggleActive(e: EventRow) {
    const { error } = await supabase.from('events').update({ active: !e.active }).eq('id', e.id)
    if (error) {
      notify(error.message, 'error')
      return
    }
    loadAll()
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    const { error } = await supabase.from('events').delete().eq('id', deleteTarget.id)
    setDeleteTarget(null)
    if (error) {
      notify(error.message, 'error')
      return
    }
    notify('Event deleted.')
    loadAll()
  }

  async function openHistory(e: EventRow) {
    setHistoryFor(e)
    const { data, error } = await supabase
      .from('events_history')
      .select('*')
      .eq('event_id', e.id)
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
      .from('events')
      .update({
        title: h.title,
        description: h.description,
        date: h.date,
        location: h.location,
        image_url: h.image_url,
        active: h.active,
      })
      .eq('id', historyFor.id)
    if (error) {
      notify(error.message, 'error')
      return
    }
    notify('Event restored to selected version.')
    setHistoryFor(null)
    loadAll()
  }

  function renderRow(e: EventRow) {
    return (
      <tr key={e.id} className={e.active ? '' : 'row-inactive'}>
        <td>{e.title}</td>
        <td>{new Date(e.date).toLocaleString()}</td>
        <td>{e.location}</td>
        <td>
          <button
            type="button"
            className={e.active ? 'pill pill-active' : 'pill pill-inactive'}
            onClick={() => canWrite && toggleActive(e)}
            disabled={!canWrite}
          >
            {e.active ? 'Active' : 'Inactive'}
          </button>
        </td>
        <td className="row-actions">
          <button type="button" className="btn-link" onClick={() => openHistory(e)}>
            History
          </button>
          {canWrite && (
            <button type="button" className="btn-link" onClick={() => openEdit(e)}>
              Edit
            </button>
          )}
          {canDelete && (
            <button type="button" className="btn-link btn-link-danger" onClick={() => setDeleteTarget(e)}>
              Delete
            </button>
          )}
        </td>
      </tr>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>Events</h1>
        {canWrite && (
          <button type="button" className="btn btn-primary" onClick={openNew}>
            + New Event
          </button>
        )}
      </div>

      <div className="toolbar">
        <label className="checkbox-label">
          <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} />
          Active only
        </label>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <>
          <h2 className="section-subheading">Upcoming</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Location</th>
                <th>Active</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map(renderRow)}
              {upcoming.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-row">
                    No upcoming events.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <details className="past-events">
            <summary>Past events ({past.length})</summary>
            <table className="data-table">
              <tbody>{past.map(renderRow)}</tbody>
            </table>
          </details>
        </>
      )}

      {draft && (
        <div className="modal-backdrop" onClick={() => setDraft(null)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <h3>{draft.id ? 'Edit Event' : 'New Event'}</h3>
            <label>
              Title
              <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </label>
            <label>
              Date &amp; time
              <input
                type="datetime-local"
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              />
            </label>
            <label>
              Location
              <input value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
            </label>
            <label>
              Description
              <textarea
                rows={5}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </label>
            <label>
              Flyer
              <ImageUploader
                bucket="events"
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
            <h3>History — {historyFor.title}</h3>
            {history.length === 0 && <p>No prior versions recorded.</p>}
            <ul className="history-list">
              {history.map((h) => (
                <li key={h.id}>
                  <div>
                    <strong>{h.title}</strong>
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
        title="Delete event"
        message={`Permanently delete "${deleteTarget?.title}"? This cannot be undone from the dashboard.`}
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
