import {API_BASE} from "@/src/api/config"

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
        const errorResponse = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(errorResponse.error || 'Feedback submission failed')
    }
}

export default function useFeedbackApi() {
    return {
        submitFeedback,
    }
}
