export type ScoreBreakdown = {
    eagles: number
    birdies: number
    pars: number
    bogeys: number
    double_bogeys: number
    others: number
}

export function getScoreBreakdown(player: {
    PlayerResults?: Array<{ Diff: number }>
}): ScoreBreakdown {
    let eagles = 0,
        birdies = 0,
        pars = 0,
        bogeys = 0,
        double_bogeys = 0,
        others = 0

    for (const hole of player.PlayerResults || []) {
        const diff = hole.Diff
        if (diff <= -2) eagles++
        else if (diff === -1) birdies++
        else if (diff === 0) pars++
        else if (diff === 1) bogeys++
        else if (diff === 2) double_bogeys++
        else if (diff >= 3) others++
    }

    return { eagles, birdies, pars, bogeys, double_bogeys, others }
}
