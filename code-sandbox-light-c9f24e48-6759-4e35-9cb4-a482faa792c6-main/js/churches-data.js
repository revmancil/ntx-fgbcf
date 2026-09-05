/**
 * North Texas State — Full Gospel Baptist Church Fellowship
 * Church directory data (source: NTX_FGBCF_Church_Locations.xlsx, research date Sept 3, 2026)
 *
 * district: "dallas"  = Dallas County District  (highlighted orange in spreadsheet)
 *           "tarrant" = Tarrant County District (highlighted blue in spreadsheet)
 *
 * status legend:
 *   "Confirmed"        – street address found from church website or reliable directory
 *   "Confirmed (city)" – city confirmed; street address not located
 *   "Confirmed (area)" – general area confirmed only (PO box / social media)
 */
const NTX_DISTRICTS = {
  dallas: {
    key: 'dallas',
    name: 'Dallas County District',
    shortName: 'Dallas District',
    color: '#d97706',
    overseer: 'Dallas District Overseer Billy Adkinson',
    overseerTitle: 'Dallas District Overseer',
    overseerName: 'Billy Adkinson',
    overseerId: 'higher-mark-fgbc',
    overseerChurch: 'Higher Mark FGBC, DeSoto',
    description: 'Serving Dallas County and the surrounding communities of Collin, Ellis, Kaufman, and Lamar counties — including Dallas, DeSoto, Irving, Richardson, McKinney, Forney, Ennis, and Paris.'
  },
  tarrant: {
    key: 'tarrant',
    name: 'Tarrant County District',
    shortName: 'Tarrant District',
    color: '#0284c7',
    overseer: 'Tarrant District Overseer Elvis L. Bowman',
    overseerTitle: 'Tarrant District Overseer',
    overseerName: 'Elvis L. Bowman',
    overseerId: 'greater-mt-tabor',
    overseerChurch: 'Greater Mt. Tabor Christian Center, Fort Worth',
    description: 'Serving Tarrant County and the surrounding communities reaching south through McLennan, Falls, Travis, and Bastrop counties — including Fort Worth, Forest Hill, Mansfield, Crowley, Waco, Satin, and Austin/Elgin.'
  }
};

