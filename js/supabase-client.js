/**
 * NTX FGBCF — Supabase data layer for the public site.
 *
 * Requires the Supabase JS UMD bundle loaded via a <script> tag before this
 * file (see index.html etc.): the public site has no build step, so this
 * uses the CDN build directly rather than the npm package the admin portal
 * uses.
 *
 * The anon/publishable key below is safe to expose client-side by design —
 * it has no access beyond what this project's Row Level Security policies
 * grant it (public read of active content only; see supabase/migrations/).
 */
(function () {
  'use strict';

  const SUPABASE_URL = 'https://hytpynpvxoiyzlqcfbpd.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_hLc5Qjeouu4m0fUt1xOLzQ_3N5UgLI6';

  if (typeof window.supabase === 'undefined') {
    console.error('Supabase JS failed to load — public data fetches will be unavailable.');
    window.NTX_DATA = {
      getChurches: () => Promise.resolve({ data: null, error: new Error('Supabase JS not loaded') }),
      getEvents: () => Promise.resolve({ data: null, error: new Error('Supabase JS not loaded') }),
      getPages: () => Promise.resolve({ data: null, error: new Error('Supabase JS not loaded') }),
    };
    return;
  }

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  window.NTX_DATA = {
    client,
    /** Active churches, with their pastor's name/bio joined in. */
    getChurches: () => client.from('churches').select('*, pastor:pastors(name, bio, image_url)').eq('active', true),
    /** Active events, soonest first. */
    getEvents: () => client.from('events').select('*').eq('active', true).order('date', { ascending: true }),
    /** Page metadata (hero image, nav visibility/order) for every page. */
    getPages: () => client.from('pages').select('slug, title, hero_image_url, menu_visible, nav_order'),
  };

  /**
   * District metadata that rarely changes (name, color, description) stays
   * static here rather than in the database — only the person holding each
   * seat is operational data (churches.is_district_overseer), looked up at
   * render time by whichever page needs it.
   */
  window.NTX_DISTRICTS = {
    dallas: {
      key: 'dallas',
      name: 'Dallas County District',
      shortName: 'Dallas District',
      color: '#d97706',
      overseerTitle: 'Dallas District Overseer',
      description: 'Serving Dallas County and the surrounding communities of Collin, Ellis, Kaufman, and Lamar counties — including Dallas, DeSoto, Irving, Richardson, McKinney, Forney, Ennis, and Paris.'
    },
    tarrant: {
      key: 'tarrant',
      name: 'Tarrant County District',
      shortName: 'Tarrant District',
      color: '#0284c7',
      overseerTitle: 'Tarrant District Overseer',
      description: 'Serving Tarrant County and the surrounding communities reaching south through McLennan, Falls, Travis, and Bastrop counties — including Fort Worth, Forest Hill, Mansfield, Crowley, Waco, Satin, and Austin/Elgin.'
    }
  };
})();
