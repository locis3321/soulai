import { describe, expect, it } from 'vitest'
import { calculateBaZi } from './bazi.js'

describe('calculateBaZi', () => {
  it('uses gender when calculating daYun cycles', () => {
    const birthData = {
      birthDate: '1990-06-15',
      birthTime: '14:30',
    }

    const male = calculateBaZi({ ...birthData, gender: 'male' })
    const female = calculateBaZi({ ...birthData, gender: 'female' })

    expect(male.dayMaster).toBe(female.dayMaster)
    expect(male.daYun[0].ganZhi).not.toBe(female.daYun[0].ganZhi)
  })
})
