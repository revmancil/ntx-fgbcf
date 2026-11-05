export type County = 'Dallas' | 'Tarrant'
export type AdminRole = 'super_admin' | 'editor' | 'viewer'

export interface AdminUser {
  id: string
  email: string
  role: AdminRole
  created_at: string
  updated_at: string
}

export interface Pastor {
  id: string
  name: string
  bio: string | null
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface Director {
  id: string
  name: string
  bio: string | null
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface Church {
  id: string
  name: string
  location: string | null
  county: County
  pastor_id: string | null
  director_id: string | null
  image_url: string | null
  active: boolean
  aka: string | null
  leader_title: string | null
  leader_role: string | null
  website: string | null
  is_district_overseer: boolean
  created_at: string
  updated_at: string
}

export interface EventRow {
  id: string
  title: string
  description: string | null
  date: string
  location: string | null
  image_url: string | null
  active: boolean
  subtitle: string | null
  host: string | null
  date_text: string | null
  end_date: string | null
  event_time: string | null
  address: string | null
  link_url: string | null
  link_text: string | null
  tag: string | null
  featured: boolean
  orientation: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type PageBlockType = 'heading' | 'paragraph' | 'image' | 'button' | 'accordion'

export interface PageBlock {
  id: string
  type: PageBlockType
  // Shape depends on `type`: heading/paragraph use `text`, image uses
  // `url` + `alt`, button uses `text` + `href`, accordion uses `title` +
  // `body`. Kept loose here since this is editor-side content, not a
  // schema the database enforces beyond "valid JSON".
  [key: string]: unknown
}

export interface Page {
  id: string
  slug: string
  title: string
  content: PageBlock[]
  hero_image_url: string | null
  menu_visible: boolean
  nav_order: number
  created_at: string
  updated_at: string
}

export interface HeroImage {
  id: string
  page_slug: string
  image_url: string
  created_at: string
}

export interface SiteSetting {
  id: string
  key: string
  value: string | null
  created_at: string
  updated_at: string
}
