import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { ImageUploader } from '../components/ImageUploader'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { Page, PageBlock, PageBlockType } from '../types'

const RESERVED_SLUGS = ['admin', 'api', 'login']
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function newBlock(type: PageBlockType): PageBlock {
  const id = crypto.randomUUID()
  switch (type) {
    case 'heading':
    case 'paragraph':
      return { id, type, text: '' }
    case 'image':
      return { id, type, url: '', alt: '' }
    case 'button':
      return { id, type, text: '', href: '' }
    case 'accordion':
      return { id, type, title: '', body: '' }
  }
}

interface HistoryRow {
  id: string
  slug: string | null
  title: string | null
  content: PageBlock[] | null
  hero_image_url: string | null
  menu_visible: boolean | null
  nav_order: number | null
  changed_at: string
}

export function Pages() {
  const { role } = useAuth()
  const { notify } = useToast()
  const canWrite = role === 'editor' || role === 'super_admin'
  const canDelete = role === 'super_admin'

  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Page | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Page | null>(null)
  const [historyFor, setHistoryFor] = useState<Page | null>(null)
  const [history, setHistory] = useState<HistoryRow[]>([])
  const [saving, setSaving] = useState(false)

  async function loadAll() {
    setLoading(true)
    const { data, error } = await supabase.from('pages').select('*').order('nav_order')
    if (error) notify(error.message, 'error')
    else setPages(data as Page[])
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function toggleMenuVisible(p: Page) {
    const { error } = await supabase.from('pages').update({ menu_visible: !p.menu_visible }).eq('id', p.id)
    if (error) {
      notify(error.message, 'error')
      return
    }
    loadAll()
  }

  async function move(p: Page, direction: -1 | 1) {
    const sorted = [...pages].sort((a, b) => a.nav_order - b.nav_order)
    const index = sorted.findIndex((x) => x.id === p.id)
    const swapIndex = index + direction
    if (swapIndex < 0 || swapIndex >= sorted.length) return
    const other = sorted[swapIndex]

    const { error: e1 } = await supabase.from('pages').update({ nav_order: other.nav_order }).eq('id', p.id)
    const { error: e2 } = await supabase.from('pages').update({ nav_order: p.nav_order }).eq('id', other.id)
    if (e1 || e2) {
      notify((e1 ?? e2)!.message, 'error')
      return
    }
    loadAll()
  }

  async function createPage() {
    const slug = newSlug || slugify(newTitle)
    if (!newTitle.trim()) {
      notify('Title is required.', 'error')
      return
    }
    if (!SLUG_PATTERN.test(slug)) {
      notify('Slug must be lowercase letters, numbers, and hyphens only.', 'error')
      return
    }
    if (RESERVED_SLUGS.includes(slug)) {
      notify(`"${slug}" is a reserved slug.`, 'error')
      return
    }
    setSaving(true)
    const maxOrder = pages.reduce((m, p) => Math.max(m, p.nav_order), -1)
    const { error } = await supabase.from('pages').insert({
      slug,
      title: newTitle.trim(),
      content: [],
      menu_visible: true,
      nav_order: maxOrder + 1,
    })
    setSaving(false)
    if (error) {
      notify(error.message, 'error')
      return
    }
    notify('Page created.')
    setNewOpen(false)
    setNewTitle('')
    setNewSlug('')
    setSlugTouched(false)
    loadAll()
  }

  async function saveContent() {
    if (!editing) return
    setSaving(true)
    const { error } = await supabase
      .from('pages')
      .update({ title: editing.title, content: editing.content, hero_image_url: editing.hero_image_url })
      .eq('id', editing.id)
    setSaving(false)
    if (error) {
      notify(error.message, 'error')
      return
    }
    notify('Page saved.')
    setEditing(null)
    loadAll()
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    if (deleteTarget.menu_visible) {
      notify('Hide this page from the menu before deleting it.', 'error')
      setDeleteTarget(null)
      return
    }
    const { error } = await supabase.from('pages').delete().eq('id', deleteTarget.id)
    setDeleteTarget(null)
    if (error) {
      notify(error.message, 'error')
      return
    }
    notify('Page deleted.')
    loadAll()
  }

  async function openHistory(p: Page) {
    setHistoryFor(p)
    const { data, error } = await supabase
      .from('pages_history')
      .select('*')
      .eq('page_id', p.id)
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
      .from('pages')
      .update({ title: h.title, content: h.content, hero_image_url: h.hero_image_url })
      .eq('id', historyFor.id)
    if (error) {
      notify(error.message, 'error')
      return
    }
    notify('Page restored to selected version.')
    setHistoryFor(null)
    loadAll()
  }

  function updateBlock(index: number, patch: Partial<PageBlock>) {
    if (!editing) return
    const content = [...editing.content]
    content[index] = { ...content[index], ...patch }
    setEditing({ ...editing, content })
  }

  function addBlock(type: PageBlockType) {
    if (!editing) return
    setEditing({ ...editing, content: [...editing.content, newBlock(type)] })
  }

  function removeBlock(index: number) {
    if (!editing) return
    const content = editing.content.filter((_, i) => i !== index)
    setEditing({ ...editing, content })
  }

  function moveBlock(index: number, direction: -1 | 1) {
    if (!editing) return
    const target = index + direction
    if (target < 0 || target >= editing.content.length) return
    const content = [...editing.content]
    const [block] = content.splice(index, 1)
    content.splice(target, 0, block)
    setEditing({ ...editing, content })
  }

  const sortedPages = [...pages].sort((a, b) => a.nav_order - b.nav_order)
  const visibleCount = pages.filter((p) => p.menu_visible).length

  return (
    <div>
      <div className="page-header">
        <h1>Pages &amp; Menu</h1>
        {canWrite && (
          <button type="button" className="btn btn-primary" onClick={() => setNewOpen(true)}>
            + New Page
          </button>
        )}
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Title</th>
              <th>Slug</th>
              <th>In menu</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sortedPages.map((p, i) => (
              <tr key={p.id}>
                <td className="reorder-cell">
                  {canWrite && (
                    <>
                      <button type="button" className="btn-icon" disabled={i === 0} onClick={() => move(p, -1)}>
                        ↑
                      </button>
                      <button
                        type="button"
                        className="btn-icon"
                        disabled={i === sortedPages.length - 1}
                        onClick={() => move(p, 1)}
                      >
                        ↓
                      </button>
                    </>
                  )}
                </td>
                <td>{p.title}</td>
                <td>
                  <code>/{p.slug}</code>
                </td>
                <td>
                  <button
                    type="button"
                    className={p.menu_visible ? 'pill pill-active' : 'pill pill-inactive'}
                    disabled={!canWrite || (p.menu_visible && visibleCount <= 1) || p.slug === 'home'}
                    onClick={() => toggleMenuVisible(p)}
                    title={p.slug === 'home' ? 'The home page cannot be hidden' : undefined}
                  >
                    {p.menu_visible ? 'Visible' : 'Hidden'}
                  </button>
                </td>
                <td className="row-actions">
                  <button type="button" className="btn-link" onClick={() => openHistory(p)}>
                    History
                  </button>
                  {canWrite && (
                    <button type="button" className="btn-link" onClick={() => setEditing(p)}>
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button type="button" className="btn-link btn-link-danger" onClick={() => setDeleteTarget(p)}>
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {newOpen && (
        <div className="modal-backdrop" onClick={() => setNewOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>New Page</h3>
            <label>
              Title
              <input
                value={newTitle}
                onChange={(e) => {
                  setNewTitle(e.target.value)
                  if (!slugTouched) setNewSlug(slugify(e.target.value))
                }}
              />
            </label>
            <label>
              Slug
              <input
                value={newSlug}
                onChange={(e) => {
                  setSlugTouched(true)
                  setNewSlug(e.target.value)
                }}
              />
              <span className="field-hint">/{newSlug || 'your-slug'}</span>
            </label>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setNewOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={createPage} disabled={saving}>
                {saving ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="modal-backdrop" onClick={() => setEditing(null)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <h3>Edit — {editing.title}</h3>
            <label>
              Title
              <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            </label>
            <label>
              Hero image
              <ImageUploader
                bucket="hero-images"
                currentUrl={editing.hero_image_url}
                pathPrefix={`${editing.slug}/`}
                onUploaded={async (url) => {
                  setEditing({ ...editing, hero_image_url: url })
                  // Also append to the hero_images history table so Hero
                  // Image Management can offer it as a restorable version.
                  await supabase.from('hero_images').insert({ page_slug: editing.slug, image_url: url })
                }}
              />
            </label>

            <h4>Content blocks</h4>
            {editing.content.map((block, i) => (
              <div key={block.id} className="block-editor-item">
                <div className="block-editor-header">
                  <span className="block-type-label">{block.type}</span>
                  <div>
                    <button type="button" className="btn-icon" disabled={i === 0} onClick={() => moveBlock(i, -1)}>
                      ↑
                    </button>
                    <button
                      type="button"
                      className="btn-icon"
                      disabled={i === editing.content.length - 1}
                      onClick={() => moveBlock(i, 1)}
                    >
                      ↓
                    </button>
                    <button type="button" className="btn-icon btn-icon-danger" onClick={() => removeBlock(i)}>
                      ✕
                    </button>
                  </div>
                </div>
                {(block.type === 'heading' || block.type === 'paragraph') && (
                  <textarea
                    rows={block.type === 'heading' ? 1 : 3}
                    value={(block.text as string) ?? ''}
                    onChange={(e) => updateBlock(i, { text: e.target.value })}
                  />
                )}
                {block.type === 'image' && (
                  <>
                    <ImageUploader
                      bucket="pages"
                      currentUrl={(block.url as string) || null}
                      pathPrefix={`${editing.slug}/`}
                      onUploaded={(url) => updateBlock(i, { url })}
                    />
                    <input
                      placeholder="Alt text"
                      value={(block.alt as string) ?? ''}
                      onChange={(e) => updateBlock(i, { alt: e.target.value })}
                    />
                  </>
                )}
                {block.type === 'button' && (
                  <>
                    <input
                      placeholder="Button text"
                      value={(block.text as string) ?? ''}
                      onChange={(e) => updateBlock(i, { text: e.target.value })}
                    />
                    <input
                      placeholder="Link URL"
                      value={(block.href as string) ?? ''}
                      onChange={(e) => updateBlock(i, { href: e.target.value })}
                    />
                  </>
                )}
                {block.type === 'accordion' && (
                  <>
                    <input
                      placeholder="Accordion title"
                      value={(block.title as string) ?? ''}
                      onChange={(e) => updateBlock(i, { title: e.target.value })}
                    />
                    <textarea
                      rows={3}
                      placeholder="Accordion body"
                      value={(block.body as string) ?? ''}
                      onChange={(e) => updateBlock(i, { body: e.target.value })}
                    />
                  </>
                )}
              </div>
            ))}

            <div className="add-block-row">
              {(['heading', 'paragraph', 'image', 'button', 'accordion'] as PageBlockType[]).map((t) => (
                <button key={t} type="button" className="btn btn-secondary" onClick={() => addBlock(t)}>
                  + {t}
                </button>
              ))}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={saveContent} disabled={saving}>
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
                    <strong>{h.title}</strong> · {h.content?.length ?? 0} block(s)
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
        title="Delete page"
        message={`Permanently delete "${deleteTarget?.title}"? This cannot be undone from the dashboard.`}
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
