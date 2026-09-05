/**
 * North Texas State — Spotlight events
 * Add / edit events here; the home page spotlight renders from this list.
 *
 * Fields:
 *   id        unique slug
 *   title     event name
 *   subtitle  short tagline
 *   host      hosting church / ministry
 *   dateText  human‑readable date
 *   date      ISO date (YYYY-MM-DD) used for sorting (first day of the event)
 *   endDate   ISO date of the last day (optional)
 *   time      time text (optional)
 *   location  venue name
 *   address   street address
 *   flyer     path to flyer image
 *   link      registration / info URL (optional)
 *   linkText  label for the link button (optional)
 *   tag       small label shown on the card (e.g. "International", "Dallas District")
 *   featured  true = larger card (same size as the PROPEL card)
 *   orientation 'landscape' for wide flyers (shown uncropped over a blurred backdrop); omit for portrait
 */
const NTX_EVENTS = [
  {
    id: 'propel-10',
    title: 'PROPEL 10 — Building What Matters',
    subtitle: 'FGBCF International Conference • 10th Anniversary',
    host: 'Full Gospel Baptist Church Fellowship International',
    dateText: 'October 13–15, 2026',
    date: '2026-10-13',
    endDate: '2026-10-15',
    time: '',
    location: 'Elizabeth Baptist Church',
    address: 'Atlanta, GA',
    flyer: 'images/flyer-propel.jpg',
    link: 'https://www.fullgospelbaptist.org',
    linkText: 'Register — $149 Early',
    tag: 'International',
    featured: true,
    notes: 'Bishop Joseph W. Walker III, International Presiding Bishop • Host: Bishop Craig Oliver, 2nd Presiding Bishop'
  },
  {
    id: 'endless-love-2026',
    title: 'Endless Love Marriage Retreat',
    subtitle: 'Mark your calendars',
    host: 'Victory Station Ministries • Pastor Craig & Dr. Toni Brown',
    dateText: 'September 11–12, 2026',
    date: '2026-09-11',
    endDate: '2026-09-12',
    time: '',
    location: 'Aloft DFW Airport North',
    address: '4921 Regent Blvd, Irving, TX 75063',
    flyer: 'images/flyer-endless-love.jpg',
    link: 'https://www.victorystationministries.org/',
    linkText: 'Learn More',
    tag: 'Dallas District',
    featured: false
  },
  {
    id: 'roar-red-2026',
    title: 'ROAR — RED Women’s Conference',
    subtitle: 'Remembering Every Day',
    host: 'Host / Visionary: Lady Edwina West‑Dukes • Keynote: Cycelia Matthews',
    dateText: 'October 10, 2026',
    date: '2026-10-10',
    endDate: '2026-10-10',
    time: '',
    location: 'Hurst Conference Center',
    address: '1601 Campus Dr, Hurst, TX 76054',
    flyer: 'images/flyer-roar.jpg',
    link: '',
    linkText: '',
    tag: 'Tarrant District',
    featured: false
  },
  {
    id: 'leadership-huddle-2027',
    title: 'Leadership Huddle 2027',
    subtitle: 'Save the Date • North Texas Full Gospel',
    host: 'Bishop Gregory L. Drake, North Texas State Bishop',
    dateText: 'Saturday, January 30, 2027',
    date: '2027-01-30',
    endDate: '2027-01-30',
    time: '',
    location: 'The Jubilee Church',
    address: '200 Lion St, DeSoto, TX 75115',
    flyer: 'images/flyer-leadership-huddle.jpg',
    orientation: 'landscape',
    link: 'contact.html',
    linkText: 'Get Updates',
    tag: 'North Texas State',
    featured: false,
    notes: 'Great speakers! Powerful sessions! Unlimited inspiration! Join us for a day full of empowerment.'
  }
];
