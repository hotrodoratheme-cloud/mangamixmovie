import { describe, expect, it } from 'vitest'
import {
  detectAudioType,
  buildAudioOptions,
  hasMultipleAudioVersions,
  defaultAudioServerIndex,
} from './movieAudio.js'

describe('movieAudio', () => {
  it('nhận diện loại audio từ server_name', () => {
    expect(detectAudioType('Vietsub')).toBe('vietsub')
    expect(detectAudioType('Thuyết Minh')).toBe('thuyet-minh')
    expect(detectAudioType('Lồng Tiếng')).toBe('long-tieng')
  })

  it('phát hiện nhiều phiên bản audio', () => {
    const servers = [{ server_name: 'Vietsub' }, { server_name: 'Thuyết Minh' }]
    expect(hasMultipleAudioVersions(servers)).toBe(true)
    expect(buildAudioOptions(servers).map((o) => o.label)).toEqual(['Vietsub', 'Thuyết minh'])
  })

  it('ưu tiên Vietsub làm mặc định', () => {
    const servers = [{ server_name: 'Thuyết Minh' }, { server_name: 'Vietsub' }]
    expect(defaultAudioServerIndex(servers)).toBe(1)
  })
})
