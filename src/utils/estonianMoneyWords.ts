/** Estonian amount in words for EUR (and sent), for invoice lines like "Summa sõnades: …". */

const ONES = [
    '',
    'üks',
    'kaks',
    'kolm',
    'neli',
    'viis',
    'kuus',
    'seitse',
    'kaheksa',
    'üheksa',
]

const TEENS = [
    'kümme',
    'üksteist',
    'kaksteist',
    'kolmteist',
    'neliteist',
    'viisteist',
    'kuusteist',
    'seitsteist',
    'kaheksateist',
    'üheksateist',
]

const TENS = ['', '', 'kakskümmend', 'kolmkümmend', 'nelikümmend', 'viiskümmend', 'kuuskümmend', 'seitsekümmend', 'kaheksakümmend', 'üheksakümmend']

function under100(n: number): string {
    if (n < 0 || n >= 100) return ''
    if (n === 0) return 'null'
    if (n < 10) return ONES[n]
    if (n < 20) return TEENS[n - 10]
    const t = Math.floor(n / 10)
    const o = n % 10
    const ten = TENS[t]
    return o ? `${ten} ${ONES[o]}` : ten
}

function hundredPrefix(h: number): string {
    if (h === 1) return 'ükssada'
    const w = ONES[h]
    if (!w) return ''
    return `${w}sada`
}

function under1000(n: number): string {
    if (n < 0 || n >= 1000) return ''
    if (n < 100) return under100(n)
    const h = Math.floor(n / 100)
    const rest = n % 100
    const hp = hundredPrefix(h)
    return rest ? `${hp} ${under100(rest)}` : hp
}

function under1_000_000(n: number): string {
    if (n < 0 || n >= 1_000_000) return ''
    if (n < 1000) return under1000(n)
    const k = Math.floor(n / 1000)
    const rest = n % 1000
    const thousands =
        k === 1 ? 'tuhat' : `${under1000(k)} tuhat`.trim()
    if (!rest) return thousands
    return `${thousands} ${under1000(rest)}`
}

function euroPhrase(eurosInt: number): string {
    if (eurosInt === 1) return 'üks euro'
    if (eurosInt === 0) return 'null eurot'
    if (eurosInt >= 1_000_000) return `${eurosInt} eurot`
    const words = under1_000_000(eurosInt)
    return words ? `${words} eurot` : `${eurosInt} eurot`
}

function sentPhrase(cents: number): string {
    if (cents === 1) return 'üks sent'
    if (cents === 0) return ''
    return `${under100(cents)} senti`
}

/**
 * @param amountStr decimal string e.g. "40.00" or "40,5"
 */
export function moneyToEstonianWords(amountStr: string): string {
    const normalized = amountStr.replace(',', '.').trim()
    const num = parseFloat(normalized)
    if (Number.isNaN(num) || num < 0) return ''

    const centsTotal = Math.round(num * 100)
    const eurosInt = Math.floor(centsTotal / 100)
    const cents = centsTotal % 100

    if (cents === 0) {
        return euroPhrase(eurosInt)
    }

    const e = euroPhrase(eurosInt)
    const s = sentPhrase(cents)
    if (eurosInt === 0) return s
    return `${e} ja ${s}`
}
