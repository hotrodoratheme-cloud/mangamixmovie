import { describe, expect, it } from 'vitest'
import {
  detectAudioType,
  buildAudioOptions,
  hasMultipleAudioVersions,
  defaultAudioServerIndex,
  findEpisodeBySlug,
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

  it('tìm tập theo slug khi đổi server audio', () => {
    const servers = [
      {
        server_name: 'Vietsub',
        server_data: [{ slug: 'tap-01', link_m3u8: 'https://example.com/vs.m3u8' }],
      },
      {
        server_name: 'Thuyết Minh',
        server_data: [{ slug: 'tap-01', link_m3u8: 'https://example.com/tm.m3u8' }],
      },
    ]

    const matched = findEpisodeBySlug(servers, 1, 'tap-01')
    expect(matched?.link_m3u8).toBe('https://example.com/tm.m3u8')
  })
})
