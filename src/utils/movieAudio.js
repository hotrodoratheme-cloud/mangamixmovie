const AUDIO_LABELS = {
  vietsub: 'Vietsub',
  'thuyet-minh': 'Thuyết minh',
  'long-tieng': 'Lồng tiếng',
}

function normalizeServerName(serverName = '') {
  return String(serverName)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

export function detectAudioType(serverName = '') {
  const name = normalizeServerName(serverName)
  if (!name) return null

  if (/thuyet\s*minh|\btm\b/.test(name)) return 'thuyet-minh'
  if (/long\s*tieng|\blt\b/.test(name)) return 'long-tieng'
  if (/vietsub|\bvs\b|\bsub\b/.test(name)) return 'vietsub'

  return null
}

export function getAudioLabel(serverName, type = detectAudioType(serverName)) {
  if (type && AUDIO_LABELS[type]) return AUDIO_LABELS[type]
  return String(serverName || 'Server').trim() || 'Server'
}

/** Gom server theo loại audio, giữ index gốc để map episodes */
export function buildAudioOptions(servers = []) {
  return (servers || []).map((server, index) => {
    const type = detectAudioType(server.server_name)
    return {
      index,
      type: type || `custom-${index}`,
      label: getAudioLabel(server.server_name, type),
      serverName: server.server_name,
    }
  })
}

export function hasMultipleAudioVersions(servers = []) {
  const options = buildAudioOptions(servers)
  const types = new Set(options.map((opt) => opt.type))
  return types.size > 1
}

export function defaultAudioServerIndex(servers = []) {
  const options = buildAudioOptions(servers)
  const viIdx = options.findIndex((opt) => opt.type === 'vietsub')
  if (viIdx >= 0) return options[viIdx].index

  const tmIdx = options.findIndex((opt) => opt.type === 'thuyet-minh')
  if (tmIdx >= 0) return options[tmIdx].index

  return 0
}

export function findEpisodeBySlug(servers, serverIndex, slug) {
  if (!slug) return null
  const episodes = servers[serverIndex]?.server_data || []
  return episodes.find((ep) => ep.slug === slug || ep.name === slug) || null
}
