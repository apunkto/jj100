import type {LedScreenState} from '@/src/api/useLedScreenApi'

/**
 * Path (and query) for the board shown on the LED iframe. Same-origin relative paths.
 */
export function buildLedDisplayPath(state: LedScreenState, competitionId: number, darkMode: boolean): string {
    const q = new URLSearchParams()
    if (!darkMode) q.set('darkMode', 'false')

    const tail = q.toString()

    switch (state.board) {
        case 'main': {
            q.set('competitionId', String(competitionId))
            return `/dashboard/?${q.toString()}`
        }
        case 'leaderboard': {
            q.set('competitionId', String(competitionId))
            if (state.leaderboardPanel === 'prediction') {
                q.set('prediction', '1')
            } else if (state.leaderboardDivision) {
                q.set('division', state.leaderboardDivision)
            }
            return `/leaderboard/?${q.toString()}`
        }
        case 'draw':
            return tail ? `/admin/draw-dashboard/?${tail}` : '/admin/draw-dashboard/'
        case 'finalDraw':
            return tail ? `/admin/final-game-draw-dashboard/?${tail}` : '/admin/final-game-draw-dashboard/'
        case 'finalPutting':
            return tail ? `/admin/final-game-putting-dashboard/?${tail}` : '/admin/final-game-putting-dashboard/'
    }
}
