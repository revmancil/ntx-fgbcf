import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  // Surfaced in the UI by ProtectedRoute/Login rather than thrown here, so
  // the app still renders a useful message instead of a blank white screen
  // when the Supabase project hasn't been created/configured yet.
  console.error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy admin/.env.example to admin/.env and fill in your Supabase project values.'
  )
}

// createClient() throws synchronously if given an empty/invalid URL, which
// would crash the whole app before React can render the "not configured"
// message above. A syntactically valid placeholder keeps client creation
// safe; isSupabaseConfigured is what actually gates real usage.
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://not-configured.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'not-configured'
)
