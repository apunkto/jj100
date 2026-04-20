import {authedFetch} from '@/src/api/authedFetch'
import {API_BASE} from '@/src/api/config'

export type BillData = {
    billNumber: string
    issueDate: string
    dueDate: string
    payerName: string
    description: string
    quantity: number
    unitPrice: string
    total: string
    issuer: {
        name: string
        address: string
        regCode: string
        phone: string
        bankName: string
        iban: string
    }
    signatory: string
}

async function lookupBill(iban: string, instructionId: string): Promise<BillData> {
    const res = await authedFetch(`${API_BASE}/bill/lookup`, {
        method: 'POST',
        body: JSON.stringify({iban, instructionId}),
    })

    const json = (await res.json()) as {success: boolean; data?: BillData; error?: string}

    if (!res.ok || !json.success) {
        throw new Error(json.error ?? 'Arve koostamine ebaõnnestus')
    }

    return json.data!
}

export default function useBillApi() {
    return {lookupBill}
}
