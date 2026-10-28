import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface Counts {
  churches: number
  pastors: number
  directors: number
  events: number
  pages: number
}

export function Dashboard() {
  const [counts, setCounts] = useState<Counts | null>(null)

  useEffect(() => {
    async function load() {
      const [churches, pastors, directors, events, pages] = await Promise.all([
        supabase.from('churches').select('id', { count: 'exact', head: true }),
        supabase.from('pastors').select('id', { count: 'exact', head: true }),
        supabase.from('directors').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true }),
        supabase.from('pages').select('id', { count: 'exact', head: true }),
      ])
      setCounts({
        churches: churches.count ?? 0,
        pastors: pastors.count ?? 0,
        directors: directors.count ?? 0,
        events: events.count ?? 0,
        pages: pages.count ?? 0,
      })
    }
    load()
  }, [])

  const cards = [
    { label: 'Churches', count: counts?.churches, to: '/churches' },
    { label: 'Pastors', count: counts?.pastors, to: '/pastors' },
    { label: 'Directors', count: counts?.directors, to: '/directors' },
    { label: 'Events', count: counts?.events, to: '/events' },
    { label: 'Pages', count: counts?.pages, to: '/pages' },
  ]

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="card-grid">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="stat-card">
            <div className="stat-value">{c.count ?? '—'}</div>
            <div className="stat-label">{c.label}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
