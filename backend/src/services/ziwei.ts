import { astro, util } from 'iztro'

export interface ZiWeiPalace {
  name: string
  isBodyPalace: boolean
  heavenlyStem: string
  earthlyBranch: string
  majorStars: Array<{ name: string; brightness?: string; mutagen?: string }>
  minorStars: Array<{ name: string }>
  adjectiveStars: Array<{ name: string }>
}

export interface ZiWeiResult {
  solarDate: string
  lunarDate: string
  chineseDate: string
  time: string
  sign: string
  zodiac: string
  soulStar: string
  bodyStar: string
  fiveElementsClass: string
  palaces: ZiWeiPalace[]
  soulPalace: string
  bodyPalace: string
}

export interface ZiWeiInput {
  birthDate: string
  birthTime?: string
  gender?: 'male' | 'female'
}

function timeToTimeIndex(birthTime?: string): number {
  if (!birthTime) return 6
  const hour = parseInt(birthTime.split(':')[0], 10)
  return util.timeToIndex(hour)
}

export function calculateZiWei(input: BirthInput): ZiWeiResult {
  const date = new Date(input.birthDate)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  const solarDateStr = `${year}-${month}-${day}`
  const timeIndex = timeToTimeIndex(input.birthTime)
  const gender = input.gender || 'male'

  const chart = astro.bySolar(solarDateStr, timeIndex, gender, true, 'en-US')

  const palaces: ZiWeiPalace[] = chart.palaces.map((p: any) => ({
    name: p.name,
    isBodyPalace: p.isBodyPalace,
    heavenlyStem: p.heavenlyStem,
    earthlyBranch: p.earthlyBranch,
    majorStars: (p.majorStars || []).map((s: any) => ({
      name: s.name,
      brightness: s.brightness || undefined,
      mutagen: s.mutagen || undefined,
    })),
    minorStars: (p.minorStars || []).map((s: any) => ({ name: s.name })),
    adjectiveStars: (p.adjectiveStars || []).map((s: any) => ({ name: s.name })),
  }))

  const soulPalace = chart.palaces.find((p: any) =>
    p.majorStars?.some((s: any) => s.name === chart.soul)
  )
  const bodyPalace = chart.palaces.find((p: any) => p.isBodyPalace)

  return {
    solarDate: chart.solarDate,
    lunarDate: chart.lunarDate,
    chineseDate: chart.chineseDate,
    time: chart.time,
    sign: chart.sign,
    zodiac: chart.zodiac,
    soulStar: chart.soul,
    bodyStar: chart.body,
    fiveElementsClass: chart.fiveElementsClass,
    palaces,
    soulPalace: soulPalace?.name || 'Unknown',
    bodyPalace: bodyPalace?.name || 'Unknown',
  }
}

interface BirthInput {
  birthDate: string
  birthTime?: string
  gender?: 'male' | 'female'
}
