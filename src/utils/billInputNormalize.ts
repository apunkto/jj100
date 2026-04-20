/** Match backend `normalizeIban` / `normalizeInstructionId` for consistent client-side checks. */

export function normalizeBillIban(input: string): string {
    return input.trim().replace(/\s+/g, '').toUpperCase()
}

export function normalizeBillInstructionId(input: string): string {
    return input.trim().replace(/\s+/g, '').replace(/-/g, '')
}
