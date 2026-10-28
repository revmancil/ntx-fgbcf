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
