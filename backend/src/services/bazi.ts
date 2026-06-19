import { Solar, EightChar } from 'lunar-javascript'

export interface BaZiPillar {
  ganZhi: string
  heavenlyStem: string
  earthlyBranch: string
  hiddenStems: string[]
  wuXing: string
  naYin: string
  shiShen: string
  shiShenZhi: string[]
  diShi: string
}

export interface BaZiResult {
  yearPillar: BaZiPillar
  monthPillar: BaZiPillar
  dayPillar: BaZiPillar
  hourPillar: BaZiPillar
  taiYuan: string
  taiYuanNaYin: string
  taiXi: string
  taiXiNaYin: string
  mingGong: string
  mingGongNaYin: string
  shenGong: string
  shenGongNaYin: string
  lunarDate: string
  solarDate: string
  zodiac: string
  dayMaster: string
  daYun: Array<{
    startYear: number
    endYear: number
    startAge: number
    endAge: number
    ganZhi: string
  }>
}

export interface BaZiInput {
  birthDate: string
  birthTime?: string
}

function makePillar(
  eightChar: InstanceType<typeof EightChar>,
  pillarType: 'year' | 'month' | 'day' | 'time'
): BaZiPillar {
  const getters = {
    year: {
      ganZhi: () => eightChar.getYear(),
      stem: () => eightChar.getYearGan(),
      branch: () => eightChar.getYearZhi(),
      hidden: () => eightChar.getYearHideGan(),
      wuxing: () => eightChar.getYearWuXing(),
      nayin: () => eightChar.getYearNaYin(),
      shishenGan: () => eightChar.getYearShiShenGan(),
      shishenZhi: () => eightChar.getYearShiShenZhi(),
      dishi: () => eightChar.getYearDiShi(),
    },
    month: {
      ganZhi: () => eightChar.getMonth(),
      stem: () => eightChar.getMonthGan(),
      branch: () => eightChar.getMonthZhi(),
      hidden: () => eightChar.getMonthHideGan(),
      wuxing: () => eightChar.getMonthWuXing(),
      nayin: () => eightChar.getMonthNaYin(),
      shishenGan: () => eightChar.getMonthShiShenGan(),
      shishenZhi: () => eightChar.getMonthShiShenZhi(),
      dishi: () => eightChar.getMonthDiShi(),
    },
    day: {
      ganZhi: () => eightChar.getDay(),
      stem: () => eightChar.getDayGan(),
      branch: () => eightChar.getDayZhi(),
      hidden: () => eightChar.getDayHideGan(),
      wuxing: () => eightChar.getDayWuXing(),
      nayin: () => eightChar.getDayNaYin(),
      shishenGan: () => eightChar.getDayShiShenGan(),
      shishenZhi: () => eightChar.getDayShiShenZhi(),
      dishi: () => eightChar.getDayDiShi(),
    },
    time: {
      ganZhi: () => eightChar.getTime(),
      stem: () => eightChar.getTimeGan(),
      branch: () => eightChar.getTimeZhi(),
      hidden: () => eightChar.getTimeHideGan(),
      wuxing: () => eightChar.getTimeWuXing(),
      nayin: () => eightChar.getTimeNaYin(),
      shishenGan: () => eightChar.getTimeShiShenGan(),
      shishenZhi: () => eightChar.getTimeShiShenZhi(),
      dishi: () => eightChar.getTimeDiShi(),
    },
  }

  const g = getters[pillarType]
  return {
    ganZhi: g.ganZhi(),
    heavenlyStem: g.stem(),
    earthlyBranch: g.branch(),
    hiddenStems: g.hidden(),
    wuXing: g.wuxing(),
    naYin: g.nayin(),
    shiShen: g.shishenGan(),
    shiShenZhi: g.shishenZhi(),
    diShi: g.dishi(),
  }
}

export function calculateBaZi(input: BaZiInput): BaZiResult {
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

  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0)
  const lunar = solar.getLunar()
  const eightChar = lunar.getEightChar()

  const yearPillar = makePillar(eightChar, 'year')
  const monthPillar = makePillar(eightChar, 'month')
  const dayPillar = makePillar(eightChar, 'day')
  const hourPillar = makePillar(eightChar, 'time')

  const gender = 1
  const yun = eightChar.getYun(gender)
  const daYunList = yun.getDaYun(10)
  const daYun = daYunList
    .filter((dy: any) => dy.getIndex() > 0)
    .map((dy: any) => ({
      startYear: dy.getStartYear(),
      endYear: dy.getEndYear(),
      startAge: dy.getStartAge(),
      endAge: dy.getEndAge(),
      ganZhi: dy.getGanZhi(),
    }))

  return {
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    taiYuan: eightChar.getTaiYuan(),
    taiYuanNaYin: eightChar.getTaiYuanNaYin(),
    taiXi: eightChar.getTaiXi(),
    taiXiNaYin: eightChar.getTaiXiNaYin(),
    mingGong: eightChar.getMingGong(),
    mingGongNaYin: eightChar.getMingGongNaYin(),
    shenGong: eightChar.getShenGong(),
    shenGongNaYin: eightChar.getShenGongNaYin(),
    lunarDate: `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    solarDate: solar.toYmd(),
    zodiac: lunar.getYearShengXiao(),
    dayMaster: dayPillar.heavenlyStem,
    daYun,
  }
}
