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

export type BillPaymentChoice = {
    paymentKey: string
    description: string
}

type BillLookupErrorData = {
    choices?: BillPaymentChoice[]
}

function isBillLookupErrorData(data: unknown): data is BillLookupErrorData {
    return typeof data === 'object' && data !== null && (!('choices' in data) || Array.isArray((data as {choices?: unknown}).choices))
}

async function lookupBill(iban: string, payerName: string, paymentKey?: string): Promise<BillData> {
    const res = await authedFetch(`${API_BASE}/bill/lookup`, {
        method: 'POST',
        body: JSON.stringify({iban, payerName, paymentKey}),
    })

    const json = (await res.json()) as {
        success: boolean
        data?: BillData | BillLookupErrorData
        error?: string
        code?: string
    }

    if (!res.ok || !json.success) {
        const err = new Error(json.error ?? 'Request failed') as Error & {
            code?: string
            choices?: BillPaymentChoice[]
        }
        err.code = json.code ?? 'bill_lookup_failed'
        if (json.code === 'bill_multiple_payments' && isBillLookupErrorData(json.data)) {
            err.choices = Array.isArray(json.data.choices) ? json.data.choices : []
        }
        throw err
    }

    return json.data as BillData
}

export default function useBillApi() {
    return {lookupBill}
}
