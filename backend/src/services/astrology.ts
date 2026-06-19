import swisseph from 'swisseph'

const SIGN_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
]

const SIGN_ELEMENTS: Record<string, string> = {
  Aries: 'Fire', Taurus: 'Earth', Gemini: 'Air', Cancer: 'Water',
  Leo: 'Fire', Virgo: 'Earth', Libra: 'Air', Scorpio: 'Water',
  Sagittarius: 'Fire', Capricorn: 'Earth', Aquarius: 'Air', Pisces: 'Water'
}

const SIGN_MODALITIES: Record<string, string> = {
  Aries: 'Cardinal', Taurus: 'Fixed', Gemini: 'Mutable', Cancer: 'Cardinal',
  Leo: 'Fixed', Virgo: 'Mutable', Libra: 'Cardinal', Scorpio: 'Fixed',
  Sagittarius: 'Mutable', Capricorn: 'Cardinal', Aquarius: 'Fixed', Pisces: 'Mutable'
}

const SIGN_RULERS: Record<string, string> = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon',
  Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Pluto',
  Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Uranus', Pisces: 'Neptune'
}

export interface PlanetPosition {
  name: string
  longitude: number
  sign: string
  degree: number
  minute: number
  second: number
  retrograde: boolean
  speed: number
}

export interface HouseInfo {
  sign: string
  degree: number
  minute: number
  longitude: number
}

export interface NatalChart {
  planets: PlanetPosition[]
  ascendant: HouseInfo
  midheaven: HouseInfo
  houses: HouseInfo[]
  sunSign: string
  moonSign: string
  risingSign: string
}

function getSignFromLongitude(longitude: number): { sign: string; degree: number; minute: number; second: number } {
  const norm = ((longitude % 360) + 360) % 360
  const signIndex = Math.floor(norm / 30)
  const degInSign = norm - signIndex * 30
  const degree = Math.floor(degInSign)
  const minFloat = (degInSign - degree) * 60
  const minute = Math.floor(minFloat)
  const second = Math.floor((minFloat - minute) * 60)
  return { sign: SIGN_NAMES[signIndex], degree, minute, second }
}

export interface BirthInput {
  birthDate: string
  birthTime?: string
  birthPlace?: string
  timezone?: number
  latitude?: number
  longitude?: number
}

const PLACE_COORDS: Record<string, { lat: number; lon: number; tz: number }> = {
  'bangkok, thailand': { lat: 13.7563, lon: 100.5018, tz: 7 },
  'ho chi minh city, vietnam': { lat: 10.8231, lon: 106.6297, tz: 7 },
  'hanoi, vietnam': { lat: 21.0278, lon: 105.8342, tz: 7 },
  'chiang mai, thailand': { lat: 18.7883, lon: 98.9853, tz: 7 },
  'singapore': { lat: 1.3521, lon: 103.8198, tz: 8 },
  'kuala lumpur, malaysia': { lat: 3.139, lon: 101.6869, tz: 8 },
  'jakarta, indonesia': { lat: -6.2088, lon: 106.8456, tz: 7 },
  'manila, philippines': { lat: 14.5995, lon: 120.9842, tz: 8 },
  'taipei, taiwan': { lat: 25.033, lon: 121.565, tz: 8 },
  'shanghai, china': { lat: 31.2304, lon: 121.4737, tz: 8 },
  'beijing, china': { lat: 39.9042, lon: 116.4074, tz: 8 },
  'hong kong': { lat: 22.3193, lon: 114.1694, tz: 8 },
  'tokyo, japan': { lat: 35.6762, lon: 139.6503, tz: 9 },
  'seoul, korea': { lat: 37.5665, lon: 126.978, tz: 9 },
  'mumbai, india': { lat: 19.076, lon: 72.8777, tz: 5.5 },
  'dubai, uae': { lat: 25.2048, lon: 55.2708, tz: 4 },
  'london, uk': { lat: 51.5074, lon: -0.1278, tz: 0 },
  'new york, usa': { lat: 40.7128, lon: -74.006, tz: -5 },
  'los angeles, usa': { lat: 34.0522, lon: -118.2437, tz: -8 },
  'sydney, australia': { lat: -33.8688, lon: 151.2093, tz: 10 },
}

