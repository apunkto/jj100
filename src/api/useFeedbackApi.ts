// src/api/useFeedbackApi.ts

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL
if (!API_BASE) {
    throw new Error('Missing NEXT_PUBLIC_API_BASE_URL')
}

type FeedbackPayload = {
    score: number
    feedback: string
}

const submitFeedback = async (data: FeedbackPayload): Promise<void> => {
    const res = await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })

    if (!res.ok) {
        const errorResponse = await res.json() as { error?: string }
        throw new Error(errorResponse.error || 'Feedback submission failed')
    }
}


export default function useFeedbackApi() {
    return {
        submitFeedback,
    }
}
