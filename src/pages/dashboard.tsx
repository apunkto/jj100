import {useCallback, useEffect, useRef, useState} from 'react'
import {Swiper, SwiperSlide} from 'swiper/react'
import {Autoplay, Keyboard} from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/autoplay'
import {Box, Typography} from '@mui/material'
import Image from 'next/image'
import useCtpApi, {HoleResult} from '@/src/api/useCtpApi'
import {useRouter} from "next/router";


// Metrix types
type HoleResultAPI = {
    Diff: number
    Result: number
}

type PlayerResult = {
    UserID: number
    Name: string
    OrderNumber: number
    Diff: number
    ClassName: string
    Sum: number
    DNF?: boolean | null
    PlayerResults?: HoleResultAPI[]
}

type MetrixAPIResponse = {
    Competition: {
        Results: PlayerResult[]
    }
}

const scoreCategories = [
    {key: 'eagles', color: '#f8c600', label: 'Eagle'},
    {key: 'birdies', color: 'rgba(62,195,0,.70)', label: 'Birdie'},
    {key: 'pars', color: '#c6c6c6', label: 'Par'},
    {key: 'bogeys', color: 'rgba(244,43,3,.50)', label: 'Bogey'},
    {key: 'double_bogeys', color: 'rgba(244,43,3,.60)', label: 'Double'},
    {key: 'others', color: 'rgba(244,43,3,.80)', label: 'Triple+'},
]

