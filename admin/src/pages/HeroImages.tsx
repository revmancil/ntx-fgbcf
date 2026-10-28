import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { ImageUploader } from '../components/ImageUploader'
import type { HeroImage, Page } from '../types'

export function HeroImages() {
  const { role } = useAuth()
  const { notify } = useToast()
  const canWrite = role === 'editor' || role === 'super_admin'

  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [activePage, setActivePage] = useState<Page | null>(null)
  const [history, setHistory] = useState<HeroImage[]>([])

  async function loadPages() {
    setLoading(true)
    const { data, error } = await supabase.from('pages').select('*').order('nav_order')
    if (error) notify(error.message, 'error')
    else setPages(data as Page[])
    setLoading(false)
  }

  useEffect(() => {
    loadPages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function openPage(p: Page) {
    setActivePage(p)
    const { data, error } = await supabase
      .from('hero_images')
      .select('*')
      .eq('page_slug', p.slug)
      .order('created_at', { ascending: false })
    if (error) {
      notify(error.message, 'error')
      return
    }
    setHistory(data as HeroImage[])
  }

  async function uploadNew(url: string) {
    if (!activePage) return
    const { error: insertError } = await supabase
      .from('hero_images')
      .insert({ page_slug: activePage.slug, image_url: url })
    const { error: updateError } = await supabase
      .from('pages')
      .update({ hero_image_url: url })
      .eq('id', activePage.id)
    if (insertError || updateError) {
      notify((insertError ?? updateError)!.message, 'error')
      return
    }
    notify('Hero image updated.')
    loadPages()
    openPage({ ...activePage, hero_image_url: url })
  }

  async function restore(h: HeroImage) {
    if (!activePage) return
    const { error } = await supabase.from('pages').update({ hero_image_url: h.image_url }).eq('id', activePage.id)
    if (error) {
      notify(error.message, 'error')
      return
    }
    notify('Hero image restored.')
    loadPages()
    setActivePage({ ...activePage, hero_image_url: h.image_url })
  }

  return (
    <div>
      <h1>Hero Images</h1>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="hero-grid">
          {pages.map((p) => (
            <button key={p.id} type="button" className="hero-thumb-card" onClick={() => openPage(p)}>
              {p.hero_image_url ? (
                <img src={p.hero_image_url} alt="" />
              ) : (
                <div className="hero-thumb-placeholder">No hero image</div>
              )}
              <span>{p.title}</span>
            </button>
          ))}
        </div>
      )}

      {activePage && (
        <div className="modal-backdrop" onClick={() => setActivePage(null)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <h3>Hero Image — {activePage.title}</h3>
            {canWrite && (
              <label>
                Upload new hero image
                <ImageUploader
                  bucket="hero-images"
                  currentUrl={activePage.hero_image_url}
                  pathPrefix={`${activePage.slug}/`}
                  onUploaded={uploadNew}
                />
              </label>
            )}

            <h4>History</h4>
            {history.length === 0 && <p>No previous hero images recorded.</p>}
            <div className="hero-history-strip">
              {history.map((h) => (
                <div key={h.id} className="hero-history-item">
                  <img src={h.image_url} alt="" />
                  <div className="history-timestamp">{new Date(h.created_at).toLocaleDateString()}</div>
                  {canWrite && h.image_url !== activePage.hero_image_url && (
                    <button type="button" className="btn btn-secondary" onClick={() => restore(h)}>
                      Restore
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setActivePage(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