const NTX_CHURCHES = [
  {
    id: 'jubilee-community-church',
    church: 'Jubilee Community Church',
    aka: 'The Jubilee Church',
    title: 'Bishop',
    role: 'State Bishop',
    firstName: 'Gregory', middleName: 'L', lastName: 'Drake',
    city: 'DeSoto',
    address: '200 Lion St, DeSoto, TX 75115',
    county: 'Dallas',
    district: 'dallas',
    status: 'Confirmed',
    website: 'https://www.jubileecc.org',
    links: ['https://www.jubileecc.org/leadership', 'https://www.gregoryldrake.com/events']
  },
  {
    id: 'higher-mark-fgbc',
    church: 'Higher Mark FGBC',
    title: 'Dallas District Overseer',
    role: 'Dallas District Overseer',
    featured: true,
    firstName: 'Billy', middleName: '', lastName: 'Adkinson',
    city: 'DeSoto',
    address: '335 East Wintergreen Road, Ste 101, DeSoto, TX 75115',
    county: 'Dallas',
    district: 'dallas',
    status: 'Confirmed',
    website: 'https://www.facebook.com/HigherMarkChurch/',
    links: ['https://www.facebook.com/HigherMarkChurch/']
  },
  {
    id: 'greater-mt-tabor',
    church: 'Greater Mt. Tabor Christian Center',
    title: 'Tarrant District Overseer',
    role: 'Tarrant District Overseer',
    featured: true,
    firstName: 'Elvis', middleName: 'L', lastName: 'Bowman',
    city: 'Fort Worth',
    address: '2513 S Edgewood Terrace, Fort Worth, TX 76105',
    county: 'Tarrant',
    district: 'tarrant',
    status: 'Confirmed',
    website: 'https://gmtcc.org',
    links: ['https://gmtcc.org/about/']
  },
  {
    id: 'new-jerusalem-mckinney',
    church: 'New Jerusalem Baptist Church',
    title: 'Pastor',
    role: 'Pastor',
    firstName: 'Myron', middleName: '', lastName: 'Bradford',
    city: 'McKinney',
    address: '1415 Anthony St, McKinney, TX 75069',
    county: 'Collin',
    district: 'dallas',
    status: 'Confirmed (city)',
    website: 'https://newjmckinney.org',
    links: ['https://newjmckinney.org/team/pastor-myron-bradford/', 'https://www.facebook.com/newjmckinney']
  },
  {
    id: 'victory-station-ministries',
    church: 'Victory Station Ministries',
    title: 'Senior Pastor',
    role: 'Senior Pastor',
    firstName: 'Craig', middleName: '', lastName: 'Brown',
    city: 'Irving',
    address: '1601 Camino Lago, Irving, TX 75039',
    county: 'Dallas',
    district: 'dallas',
    status: 'Confirmed',
    website: 'https://www.victorystationministries.org/',
    links: ['https://www.victorystationministries.org/']
  },
  {
    id: 'avenue-progressive',
    church: 'Avenue Progressive Baptist Church',
    title: 'Pastor',
    role: 'Pastor',
    firstName: 'Mancil', middleName: '', lastName: 'Carroll III',
    city: 'Dallas',
    address: '3745 Dildock St, Dallas, TX 75215',
    county: 'Dallas',
    district: 'dallas',
    status: 'Confirmed',
    website: 'https://www.avenuepbc.org/',
    links: ['https://www.avenuepbc.org/']
  },
  {
    id: 'new-generation-church',
    church: 'New Generation Church',
    title: 'Pastor',
    role: 'Pastor',
    firstName: 'Abraham', middleName: '', lastName: 'Clark',
    city: 'Dallas',
    address: '1530 Bonnie View Road, Dallas, TX 75203',
    county: 'Dallas',
    district: 'dallas',
    status: 'Confirmed',
    website: '',
    links: []
  },
  {
    id: 'church-within',
    church: 'Church Within Christian Ministries',
    title: 'Senior Pastor',
    role: 'Senior Pastor',
    firstName: 'Leeora', middleName: '', lastName: 'Dove',
    city: 'Austin / Elgin',
    address: 'P.O. Box 18134, Austin, TX (mailing)',
    county: 'Travis / Bastrop',
    district: 'tarrant',
    status: 'Confirmed (area)',
    website: 'https://www.facebook.com/people/The-Church-Within-Christian-Ministry/100064782843990/',
    links: ['https://www.facebook.com/people/The-Church-Within-Christian-Ministry/100064782843990/', 'https://www.instagram.com/churchwithinofelgintx/']
  },
  {
    id: 'christ-lifters',
    church: 'Christ Lifters Community of Faith',
    title: 'General Overseer',
    role: 'General Overseer',
    firstName: 'Montreal', middleName: '', lastName: 'Dukes',
    city: 'Fort Worth',
    address: '2820 E 1st St, Fort Worth, TX 76111',
    county: 'Tarrant',
    district: 'tarrant',
    status: 'Confirmed',
    website: '',
    links: ['https://www.churchfinder.com/churches/tx/fort-worth/christ-lifters-community-faith']
  },
  {
    id: 'carver-park-baptist',
    church: 'Carver Park Baptist Church',
    title: 'Pastor',
    role: 'Pastor',
    firstName: 'Gaylon', middleName: '', lastName: 'Foreman',
    city: 'Waco',
    address: '1020 E Herring Ave, Waco, TX 76704',
    county: 'McLennan',
    district: 'tarrant',
    status: 'Confirmed',
    website: 'https://www.carverparkwaco.org',
    links: ['https://www.carverparkwaco.org/our-pastor/']
  },
  {
    id: 'walking-in-his-image',
    church: 'Walking In His Image Ministries',
    title: 'Pastor',
    role: 'Senior Pastor',
    firstName: 'Torey', middleName: '', lastName: 'Franklin',
    city: 'Fort Worth',
    address: '',
    county: 'Tarrant',
    district: 'tarrant',
    status: 'Confirmed (city)',
    website: 'https://www.facebook.com/WIHIMFW/',
    links: ['https://www.facebook.com/WIHIMFW/']
  },
  {
    id: 'cedar-grove-baptist',
    church: 'Cedar Grove Baptist Church',
    title: 'Pastor',
    role: 'Pastor',
    firstName: 'Brandon', middleName: '', lastName: 'Hubbard',
    city: 'Satin',
    address: '',
    county: 'Falls',
    district: 'tarrant',
    status: 'Confirmed (city)',
    website: '',
    links: []
  },
  {
    id: 'life-community-fellowship',
    church: 'The Life Community Fellowship Church',
    title: 'Senior Pastor',
    role: 'Senior Pastor',
    firstName: 'Dameon', middleName: 'E', lastName: 'Madison',
    city: 'Richardson',
    address: '1655 N Central Expressway, Richardson, TX 75080',
    county: 'Dallas',
    district: 'dallas',
    status: 'Confirmed',
    website: '',
    links: []
  },
  {
    id: 'impact-church-dfw',
    church: 'Impact Church DFW',
    title: 'Pastor',
    role: 'Pastor',
    firstName: 'Rasby', middleName: '', lastName: 'Mason III',
    city: 'Mansfield',
    address: '3126 E. Broad Street, Mansfield, TX 76063',
    county: 'Tarrant',
    district: 'tarrant',
    status: 'Confirmed',
    website: 'https://icdfw.org/',
    links: ['https://icdfw.org/', 'https://www.facebook.com/impactchurchdfw/']
  },
  {
    id: 'higher-praise-family',
    church: 'Higher Praise Family Church',
    title: 'Senior Pastor',
    role: 'Senior Pastor',
    firstName: 'Patrick', middleName: '', lastName: 'McGrew',
    city: 'Fort Worth (Forest Hill)',
    address: '2909 Horton Rd, Forest Hill, TX 76119',
    county: 'Tarrant',
    district: 'tarrant',
    status: 'Confirmed',
    website: 'https://higher-praise.org',
    links: ['https://higher-praise.org/meet-family.html']
  },
  {
    id: 'community-fellowship-forney',
    church: 'Community Fellowship Church',
    title: 'Pastor',
    role: 'Pastor',
    firstName: 'Reginald', middleName: 'Timothy', lastName: 'McNeil',
    city: 'Forney',
    address: '10658 US Hwy 80, Forney, TX 75126',
    county: 'Kaufman',
    district: 'dallas',
    status: 'Confirmed (city)',
    website: 'https://drtimothymcneil.wixsite.com/website',
    links: ['https://drtimothymcneil.wixsite.com/website']
  },
  {
    id: 'victory-christian-crowley',
    church: 'Victory Christian Center – Crowley',
    title: 'Pastor',
    role: 'Pastor',
    firstName: 'Enrico', middleName: '', lastName: 'Odom',
    city: 'Crowley',
    address: '',
    county: 'Tarrant',
    district: 'tarrant',
    status: 'Confirmed (city)',
    website: 'https://www.facebook.com/602194126311087',
    links: ['https://www.facebook.com/602194126311087']
  },
  {
    id: 'new-founders-mbc',
    church: 'New Founders Missionary Baptist Church',
    title: 'Pastor',
    role: 'Pastor',
    firstName: 'Billy', middleName: 'T', lastName: 'Swanson',
    city: 'Ennis',
    address: '1903 Lafayette St, Ennis, TX 75119',
    county: 'Ellis',
    district: 'dallas',
    status: 'Confirmed',
    website: 'https://mynewfounders.com/',
    links: ['https://mynewfounders.com/']
  },
  {
    id: 'solid-rock-bc-paris',
    church: 'Solid Rock Baptist Church',
    title: 'Senior Pastor',
    role: 'Senior Pastor',
    firstName: 'Floyd', middleName: '', lastName: 'Trotter',
    city: 'Paris',
    address: '1110 W. Henderson Street, Paris, TX',
    county: 'Lamar',
    district: 'dallas',
    status: 'Confirmed',
    website: '',
    links: []
  }
];

/** Helper: full display name of the leader, e.g. "Bishop Gregory L. Drake" */
function ntxLeaderName(c, withTitle = true) {
  const mid = c.middleName ? ' ' + c.middleName + (c.middleName.length === 1 ? '.' : '') : '';
  const name = `${c.firstName}${mid} ${c.lastName}`;
  return withTitle ? `${c.title} ${name}` : name;
}
