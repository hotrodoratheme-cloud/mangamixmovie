import { describe, expect, it } from 'vitest'
import { mapCastPeople, buildProfileUrl } from './moviePeople.js'

describe('moviePeople', () => {
  it('mapCastPeople lọc diễn viên và build ảnh', () => {
    const cast = mapCastPeople({
      profile_sizes: { w185: 'https://image.tmdb.org/t/p/w185' },
      peoples: [
        {
          tmdb_people_id: 1,
          name: 'Actor A',
          character: 'Hero',
          known_for_department: 'Acting',
          profile_path: '/a.jpg',
        },
        {
          tmdb_people_id: 2,
          name: 'Director B',
          known_for_department: 'Directing',
          profile_path: '',
        },
      ],
    })

    expect(cast).toHaveLength(1)
    expect(cast[0].name).toBe('Actor A')
    expect(cast[0].photo).toBe('https://image.tmdb.org/t/p/w185/a.jpg')
  })

  it('buildProfileUrl trả rỗng khi thiếu path', () => {
    expect(buildProfileUrl({ profile_path: '' }, {})).toBe('')
  })
})
