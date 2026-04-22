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

async function lookupBill(iban: string, payerName: string): Promise<BillData> {
    const res = await authedFetch(`${API_BASE}/bill/lookup`, {
        method: 'POST',
        body: JSON.stringify({iban, payerName}),
    })

    const json = (await res.json()) as {
        success: boolean
        data?: BillData
        error?: string
        code?: string
    }

    if (!res.ok || !json.success) {
        const err = new Error(json.error ?? 'Request failed') as Error & {code?: string}
        err.code = json.code ?? 'bill_lookup_failed'
        throw err
    }

    return json.data!
}

export default function useBillApi() {
    return {lookupBill}
}
