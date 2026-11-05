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
  subtitle: '',
  host: '',
  date_text: '',
  end_date: '',
  event_time: '',
  address: '',
  link_url: '',
  link_text: '',
  tag: '',
  featured: false,
  orientation: '',
  notes: '',
}

interface HistoryRow {
  id: string
  title: string | null
  description: string | null
  date: string | null
  location: string | null
  image_url: string | null
  active: boolean | null
  subtitle: string | null
  host: string | null
  date_text: string | null
  end_date: string | null
  event_time: string | null
  address: string | null
  link_url: string | null
  link_text: string | null
  tag: string | null
  featured: boolean | null
  orientation: string | null
  notes: string | null
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
      subtitle: e.subtitle ?? '',
      host: e.host ?? '',
      date_text: e.date_text ?? '',
      end_date: e.end_date ? e.end_date.slice(0, 10) : '',
      event_time: e.event_time ?? '',
      address: e.address ?? '',
      link_url: e.link_url ?? '',
      link_text: e.link_text ?? '',
      tag: e.tag ?? '',
      featured: e.featured,
      orientation: e.orientation ?? '',
      notes: e.notes ?? '',
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
      subtitle: draft.subtitle.trim() || null,
      host: draft.host.trim() || null,
      date_text: draft.date_text.trim() || null,
      end_date: draft.end_date ? new Date(draft.end_date).toISOString() : null,
      event_time: draft.event_time.trim() || null,
      address: draft.address.trim() || null,
      link_url: draft.link_url.trim() || null,
      link_text: draft.link_text.trim() || null,
      tag: draft.tag.trim() || null,
      featured: draft.featured,
      orientation: draft.orientation.trim() || null,
      notes: draft.notes.trim() || null,
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
        subtitle: h.subtitle,
        host: h.host,
        date_text: h.date_text,
        end_date: h.end_date,
        event_time: h.event_time,
        address: h.address,
        link_url: h.link_url,
        link_text: h.link_text,
        tag: h.tag,
        featured: h.featured,
        orientation: h.orientation,
        notes: h.notes,
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
              Address
              <input value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
            </label>
            <label>
              Display date text
              <input
                value={draft.date_text}
                onChange={(e) => setDraft({ ...draft, date_text: e.target.value })}
                placeholder="e.g. October 13–15, 2026"
              />
              <span className="field-hint">Shown on the card instead of the raw date above — written out however reads best.</span>
            </label>
            <label>
              End date (optional, for multi-day events)
              <input
                type="date"
                value={draft.end_date}
                onChange={(e) => setDraft({ ...draft, end_date: e.target.value })}
              />
            </label>
            <label>
              Display time text (optional)
              <input value={draft.event_time} onChange={(e) => setDraft({ ...draft, event_time: e.target.value })} />
            </label>
            <label>
              Subtitle
              <input value={draft.subtitle} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} />
            </label>
            <label>
              Host
              <input value={draft.host} onChange={(e) => setDraft({ ...draft, host: e.target.value })} />
            </label>
            <label>
              Tag
              <input
                value={draft.tag}
                onChange={(e) => setDraft({ ...draft, tag: e.target.value })}
                placeholder="e.g. Dallas District, Tarrant District, International"
              />
            </label>
            <label>
              Registration / info link (optional)
              <input value={draft.link_url} onChange={(e) => setDraft({ ...draft, link_url: e.target.value })} />
            </label>
            <label>
              Link button text (optional)
              <input value={draft.link_text} onChange={(e) => setDraft({ ...draft, link_text: e.target.value })} />
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
              Notes (optional, shown alongside the featured card)
              <textarea rows={3} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
            </label>
            <label>
              Flyer
              <ImageUploader
                bucket="events"
                currentUrl={draft.image_url}
                onUploaded={(url) => setDraft({ ...draft, image_url: url })}
              />
            </label>
            <label>
              Flyer orientation
              <select
                value={draft.orientation}
                onChange={(e) => setDraft({ ...draft, orientation: e.target.value })}
              >
                <option value="">Portrait (default)</option>
                <option value="landscape">Landscape (wide flyer, shown uncropped)</option>
              </select>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
              />
              Active (visible on the public site)
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={draft.featured}
                onChange={(e) => setDraft({ ...draft, featured: e.target.checked })}
              />
              Featured (shown as the large spotlight card on the home page)
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
