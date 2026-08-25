export const STUDY_DISCLAIMER_STORAGE_KEY = 'mmx_study_disclaimer_v1'
const ACK_VALUE = '1'

export function hasAcknowledgedStudyDisclaimer() {
  if (typeof localStorage === 'undefined') return false

  try {
    return localStorage.getItem(STUDY_DISCLAIMER_STORAGE_KEY) === ACK_VALUE
  } catch {
    return false
  }
}

export function acknowledgeStudyDisclaimer() {
  if (typeof localStorage === 'undefined') return

  try {
    localStorage.setItem(STUDY_DISCLAIMER_STORAGE_KEY, ACK_VALUE)
  } catch {
    // Safari private mode can throw; popup will show again next visit.
  }
}
