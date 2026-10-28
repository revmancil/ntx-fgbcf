import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { ImageUploader } from '../components/ImageUploader'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { Director, Pastor } from '../types'

type Profile = Pastor | Director

interface HistoryRow {
  id: string
  name: string | null
  bio: string | null
  image_url: string | null
  changed_at: string
}

const BIO_MAX_LENGTH = 5000

export function ProfileManager({
  kind,
  title,
}: {
  kind: 'pastor' | 'director'
  title: string
}) {
  const table = kind === 'pastor' ? 'pastors' : 'directors'
  const bucket = kind === 'pastor' ? 'pastors' : 'directors'
  const churchColumn = kind === 'pastor' ? 'pastor_id' : 'director_id'

  const { role } = useAuth()
  const { notify } = useToast()
  const canWrite = role === 'editor' || role === 'super_admin'
  const canDelete = role === 'super_admin'

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [churchCounts, setChurchCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const [draft, setDraft] = useState<{ id: string | null; name: string; bio: string; image_url: string | null } | null>(
    null
  )
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)
  const [historyFor, setHistoryFor] = useState<Profile | null>(null)
  const [history, setHistory] = useState<HistoryRow[]>([])

  async function loadAll() {
    setLoading(true)
    const { data, error } = await supabase.from(table).select('*').order('name')
    if (error) {
      notify(error.message, 'error')
      setLoading(false)
      return
    }
    setProfiles(data as Profile[])

    const { data: churchRows, error: churchError } = await supabase
      .from('churches')
      .select(churchColumn)
    if (!churchError && churchRows) {
      const counts: Record<string, number> = {}
      for (const row of churchRows as Record<string, string | null>[]) {
        const id = row[churchColumn]
        if (id) counts[id] = (counts[id] ?? 0) + 1
      }
      setChurchCounts(counts)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table])

  function openNew() {
    setDraft({ id: null, name: '', bio: '', image_url: null })
  }

  function openEdit(p: Profile) {
    setDraft({ id: p.id, name: p.name, bio: p.bio ?? '', image_url: p.image_url })
  }

  async function saveDraft() {
    if (!draft) return
    if (!draft.name.trim()) {
      notify('Name is required.', 'error')
      return
    }
    if (draft.bio.length > BIO_MAX_LENGTH) {
      notify(`Bio must be ${BIO_MAX_LENGTH} characters or fewer.`, 'error')
      return
    }
    setSaving(true)
    const payload = { name: draft.name.trim(), bio: draft.bio.trim() || null, image_url: draft.image_url }
    const result = draft.id
      ? await supabase.from(table).update(payload).eq('id', draft.id)
      : await supabase.from(table).insert(payload)
    setSaving(false)
    if (result.error) {
      notify(result.error.message, 'error')
      return
    }
    notify(draft.id ? 'Profile updated.' : 'Profile created.')
    setDraft(null)
    loadAll()
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    const assignedCount = churchCounts[deleteTarget.id] ?? 0
    if (assignedCount > 0) {
      notify(
        `Cannot delete — still assigned to ${assignedCount} church${assignedCount === 1 ? '' : 'es'}. Reassign those first.`,
        'error'
      )
      setDeleteTarget(null)
      return
    }
    const { error } = await supabase.from(table).delete().eq('id', deleteTarget.id)
    setDeleteTarget(null)
    if (error) {
      // Belt-and-suspenders: the RESTRICT foreign key also rejects this
      // server-side even if churchCounts was stale.
      if (error.code === '23503') {
        notify('Cannot delete — still assigned to at least one church. Reassign it first.', 'error')
      } else {
        notify(error.message, 'error')
      }
      return
    }
    notify('Profile deleted.')
    loadAll()
  }

  async function openHistory(p: Profile) {
    setHistoryFor(p)
    const { data, error } = await supabase
      .from('profile_history')
      .select('*')
      .eq('profile_type', kind)
      .eq('profile_id', p.id)
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
      .from(table)
      .update({ name: h.name, bio: h.bio, image_url: h.image_url })
      .eq('id', historyFor.id)
    if (error) {
      notify(error.message, 'error')
      return
    }
    notify('Profile restored to selected version.')
    setHistoryFor(null)
    loadAll()
  }

  return (
    <div>
      <div className="page-header">
        <h1>{title}</h1>
        {canWrite && (
          <button type="button" className="btn btn-primary" onClick={openNew}>
            + New {kind === 'pastor' ? 'Pastor' : 'Director'}
          </button>
        )}
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="card-grid profile-grid">
          {profiles.map((p) => (
            <div key={p.id} className="profile-card">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="profile-photo" />
              ) : (
                <div className="profile-photo profile-photo-placeholder">No photo</div>
              )}
              <h3>{p.name}</h3>
              <p className="profile-bio">{p.bio}</p>
              <p className="profile-meta">
                Assigned to {churchCounts[p.id] ?? 0} church{(churchCounts[p.id] ?? 0) === 1 ? '' : 'es'}
              </p>
              <div className="row-actions">
                <button type="button" className="btn-link" onClick={() => openHistory(p)}>
                  History
                </button>
                {canWrite && (
                  <button type="button" className="btn-link" onClick={() => openEdit(p)}>
                    Edit
                  </button>
                )}
                {canDelete && (
                  <button type="button" className="btn-link btn-link-danger" onClick={() => setDeleteTarget(p)}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
          {profiles.length === 0 && <p>No {title.toLowerCase()} yet.</p>}
        </div>
      )}

      {draft && (
        <div className="modal-backdrop" onClick={() => setDraft(null)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <h3>{draft.id ? 'Edit' : 'New'} {kind === 'pastor' ? 'Pastor' : 'Director'}</h3>
            <label>
              Name
              <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </label>
            <label>
              Bio
              <textarea
                rows={6}
                value={draft.bio}
                maxLength={BIO_MAX_LENGTH}
                onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
              />
              <span className="field-hint">
                {draft.bio.length} / {BIO_MAX_LENGTH}
              </span>
            </label>
            <label>
              Photo
              <ImageUploader
                bucket={bucket}
                currentUrl={draft.image_url}
                onUploaded={(url) => setDraft({ ...draft, image_url: url })}
              />
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
                    <strong>{h.name}</strong>
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
        title={`Delete ${kind}`}
        message={`Permanently delete "${deleteTarget?.name}"? This cannot be undone from the dashboard.`}
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
