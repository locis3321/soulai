declare module 'lunar-javascript' {
  export class Solar {
    static fromYmd(year: number, month: number, day: number): Solar
    static fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): Solar
    static fromDate(date: Date): Solar
    static fromJulianDay(julianDay: number): Solar
    static fromBaZi(yearGanZhi: string, monthGanZhi: string, dayGanZhi: string, timeGanZhi: string, sect?: number, baseYear?: number): Solar[]
    getYear(): number
    getMonth(): number
    getDay(): number
    getHour(): number
    getMinute(): number
    getSecond(): number
    getWeek(): number
    getWeekInChinese(): string
    getLunar(): Lunar
    getJulianDay(): number
    getXingZuo(): string
    getXingzuo(): string
    getFestivals(): string[]
    getOtherFestivals(): string[]
    isLeapYear(): boolean
    next(days: number): Solar
    nextDay(days: number): Solar
    nextHour(hours: number): Solar
    nextYear(years: number): Solar
    nextMonth(months: number): Solar
    toYmd(): string
    toYmdHms(): string
    toString(): string
    toFullString(): string
  }

  export class Lunar {
    static fromYmd(year: number, month: number, day: number): Lunar
    static fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): Lunar
    static fromSolar(solar: Solar): Lunar
    static fromDate(date: Date): Lunar
    getYear(): number
    getMonth(): number
    getDay(): number
    getHour(): number
    getYearInChinese(): string
    getMonthInChinese(): string
    getDayInChinese(): string
    getSolar(): Solar
    getEightChar(): EightChar
    getBaZi(): string[]
    getBaZiWuXing(): string[]
    getBaZiNaYin(): string[]
    getYearInGanZhi(): string
    getMonthInGanZhi(): string
    getDayInGanZhi(): string
    getTimeInGanZhi(): string
    getYearShengXiao(): string
    getYearNaYin(): string
    getMonthNaYin(): string
    getDayNaYin(): string
    getTimeNaYin(): string
    getFestivals(): string[]
    getJieQi(): string
    toString(): string
    toFullString(): string
  }

  export class EightChar {
    static fromLunar(lunar: Lunar): EightChar
    setSect(sect: number): void
    getSect(): number
    getYear(): string
    getMonth(): string
    getDay(): string
    getTime(): string
    getYearGan(): string
    getYearZhi(): string
    getMonthGan(): string
    getMonthZhi(): string
    getDayGan(): string
    getDayZhi(): string
    getTimeGan(): string
    getTimeZhi(): string
    getYearHideGan(): string[]
    getMonthHideGan(): string[]
    getDayHideGan(): string[]
    getTimeHideGan(): string[]
    getYearWuXing(): string
    getMonthWuXing(): string
    getDayWuXing(): string
    getTimeWuXing(): string
    getYearNaYin(): string
    getMonthNaYin(): string
    getDayNaYin(): string
    getTimeNaYin(): string
    getYearShiShenGan(): string
    getMonthShiShenGan(): string
    getDayShiShenGan(): string
    getTimeShiShenGan(): string
    getYearShiShenZhi(): string[]
    getMonthShiShenZhi(): string[]
    getDayShiShenZhi(): string[]
    getTimeShiShenZhi(): string[]
    getYearDiShi(): string
    getMonthDiShi(): string
    getDayDiShi(): string
    getTimeDiShi(): string
    getTaiYuan(): string
    getTaiYuanNaYin(): string
    getTaiXi(): string
    getTaiXiNaYin(): string
    getMingGong(): string
    getMingGongNaYin(): string
    getShenGong(): string
    getShenGongNaYin(): string
    getYun(gender: number, sect?: number): Yun
    toString(): string
  }

  export class Yun {
    getGender(): number
    getStartYear(): number
    getStartMonth(): number
    getStartDay(): number
    getStartHour(): number
    isForward(): boolean
    getLunar(): Lunar
    getStartSolar(): Solar
    getDaYun(n?: number): DaYun[]
  }

  export class DaYun {
    getStartYear(): number
    getEndYear(): number
    getStartAge(): number
    getEndAge(): number
    getIndex(): number
    getGanZhi(): string
    getXun(): string
    getXunKong(): string
    getLiuNian(n?: number): LiuNian[]
    getXiaoYun(n?: number): XiaoYun[]
  }

  export class LiuNian {
    getYear(): number
    getAge(): number
    getIndex(): number
    getGanZhi(): string
    getXun(): string
    getXunKong(): string
    getLiuYue(): LiuYue[]
  }

  export class LiuYue {
    getIndex(): number
    getMonthInChinese(): string
    getGanZhi(): string
    getXun(): string
    getXunKong(): string
  }

  export class XiaoYun {
    getYear(): number
    getAge(): number
    getIndex(): number
    getGanZhi(): string
    getXun(): string
    getXunKong(): string
  }

  export class LunarTime {
    static fromYmdHms(lunarYear: number, lunarMonth: number, lunarDay: number, hour: number, minute: number, second: number): LunarTime
    getGan(): string
    getZhi(): string
    getGanZhi(): string
    getShengXiao(): string
    getNaYin(): string
    toString(): string
  }

  export class SolarUtil {
    static getDaysOfMonth(year: number, month: number): number
    static getDaysInYear(year: number): number
    static isLeapYear(year: number): boolean
  }

  export class LunarUtil {
    static GAN: string[]
    static ZHI: string[]
    static SHENGXIAO: string[]
    static NAYIN: Record<string, string>
    static WU_XING_GAN: Record<string, string>
    static WU_XING_ZHI: Record<string, string>
    static SHI_SHEN: Record<string, string>
    static ZHI_HIDE_GAN: Record<string, string[]>
    static JIA_ZI: string[]
  }
}
