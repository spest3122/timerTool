const STORAGE_KEY = 'zeitangaben-quiz-progress-v1'

export const RESPONSE_FAST_MS = 3500
export const RESPONSE_SLOW_MS = 8500
export const HIGH_LATENCY_MS = 7000

// ── German word lists ──────────────────────────────────────────────────────────

export const germanHours = [
  'null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht',
  'neun', 'zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn',
  'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn', 'zwanzig',
  'einundzwanzig', 'zweiundzwanzig', 'dreiundzwanzig',
]

export const germanMinutes = [
  'null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht',
  'neun', 'zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn',
  'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn', 'zwanzig',
  'einundzwanzig', 'zweiundzwanzig', 'dreiundzwanzig', 'vierundzwanzig',
  'fünfundzwanzig', 'sechsundzwanzig', 'siebenundzwanzig', 'achtundzwanzig',
  'neunundzwanzig', 'dreißig', 'einunddreißig', 'zweiunddreißig',
  'dreiunddreißig', 'vierunddreißig', 'fünfunddreißig', 'sechsunddreißig',
  'siebenunddreißig', 'achtunddreißig', 'neununddreißig', 'vierzig',
  'einundvierzig', 'zweiundvierzig', 'dreiundvierzig', 'vierundvierzig',
  'fünfundvierzig', 'sechsundvierzig', 'siebenundvierzig', 'achtundvierzig',
  'neunundvierzig', 'fünfzig', 'einundfünfzig', 'zweiundfünfzig',
  'dreiundfünfzig', 'vierundfünfzig', 'fünfundfünfzig', 'sechsundfünfzig',
  'siebenundfünfzig', 'achtundfünfzig', 'neunundfünfzig',
]

// ── Phrase generators ──────────────────────────────────────────────────────────

function hourWord12(hour) { return germanHours[hour % 12 || 12] }
function nextHourWord(hour) { return germanHours[(hour % 12) + 1] }
function formalHourWord(hour) { return hour === 1 ? 'ein' : germanHours[hour] }

export function formatDigital(hour, minute) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function formal24(hour, minute) {
  return `${formalHourWord(hour)} Uhr${minute === 0 ? '' : ' ' + germanMinutes[minute]}`
}

export function colloquial(hour, minute) {
  if (minute === 0)  return `${hour % 12 === 1 ? 'ein' : hourWord12(hour)} Uhr`
  if (minute === 15) return `viertel nach ${hourWord12(hour)}`
  if (minute === 30) return `halb ${nextHourWord(hour)}`
  if (minute === 45) return `viertel vor ${nextHourWord(hour)}`
  if (minute === 25) return `fünf vor halb ${nextHourWord(hour)}`
  if (minute === 35) return `fünf nach halb ${nextHourWord(hour)}`
  if (minute === 20) return `zwanzig nach ${hourWord12(hour)}`
  if (minute === 40) return `zwanzig vor ${nextHourWord(hour)}`
  if (minute < 30)   return `${germanMinutes[minute]} nach ${hourWord12(hour)}`
  return `${germanMinutes[60 - minute]} vor ${nextHourWord(hour)}`
}

// ── Dataset ────────────────────────────────────────────────────────────────────

export function buildDataset() {
  const dataset = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute++) {
      const digital = formatDigital(hour, minute)
      dataset.push({ id: `L-${digital}`, hour, minute, digital, difficulty: 'low',  expected: formal24(hour, minute),   label: 'Formal 24h' })
      dataset.push({ id: `H-${digital}`, hour, minute, digital, difficulty: 'high', expected: colloquial(hour, minute), label: 'Colloquial' })
    }
  }
  return dataset
}

// ── Text normalization & token diff ───────────────────────────────────────────

export function normalize(text) {
  return text.trim().toLocaleLowerCase('de-DE').replace(/\s+/g, ' ')
}

/**
 * Returns an array of token objects for differential feedback rendering.
 * @returns {{ text: string, type: 'ok' | 'extra' | 'missing' }[]}
 */
