import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  STUDY_DISCLAIMER_STORAGE_KEY,
  acknowledgeStudyDisclaimer,
  hasAcknowledgedStudyDisclaimer,
} from './studyDisclaimer.js'

describe('studyDisclaimer', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      store: {},
      getItem(key) {
        return this.store[key] || null
      },
      setItem(key, value) {
        this.store[key] = String(value)
      },
      removeItem(key) {
        delete this.store[key]
      },
    })
  })

  it('chưa xác nhận thì hiện popup', () => {
    expect(hasAcknowledgedStudyDisclaimer()).toBe(false)
  })

  it('sau khi xác nhận thì không hiện lại', () => {
    acknowledgeStudyDisclaimer()
    expect(localStorage.getItem(STUDY_DISCLAIMER_STORAGE_KEY)).toBe('1')
    expect(hasAcknowledgedStudyDisclaimer()).toBe(true)
  })

  it('không throw khi localStorage lỗi', () => {
    vi.stubGlobal('localStorage', {
      getItem() {
        throw new Error('blocked')
      },
      setItem() {
        throw new Error('blocked')
      },
    })

    expect(hasAcknowledgedStudyDisclaimer()).toBe(false)
    expect(() => acknowledgeStudyDisclaimer()).not.toThrow()
  })
})