export default function TopHolesDashboard() {
    const {getTopRankedHoles} = useCtpApi()
    const [holeInfo, setHoleInfo] = useState<Record<number, HoleResult>>({})
    const [topHoles, setTopHoles] = useState<number[]>([])
    const [playerCount, setPlayerCount] = useState<number>(0)
    const [topPlayersByDivision, setTopPlayersByDivision] = useState<Record<string, PlayerResult[]>>({})
    const [mostHolesLeft, setMostHolesLeft] = useState<number>(0)
    const [finishedPlayersCount, setFinishedPlayersCount] = useState<number>(0)
    const [totalThrows, setTotalThrows] = useState<number>(0)
    const [averageDiff, setAverageDiff] = useState<number>(0)
    const [lakeOBCount, setLakeOBCount] = useState<number>(0)
    const [lakePlayersCount, setLakePlayersCount] = useState<number>(0)
    const swiperRef = useRef<any>(null)
    const [activeSlideIndex, setActiveSlideIndex] = useState(0)
    const [currentBiggestIndex, setCurrentBiggestIndex] = useState(0)
    const [longestStreaks, setLongestStreaks] = useState<{
        count: number
        player: string
        startHole: number
        endHole: number
    }[]>([])

    const [currentStreakIndex, setCurrentStreakIndex] = useState(0)

    const [biggestScores, setBiggestScores] = useState<{
        value: number
        player: string
        holeNumber: number
        hadPenalty: boolean
    }[]>([])

    const router = useRouter()
    const isLooping = router.query.loop !== 'off'
    const isAutoplay = isLooping

    const countScoreTypes = (player: PlayerResult) => {
        let birdieOrBetter = 0,
            pars = 0,
            bogeys = 0
        for (const hole of player.PlayerResults || []) {
            const diff = hole.Diff
            if (diff <= -1) birdieOrBetter++
            else if (diff === 0) pars++
            else if (diff === 1) bogeys++
        }
        return {birdieOrBetter, pars, bogeys}
    }


    const getScoreBreakdown = (player: PlayerResult) => {
        let eagles = 0,
            birdies = 0,
            pars = 0,
            bogeys = 0,
            doubleBogeys = 0,
            tripleOrWorse = 0

        for (const hole of player.PlayerResults || []) {
            const diff = hole.Diff
            if (diff <= -2) eagles++
            else if (diff === -1) birdies++
            else if (diff === 0) pars++
            else if (diff === 1) bogeys++
            else if (diff === 2) doubleBogeys++
            else if (diff >= 3) tripleOrWorse++
        }

        return {eagles, birdies, pars, bogeys, doubleBogeys, tripleOrWorse}
    }

    const getMostRemainingHoles = (players: PlayerResult[]): number => {
        let maxLeft = 0
        let playerWithMostLeft: PlayerResult | null = null

        for (const player of players) {
            if (player.DNF) continue
            const played = player.PlayerResults?.filter(h => h.Diff !== null && h.Diff !== undefined).length ?? 0
            const remaining = 100 - played
            if (remaining > maxLeft) {
                maxLeft = remaining
                playerWithMostLeft = player
            }
        }

        if (playerWithMostLeft) {
            console.log(`Most holes left to play: ${playerWithMostLeft.Name} (${maxLeft} remaining)`)
        }

        return maxLeft
    }

    const fetchTopHoles = useCallback(async () => {
        try {
            const topHolesData = await getTopRankedHoles()
            const holeMap: Record<number, HoleResult> = {}
            topHolesData.forEach(h => {
                holeMap[h.hole.number] = h
            })
            setHoleInfo(holeMap)
            setTopHoles(topHolesData.map(h => h.hole.number))

            const res = await fetch('https://discgolfmetrix.com/api.php?content=result&id=3204902')
            const metrixData = (await res.json()) as MetrixAPIResponse
            const players = metrixData.Competition.Results
            let bestCount = 0
            let streaks: typeof longestStreaks = []

            for (const player of players) {
                if (player.DNF || !player.PlayerResults) continue

                const results = player.PlayerResults
                const holeCount = results.length

                for (let i = 0; i < holeCount; i++) {
                    let streak = 0

                    while (streak < holeCount) {
                        const index = (i + streak) % holeCount
                        const holeResult = results[index]

                        // Ensure it's a played hole (not [])
                        if (!holeResult || Array.isArray(holeResult)) break

                        const diff = holeResult.Diff
                        if (diff >= 0) break

                        streak++
                    }

                    if (streak > bestCount) {
                        bestCount = streak
                        streaks = [{
                            count: streak,
                            player: player.Name,
                            startHole: (i % holeCount) + 1,
                            endHole: ((i + streak - 1) % holeCount) + 1
                        }]
                    } else if (streak === bestCount) {
                        streaks.push({
                            count: streak,
                            player: player.Name,
                            startHole: (i % holeCount) + 1,
                            endHole: ((i + streak - 1) % holeCount) + 1
                        })
                    }

                }
            }

            setLongestStreaks(streaks)
            setCurrentStreakIndex(0)

            let maxScore = 0
            let worsts: typeof biggestScores = []

            for (const player of players) {
                if (player.DNF || !player.PlayerResults) continue

                player.PlayerResults.forEach((holeResult, i) => {
                    if (!holeResult || Array.isArray(holeResult)) return
                    const result = holeResult.Result
                    const pen = parseInt((holeResult as any).PEN || '0', 10)

                    if (result > maxScore) {
                        maxScore = result
                        worsts = [{
                            value: result,
                            player: player.Name,
                            holeNumber: i + 1,
                            hadPenalty: pen > 0
                        }]
                    } else if (result === maxScore) {
                        worsts.push({
                            value: result,
                            player: player.Name,
                            holeNumber: i + 1,
                            hadPenalty: pen > 0
                        })
                    }
                })
            }

            setBiggestScores(worsts)
            setCurrentBiggestIndex(0)


            setPlayerCount(players.length)

            const grouped: Record<string, PlayerResult[]> = {}
            for (const player of players) {
                if (player.DNF) continue
                if (!grouped[player.ClassName]) grouped[player.ClassName] = []
                grouped[player.ClassName].push(player)
            }

            Object.keys(grouped).forEach(division => {
                grouped[division].sort((a, b) => {
                    const aDiff = Number(a.Diff) || 0
                    const bDiff = Number(b.Diff) || 0
                    if (aDiff !== bDiff) return aDiff - bDiff
                    const aStats = countScoreTypes(a)
                    const bStats = countScoreTypes(b)
                    if (aStats.birdieOrBetter !== bStats.birdieOrBetter) return bStats.birdieOrBetter - aStats.birdieOrBetter
                    if (aStats.pars !== bStats.pars) return bStats.pars - aStats.pars
                    if (aStats.bogeys !== bStats.bogeys) return bStats.bogeys - aStats.bogeys
                    return 0
                })

                grouped[division] = grouped[division].slice(0, 8)
            })
            let lakePlayers = 0
            let lakeOBPlayers = 0

            for (const player of players) {
                if (player.DNF || !player.PlayerResults) continue

                const lakeHoles = player.PlayerResults.slice(6, 17)
                const playedAnyLakeHole = lakeHoles.some(h => h && !Array.isArray(h))

                if (playedAnyLakeHole) {
                    lakePlayers++

                    const hadOB = lakeHoles.some(h => {
                        const pen = parseInt((h as any)?.PEN || '0', 10)
                        return pen > 0
                    })

                    if (hadOB) lakeOBPlayers++
                }
            }

            setLakeOBCount(lakeOBPlayers)
            setLakePlayersCount(lakePlayers)


            setTopPlayersByDivision(grouped)
            setMostHolesLeft(getMostRemainingHoles(players))

            const finished = players.filter(player => {
                if (player.DNF) return true
                const holes = player.PlayerResults ?? []
                return holes.every(h => !Array.isArray(h) || h.length !== 0)
            }).length
            setFinishedPlayersCount(finished)

            const total = players.reduce((sum, player) => sum + (player.Sum || 0), 0)
            setTotalThrows(total)
            setAverageDiff(players.reduce((sum, player) => sum + (Number(player.Diff) || 0), 0) / players.length)
        } catch (err) {
            console.error('Failed to load data:', err)
        }
    }, [getTopRankedHoles])

    useEffect(() => {
        if (biggestScores.length <= 1) return

        const interval = setInterval(() => {
            setCurrentBiggestIndex((prev) => (prev + 1) % biggestScores.length)
        }, 15000)

        return () => clearInterval(interval)
    }, [biggestScores])

    useEffect(() => {
        fetchTopHoles()
        const interval = setInterval(fetchTopHoles, 5 * 60 * 1000)
        return () => clearInterval(interval)
    }, [fetchTopHoles])

    useEffect(() => {
        if (longestStreaks.length <= 1) return

        const interval = setInterval(() => {
            setCurrentStreakIndex((prev) => (prev + 1) % longestStreaks.length)
        }, 15000)

        return () => clearInterval(interval)
    }, [longestStreaks])

    useEffect(() => {
        const swiper = swiperRef.current
        if (!isAutoplay || !swiper) return
        let timeout: NodeJS.Timeout

        const slideDurations = [60000, ...Object.keys(topPlayersByDivision).map(() => 15000), 60000] // ms

        timeout = setTimeout(() => {
            if (swiper.isEnd) {
                swiper.slideToLoop(0) // go to first slide, considering looping duplicates
            } else {
                swiper.slideNext()
            }
        }, slideDurations[activeSlideIndex] || 60000)

        return () => clearTimeout(timeout)
    }, [activeSlideIndex, topPlayersByDivision])

    const renderScoreBar = (hole: HoleResult['hole']) => {
        const categoryValues = scoreCategories.map(({key, label, color}) => ({
            key,
            label,
            color,
            value: Number(hole[key as keyof typeof hole] || 0),
        }))

        const maxValue = Math.max(...categoryValues.map(c => c.value))
        if (maxValue === 0) return null

        return (
            <Box
                mt={4}
                display="flex"
                flexDirection="column"
                alignItems="stretch"
                gap={0.5}
            >
                {categoryValues.map(({key, label, color, value}) => {
                    if (!value) return null
                    const widthPercent = (value / maxValue) * 100

                    return (
                        <Box
                            key={key}
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                            width="100%"
                        >
                            {/* Left: value + label, fixed width */}
                            <Box
                                display="flex"
                                alignItems="center"
                                width={190}

                            >
                                <Typography
                                    fontWeight={700}
                                    fontSize="2.2rem"
                                    width={60}
                                    textAlign="right"
                                >
                                    {value}
                                </Typography>
                                <Typography
                                    ml={1}
                                    fontSize="2.1rem"
                                    color="#333"
                                    whiteSpace="nowrap"
                                >
                                    {label}
                                </Typography>
                            </Box>

                            {/* Right: bar container (aligned!) */}
                            <Box flexGrow={1} pl={2}>
                                <Box
                                    height={25}
                                    borderRadius={9}
                                    sx={{
                                        backgroundColor: color,
                                        width: `${widthPercent}%`,
                                        transition: 'width 0.3s ease',
                                    }}
                                />
                            </Box>
                        </Box>
                    )
                })}
            </Box>
        )
    }

    function getOrdinal(n: number): string {
        const s = ["th", "st", "nd", "rd"],
            v = n % 100
        return n + (s[(v - 20) % 10] || s[v] || s[0])
    }

    useEffect(() => {
        fetchTopHoles()
        const interval = setInterval(fetchTopHoles, 5 * 60 * 1000)
        return () => clearInterval(interval)
    }, [fetchTopHoles])
// Only the JSX return block is updated. The rest of your logic remains the same.
    return (
        <Swiper
            onSwiper={(swiper) => {
                swiperRef.current = swiper
                setActiveSlideIndex(swiper.realIndex) // set initial index on mount
            }}
            onSlideChange={(swiper) => {
                setActiveSlideIndex(swiper.realIndex)
            }}

            modules={[Autoplay, Keyboard]} // ← add Keyboard here
            keyboard={{enabled: true}}   // ← enable keyboard control
            loop={isLooping}
            spaceBetween={50}
            slidesPerView={1}
            style={{height: '100vh'}}
        >
            {/* Panel 1 - Top Holes */}
            <SwiperSlide>
                <Box sx={{px: 6, py: 4, height: '100vh', boxSizing: 'border-box'}}>

                    <Swiper
                        key={topHoles.join(',')}
                        modules={[Autoplay]}
                        autoplay={{delay: 15000, disableOnInteraction: false}}
                        loop
                        spaceBetween={30}
                        slidesPerView={1}
                    >
                        {topHoles.map(holeNumber => {
                            const holeData = holeInfo[holeNumber]?.hole
                            if (!holeData) return null
                            return (
                                <SwiperSlide key={holeNumber}>
                                    <Box display="flex" justifyContent="center" alignItems="stretch" gap={6}
                                         flexWrap="nowrap" height="100%">
                                        {/* Left: Hole Image */}
                                        <Box position="relative" height="100%" display="flex" alignItems="center">
                                            <Box sx={{
                                                position: 'absolute',
                                                zIndex: 2,
                                                right: '6%',
                                                top: '8%',
                                                transform: 'translateY(-50%)'
                                            }}>
                                                <Typography
                                                    variant="h4"
                                                    fontWeight="bold"
                                                    sx={{
                                                        fontSize: 'clamp(25px, 1.5vw, 60px)',
                                                        color: 'black',
                                                        fontFamily: 'Alatsi, sans-serif'
                                                    }}
                                                >
                                                    {holeData.length}m
                                                </Typography>
                                            </Box>
                                            <Image
                                                src={`/cards/${holeNumber}.webp?v=4`}
                                                alt={`Rada ${holeNumber}`}
                                                width={464}
                                                height={650}
                                                style={{borderRadius: '30px'}}
                                            />
                                        </Box>

                                        {/* Right: Hole Info */}
                                        <Box
                                            maxWidth={600}
                                            width={500}
                                            height={650}

                                            display="flex"
                                            flexDirection="column"
                                            justifyContent="space-between"
                                        >
                                            <Box>
                                                <Typography fontSize="clamp(1.5rem, 3vw, 3rem)" mb={2}
                                                            textAlign="right">
                                                    Difficulty: <strong>{getOrdinal(holeData.rank)}</strong>
                                                </Typography>


                                                <Typography textAlign={'right'} fontWeight={600}
                                                            fontSize="clamp(1rem, 2.3vw, 2.5rem)" mb={0} mt={2}>
                                                    {holeData.average_diff !== undefined
                                                        ? `To par: ${holeData.average_diff > 0 ? '+' : ''}${holeData.average_diff.toFixed(1)}`
                                                        : ''}
                                                </Typography>

                                                <Typography textAlign="right" fontWeight={600}
                                                            fontSize="clamp(1rem, 2.3vw, 2.5rem)" mb={2}>
                                                    {holeData.ob_percent !== undefined && (
                                                        <>
                                                            Went OB:
                                                            <Box component="span"
                                                                 sx={{color: '#f42b03', fontWeight: 'bold', ml: 1}}>
                                                                {Math.round(holeData.ob_percent)}%
                                                            </Box>{' '}

                                                        </>
                                                    )}
                                                </Typography>
                                            </Box>

                                            {renderScoreBar(holeData)}
                                        </Box>
                                    </Box>
                                </SwiperSlide>

                            )
                        })}
                    </Swiper>
                </Box>
            </SwiperSlide>

            {/* Panel 2 - One Division Per Panel with Top 10 Players (Table Layout) */}
            {Object.entries(topPlayersByDivision).map(([division, players]) => (
                <SwiperSlide key={division}>
                    <Box sx={{p: 6, height: '100vh', overflowY: 'auto'}}>
                        <Typography variant="h3" fontWeight="bold" mb={4} textAlign="center">
                            {division}
                        </Typography>
                        {players.map((player, index) => {
                            const breakdown = getScoreBreakdown(player)
                            return (
                                <Box key={player.UserID} mb={2} gap={2}>
                                    <Box display="flex" alignItems="center" justifyContent={"center"}>
                                        <Typography fontSize="clamp(1.25rem, 2.5vw, 2rem)" minWidth={450}
                                                    fontWeight="600">
                                            {index === 0 ? (
                                                <Box component="span" mr={1} fontSize="1.8rem">🔥</Box>
                                            ) : (
                                                `${index + 1}. `
                                            )}
                                            {player.Name}

                                        </Typography>
                                        <Box display="flex" alignItems="center" gap={2}>
                                            <Typography fontSize="clamp(1.5rem, 2vw, 2rem)" fontWeight="bold">
                                                {Number(player.Diff) > 0 ? `+${player.Diff}` : player.Diff}
                                            </Typography>
                                            <Box display="flex" gap={1} minWidth={400}>
                                                {scoreCategories.map(({key, color}) => {
                                                    const count = breakdown[key as keyof typeof breakdown]
                                                    if (!count) return null
                                                    return (
                                                        <Box
                                                            key={key}
                                                            sx={{
                                                                width: 60,
                                                                height: 60,
                                                                borderRadius: '50%',
                                                                backgroundColor: color,
                                                                fontSize: 'clamp(1.2rem, 1.8vw, 22rem)',
                                                                fontWeight: 600,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                            }}
                                                        >
                                                            {count}
                                                        </Box>
                                                    )
                                                })}
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            )
                        })}
                    </Box>
                </SwiperSlide>
            ))}

            {/* Panel 3 - Stats */}
            <SwiperSlide>
                <Box sx={{
                    px: 6,
                    py: 3,
                    height: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gridTemplateRows: 'repeat(2, auto)',
                            gap: 6,
                            maxWidth: '1400px',
                            width: '100%',
                        }}
                    >
                        {[
                            {
                                label: '🕒 Viimasel puulil',
                                value: mostHolesLeft,
                                sub: 'korvi 100st',
                                bg: '#f8c600',
                            },
                            {
                                label: '🏁 Lõpetanud',
                                value: finishedPlayersCount,
                                sub: `mängijat ${playerCount}st`,
                                bg: '#ffcc80',
                            },
                            {
                                label: '📊 Viskeid kokku',
                                value: totalThrows,
                                sub: `${(() => {
                                    const diff = Math.round(averageDiff)
                                    return diff === 0 ? '0' : `${diff > 0 ? '+' : ''}${diff}`
                                })()} viset par-ile`,
                                bg: '#efb4f5',
                            },
                            {
                                label: '🌊 Järve viskas',
                                value: lakeOBCount,
                                sub: `mängijat (${lakePlayersCount > 0 ? Math.round((lakeOBCount / lakePlayersCount) * 100) : 0}%)`,
                                bg: '#b3d4fc',
                            },
                            ...(longestStreaks.length > 0
                                ? [
                                    {
                                        label: '🐤 Pikim birdie jada',
                                        value: longestStreaks[currentStreakIndex]?.count,
                                        sub: `${longestStreaks[currentStreakIndex]?.player} (${String(longestStreaks[currentStreakIndex]?.startHole).padStart(2, '0')}-${String(
                                            longestStreaks[currentStreakIndex]?.endHole
                                        ).padStart(2, '0')})`,
                                        bg: '#a6e4a3',
                                    },
                                ]
                                : []),

                            ...(biggestScores.length > 0
                                ? [
                                    {
                                        label: '💥 Suurim skoor',
                                        value: biggestScores[currentBiggestIndex]?.value,
                                        sub: `${biggestScores[currentBiggestIndex]?.player} (rada ${String(
                                            biggestScores[currentBiggestIndex]?.holeNumber
                                        ).padStart(2, '0')})`,
                                        bg: '#ff9999',
                                        borderTop: biggestScores[currentBiggestIndex]?.hadPenalty ? '8px solid red' : 'none',
                                    },
                                ]
                                : []),
                        ].map((item, i) => (
                            <Box
                                key={i}
                                sx={{
                                    textAlign: 'center',
                                    opacity: 0,
                                    animation: 'fadeIn 0.5s forwards',
                                    '@keyframes fadeIn': {
                                        from: {opacity: 0},
                                        to: {opacity: 1}
                                    },
                                }}
                            >

                                <Typography variant="h4" fontWeight="bold" mb={2}>
                                    {item.label}
                                </Typography>
                                <Box
                                    sx={{
                                        width: '25vh',
                                        height: '25vh',
                                        borderRadius: '50%',
                                        backgroundColor: item.bg,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto',
                                    }}
                                >
                                    <Typography
                                        component="span"
                                        sx={{
                                            position: 'relative',
                                            fontSize: item.label.includes('Viskeid') ? 'clamp(2rem, 3.1vw, 4rem)' : 'clamp(2rem, 5vw, 64rem)',
                                            fontWeight: 'bold',
                                            color: '#000',
                                            '&::before':
                                                item.label.includes('Suurim skoor') && item.borderTop
                                                    ? {
                                                        content: '""',
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        right: 0,
                                                        height: '6px',
                                                        backgroundColor: 'red',
                                                    }
                                                    : undefined,
                                        }}
                                    >
                                        {item.value}
                                    </Typography>
                                </Box>
                                <Box mt={1} sx={{fontSize: 30, lineHeight: 1.2}}>
                                    {item.sub.replace(/\s*\(.*\)/, '')}
                                    <br/>
                                    <span style={{fontSize: 25}}>
                                     {item.sub.match(/\(.*\)/)?.[0] ?? ''}
                                    </span>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Box>
            </SwiperSlide>
        </Swiper>
    )


}