export function tokenDiff(submitted, expected) {
  const subTokens = normalize(submitted).split(' ').filter(Boolean)
  const expTokens = normalize(expected).split(' ').filter(Boolean)
  const max = Math.max(subTokens.length, expTokens.length)
  const tokens = []
  for (let i = 0; i < max; i++) {
    const user = subTokens[i]
    const correct = expTokens[i]
    if (user === correct && correct) {
      tokens.push({ text: correct, type: 'ok' })
    } else {
      if (user)    tokens.push({ text: user,    type: 'extra' })
      if (correct) tokens.push({ text: correct, type: 'missing' })
    }
  }
  return tokens
}

// ── Adaptive SRS logic ─────────────────────────────────────────────────────────

export function highDifficultyRatio(session) {
  if (session.recent.length < 4) return 0.5
  const recentAccuracy = session.recent.filter(r => r.correct).length / session.recent.length
  const avgRt = session.recent.reduce((sum, r) => sum + r.rt, 0) / session.recent.length
  if (recentAccuracy >= 0.9  && avgRt <= RESPONSE_FAST_MS) return 0.82
  if (recentAccuracy >= 0.78 && avgRt <= RESPONSE_SLOW_MS) return 0.65
  if (recentAccuracy <  0.6  || avgRt >  RESPONSE_SLOW_MS) return 0.32
  return 0.5
}

export function priorityWeight(item, progress) {
  const p = progress[item.id]
  const elapsed = Date.now() - p.lastRetrievalTimestamp
  const dueRatio = p.currentRepetitionInterval === 0 ? 2 : elapsed / p.currentRepetitionInterval
  const rtPenalty = p.historicalAverageResponseTime
    ? Math.min(2.5, p.historicalAverageResponseTime / HIGH_LATENCY_MS)
    : 1
  return Math.max(0.2, dueRatio) + p.errorCount * 0.75 + rtPenalty
}

export function chooseNextQuestion(dataset, progress, session) {
  const ratio = highDifficultyRatio(session)
  const targetDifficulty = Math.random() < ratio ? 'high' : 'low'
  const pool = dataset.filter(item => item.difficulty === targetDifficulty)
  const weighted = pool.map(item => ({ item, weight: priorityWeight(item, progress) }))
  const total = weighted.reduce((sum, row) => sum + row.weight, 0)
  let pick = Math.random() * total
  for (const row of weighted) {
    pick -= row.weight
    if (pick <= 0) return row.item
  }
  return weighted[Math.floor(Math.random() * weighted.length)].item
}

// ── Progress persistence ───────────────────────────────────────────────────────

export function defaultProgress(dataset) {
  return Object.fromEntries(
    dataset.map(item => [
      item.id,
      { questionId: item.id, lastRetrievalTimestamp: 0, errorCount: 0, currentRepetitionInterval: 0, historicalAverageResponseTime: null, repetitions: 0 },
    ])
  )
}

export function loadProgress(dataset) {
  try {
    return { ...defaultProgress(dataset), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }
  } catch {
    return defaultProgress(dataset)
  }
}

export function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export function updateProgress(progress, item, correct, rt) {
  const p = { ...progress[item.id] }
  p.lastRetrievalTimestamp = Date.now()
  p.historicalAverageResponseTime = p.historicalAverageResponseTime === null
    ? rt
    : Math.round(p.historicalAverageResponseTime * 0.75 + rt * 0.25)
  if (correct) {
    p.repetitions += 1
    p.errorCount = Math.max(0, p.errorCount - 1)
    const latencyFactor = rt <= RESPONSE_FAST_MS ? 3.2 : rt <= HIGH_LATENCY_MS ? 1.8 : 0.75
    const base = p.currentRepetitionInterval || 45_000
    p.currentRepetitionInterval = Math.round(Math.max(45_000, base * latencyFactor))
  } else {
    p.errorCount += 1
    p.repetitions = 0
    p.currentRepetitionInterval = 30_000
  }
  return { ...progress, [item.id]: p }
}
