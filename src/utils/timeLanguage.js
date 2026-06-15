// ── Dictionaries ──────────────────────────────────────────────────────────────

export const weekDayNames = {
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  de: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'],
  es: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
}

export const weekLabelText = {
  en: 'WEEKDAY',
  de: 'WOCHENTAG',
  es: 'DÍA',
}

export const uiTranslations = {
  de: {
    practice: 'Modus: Übungsmodus',
    live: 'Modus: Live-Uhr',
    voiceLabel: 'Stimme auswählen',
    liveBtn: 'Live Clock',
    practiceBtn: 'Practice Mode',
  },
  en: {
    practice: 'Mode: Practice Mode',
    live: 'Mode: Live Clock',
    voiceLabel: 'Select Voice',
    liveBtn: 'Live Clock',
    practiceBtn: 'Practice Mode',
  },
  es: {
    practice: 'Modo: Modo de Práctica',
    live: 'Modo: Reloj en Vivo',
    voiceLabel: 'Seleccionar Voz',
    liveBtn: 'Reloj en Vivo',
    practiceBtn: 'Modo Práctica',
  },
}

export const dialWordsMapping = {
  de: ['', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf'],
  en: ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'],
  es: ['', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce'],
}

export const sectionsLabelMapping = {
  de: {
    official12: 'Offiziell (12-Stunden-Format)',
    official24: 'Offiziell (24-Stunden-Format)',
    informal: 'Umgangssprachlich / Informell',
  },
  en: {
    official12: 'Official (12-Hour Clock)',
    official24: 'Official (24-Hour Clock)',
    informal: 'Informal / Conversational',
  },
  es: {
    official12: 'Oficial (Reloj de 12 Horas)',
    official24: 'Oficial (Reloj de 24 Horas)',
    informal: 'Coloquial / Informal',
  },
}

// ── German number spellers ─────────────────────────────────────────────────────

function germanHour(h) {
  const arr = [
    'null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht',
    'neun', 'zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn',
    'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn', 'zwanzig',
    'einundzwanzig', 'zweiundzwanzig', 'dreiundzwanzig',
  ]
  return arr[h] ?? h
}

function germanMinuteSpelled(m) {
  if (m === 0) return 'null'
  const ones = ['', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun']
  const teens = ['zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn']
  const tens = ['', '', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig']
  if (m < 10) return ones[m]
  if (m < 20) return teens[m - 10]
  return m % 10 === 0
    ? tens[Math.floor(m / 10)]
    : (m % 10 === 1 ? 'ein' : ones[m % 10]) + 'und' + tens[Math.floor(m / 10)]
}

// ── English number spellers ────────────────────────────────────────────────────

function englishHour(h) {
  const arr = [
    'twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
    'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
    'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
    'twenty-one', 'twenty-two', 'twenty-three',
  ]
  return arr[h] ?? h
}

function englishMinuteSpelled(m) {
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
  const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty']
  if (m < 10) return ones[m]
  if (m < 20) return teens[m - 10]
  return m % 10 === 0 ? tens[Math.floor(m / 10)] : tens[Math.floor(m / 10)] + '-' + ones[m % 10]
}

// ── Spanish number spellers ────────────────────────────────────────────────────

function spanishHour(h, isInformal = false) {
  if (isInformal) {
    const target = h % 12 || 12
    return target === 1 ? 'una' : ['', '', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce'][target]
  }
  const arr = [
    'cero', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho',
    'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis',
    'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés',
  ]
  return arr[h] ?? h
}

function spanishMinuteSpelled(m) {
  const ones = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve']
  const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve']
  const tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta']
  if (m < 10) return ones[m]
  if (m < 20) return teens[m - 10]
  if (m < 30) return m === 20 ? 'veinte' : 'veinti' + ones[m % 10]
  return m % 10 === 0 ? tens[Math.floor(m / 10)] : tens[Math.floor(m / 10)] + ' y ' + ones[m % 10]
}

// ── Master phrase builder ──────────────────────────────────────────────────────

/**
 * @param {string} language - 'de' | 'en' | 'es'
 * @param {number} h - hour (0–23)
 * @param {number} m - minute (0–59)
 * @returns {{ official12: string, official24: string, informal: string[] }}
 */
export function buildMultilingualTime(language, h, m) {
  const h12 = h % 12 || 12
  const nextH12 = (h12 % 12) + 1
  const categories = { official12: '', official24: '', informal: [] }

  if (language === 'de') {
    categories.official12 = `${germanHour(h12)} Uhr ${m === 0 ? '' : germanMinuteSpelled(m)}`.trim()
    categories.official24 = `${germanHour(h)} Uhr ${m === 0 ? '' : germanMinuteSpelled(m)}`.trim()
    if (m === 0)       categories.informal.push(`${germanHour(h12)} Uhr`)
    else if (m === 15) categories.informal.push(`Viertel nach ${germanHour(h12)}`)
    else if (m === 45) categories.informal.push(`Viertel vor ${germanHour(nextH12)}`)
    else if (m === 30) categories.informal.push(`halb ${germanHour(nextH12)}`)
    else if (m < 30)   categories.informal.push(`${m === 20 ? 'zwanzig' : m === 10 ? 'zehn' : germanMinuteSpelled(m)} nach ${germanHour(h12)}`)
    else               categories.informal.push(`${60 - m === 20 ? 'zwanzig' : 60 - m === 10 ? 'zehn' : germanMinuteSpelled(60 - m)} vor ${germanHour(nextH12)}`)

  } else if (language === 'en') {
    const minWord = m < 10 ? 'zero ' + englishMinuteSpelled(m) : englishMinuteSpelled(m)
    categories.official12 = `${englishHour(h12)} ${m === 0 ? "o'clock" : minWord}`.trim()
    categories.official24 = `${englishHour(h)} ${m === 0 ? 'hundred' : minWord}`.trim()
    if (m === 0)       categories.informal.push(`${englishHour(h12)} o'clock`)
    else if (m === 15) categories.informal.push(`quarter past ${englishHour(h12)}`)
    else if (m === 30) categories.informal.push(`half past ${englishHour(h12)}`)
    else if (m === 45) categories.informal.push(`quarter to ${englishHour(nextH12)}`)
    else if (m < 30)   categories.informal.push(`${englishMinuteSpelled(m)} past ${englishHour(h12)}`)
    else               categories.informal.push(`${englishMinuteSpelled(60 - m)} to ${englishHour(nextH12)}`)

  } else if (language === 'es') {
    const prefix12 = h12 === 1 ? 'Es la' : 'Son las'
    const prefix24 = h === 1 ? 'Es la' : 'Son las'
    categories.official12 = `${prefix12} ${spanishHour(h12)} ${m === 0 ? '' : 'y ' + spanishMinuteSpelled(m)}`.trim()
    categories.official24 = `${prefix24} ${spanishHour(h)} ${m === 0 ? '' : 'y ' + spanishMinuteSpelled(m)}`.trim()
    const pfxCur = h12 === 1 ? 'Es la' : 'Son las'
    const pfxNxt = nextH12 === 1 ? 'Es la' : 'Son las'
    if (m === 0)       categories.informal.push(`${pfxCur} ${spanishHour(h12, true)} en punto`)
    else if (m === 15) categories.informal.push(`${pfxCur} ${spanishHour(h12, true)} y cuarto`)
    else if (m === 30) categories.informal.push(`${pfxCur} ${spanishHour(h12, true)} y media`)
    else if (m === 45) categories.informal.push(`${pfxNxt} ${spanishHour(nextH12, true)} menos cuarto`)
    else if (m < 30)   categories.informal.push(`${pfxCur} ${spanishHour(h12, true)} y ${spanishMinuteSpelled(m)}`)
    else               categories.informal.push(`${pfxNxt} ${spanishHour(nextH12, true)} menos ${spanishMinuteSpelled(60 - m)}`)
  }

  return categories
}