function resolveLocation(input: BirthInput): { lat: number; lon: number; tz: number } {
  if (input.latitude != null && input.longitude != null && input.timezone != null) {
    return { lat: input.latitude, lon: input.longitude, tz: input.timezone }
  }
  if (input.birthPlace) {
    const key = input.birthPlace.toLowerCase().trim()
    const match = PLACE_COORDS[key]
    if (match) return match
  }
  return { lat: 13.7563, lon: 100.5018, tz: 7 }
}

export function calculateNatalChart(input: BirthInput): NatalChart {
  const date = new Date(input.birthDate)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  let hour = 12
  let minute = 0
  if (input.birthTime) {
    const parts = input.birthTime.split(':')
    hour = parseInt(parts[0], 10) || 0
    minute = parseInt(parts[1], 10) || 0
  }

  const { lat, lon, tz } = resolveLocation(input)

  const utc = (swisseph as any).swe_utc_time_zone(year, month, day, hour, minute, 0, tz)
  const jdResult = (swisseph as any).swe_utc_to_jd(utc.year, utc.month, utc.day, utc.hour, utc.minute, utc.second, (swisseph as any).SE_GREG_CAL)
  if ('error' in jdResult) throw new Error(jdResult.error)
  const juldayUT = jdResult.julianDayUT

  const flag = (swisseph as any).SEFLG_SPEED | (swisseph as any).SEFLG_MOSEPH

  const bodyDefs = [
    { id: (swisseph as any).SE_SUN, name: 'Sun' },
    { id: (swisseph as any).SE_MOON, name: 'Moon' },
    { id: (swisseph as any).SE_MERCURY, name: 'Mercury' },
    { id: (swisseph as any).SE_VENUS, name: 'Venus' },
    { id: (swisseph as any).SE_MARS, name: 'Mars' },
    { id: (swisseph as any).SE_JUPITER, name: 'Jupiter' },
    { id: (swisseph as any).SE_SATURN, name: 'Saturn' },
    { id: (swisseph as any).SE_URANUS, name: 'Uranus' },
    { id: (swisseph as any).SE_NEPTUNE, name: 'Neptune' },
    { id: (swisseph as any).SE_PLUTO, name: 'Pluto' },
    { id: (swisseph as any).SE_TRUE_NODE, name: 'North Node' },
    { id: (swisseph as any).SE_CHIRON, name: 'Chiron' },
  ]

  const planets: PlanetPosition[] = bodyDefs.map(b => {
    const pos = (swisseph as any).swe_calc_ut(juldayUT, b.id, flag)
    if ('error' in pos) {
      return { name: b.name, longitude: 0, sign: 'Unknown', degree: 0, minute: 0, second: 0, retrograde: false, speed: 0 }
    }
    const s = getSignFromLongitude(pos.longitude)
    return {
      name: b.name,
      longitude: pos.longitude,
      sign: s.sign,
      degree: s.degree,
      minute: s.minute,
      second: s.second,
      retrograde: pos.longitudeSpeed < 0,
      speed: pos.longitudeSpeed,
    }
  })

  const housesResult = (swisseph as any).swe_houses(juldayUT, lat, lon, 'P')
  if ('error' in housesResult) throw new Error(housesResult.error)

  const asc = getSignFromLongitude(housesResult.ascendant)
  const mc = getSignFromLongitude(housesResult.mc)

  const houses: HouseInfo[] = housesResult.house.map((c: number) => {
    const s = getSignFromLongitude(c)
    return { sign: s.sign, degree: s.degree, minute: s.minute, longitude: c }
  })

  const sunSign = planets.find(p => p.name === 'Sun')?.sign || 'Unknown'
  const moonSign = planets.find(p => p.name === 'Moon')?.sign || 'Unknown'
  const risingSign = asc.sign

  return {
    planets,
    ascendant: { sign: asc.sign, degree: asc.degree, minute: asc.minute, longitude: housesResult.ascendant },
    midheaven: { sign: mc.sign, degree: mc.degree, minute: mc.minute, longitude: housesResult.mc },
    houses,
    sunSign,
    moonSign,
    risingSign,
  }
}
