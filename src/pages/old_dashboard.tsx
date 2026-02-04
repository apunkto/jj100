import {useCallback, useEffect, useRef, useState} from 'react'
import {Swiper, SwiperSlide} from 'swiper/react'
import {Autoplay} from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/autoplay'
import {Box, Typography} from '@mui/material'
import Image from 'next/image'
import useCtpApi, {Hole, HoleWithCtp} from '@/src/api/useCtpApi'

// Metrix types
type HoleResultAPI = {
    Diff: number
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
    {key: 'birdies', color: 'rgba(62,195,0,.34)', label: 'Birdie'},
    {key: 'pars', color: '#ECECECFF', label: 'Par'},
    {key: 'bogeys', color: 'rgba(244,43,3,.12)', label: 'Bogey'},
    {key: 'double_bogeys', color: 'rgba(244,43,3,.26)', label: 'Double'},
    {key: 'others', color: 'rgba(244,43,3,.42)', label: 'Triple+'},
]

export default function TopHolesDashboard() {
    const {getTopRankedHoles} = useCtpApi()
    const [holeInfo, setHoleInfo] = useState<Record<number, HoleWithCtp>>({})
    const [topHoles, setTopHoles] = useState<number[]>([])
    const [playerCount, setPlayerCount] = useState<number>(0)
    const [topPlayersByDivision, setTopPlayersByDivision] = useState<Record<string, PlayerResult[]>>({})
    const [mostHolesLeft, setMostHolesLeft] = useState<number>(0)
    const [finishedPlayersCount, setFinishedPlayersCount] = useState<number>(0)
    const [totalThrows, setTotalThrows] = useState<number>(0)
    const [averageDiff, setAverageDiff] = useState<number>(0)
    const swiperRef = useRef<any>(null)

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
            others = 0

        for (const hole of player.PlayerResults || []) {
            const diff = hole.Diff
            if (diff <= -2) eagles++
            else if (diff === -1) birdies++
            else if (diff === 0) pars++
            else if (diff === 1) bogeys++
            else if (diff === 2) doubleBogeys++
            else if (diff >= 3) others++
        }
        return {eagles, birdies, pars, bogeys, doubleBogeys, others}
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
            const holeMap: Record<number, HoleWithCtp> = {}
            topHolesData.forEach(h => {
                holeMap[h.hole.number] = h
            })
            setHoleInfo(holeMap)
            setTopHoles(topHolesData.map(h => h.hole.number))

            const res = await fetch('https://discgolfmetrix.com/api.php?content=result&id=3204902')
            const metrixData = (await res.json()) as MetrixAPIResponse
            const players = metrixData.Competition.Results
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

                grouped[division] = grouped[division].slice(0, 4)
            })

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

    const renderScoreBar = (hole: Hole) => {
        const total = scoreCategories.reduce(
            (sum, cat) => sum + Number(hole[cat.key as keyof typeof hole] || 0),
            0
        )
        if (total === 0) return null

        return (
            <Box mt={2}>
                <Box display="flex" height={14} borderRadius={2} overflow="hidden" width="100%">
                    {scoreCategories.map(({key, color}) => {
                        const value = hole[key as keyof typeof hole] || 0
                        const percent = (Number(value) / total) * 100
                        return (
                            <Box
                                key={key}
                                sx={{
                                    width: `${percent}%`,
                                    backgroundColor: color,
                                    display: percent > 0 ? 'block' : 'none',
                                    minWidth: '2px',
                                    height: '100%',
                                }}
                            />
                        )
                    })}
                </Box>

                <Box mt={1.5} display="flex" flexWrap="wrap" justifyContent="center" gap={1}>
                    {scoreCategories.map(({key, color, label}) => {
                        const value = hole[key as keyof typeof hole] || 0
                        if (!value) return null
                        return (
                            <Box
                                key={key}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: '20px',
                                    backgroundColor: color,
                                    color: '#000',
                                    fontWeight: 500,
                                    fontSize: '14px',
                                }}
                            >
                                {label}: {value}
                            </Box>
                        )
                    })}
                </Box>
            </Box>
        )
    }

    useEffect(() => {
        fetchTopHoles()
        const interval = setInterval(fetchTopHoles, 5 * 60 * 1000)
        return () => clearInterval(interval)
    }, [fetchTopHoles])

    return (
        <Box sx={{display: 'flex', gap: 10, p: 4}}>
            {/* First panel */}

            <Box sx={{maxWidth: 600, flexShrink: 0}}>
                <Typography variant="h4" textAlign="left" mb={4} fontWeight="bold">
                    Top 10 raskemad rajad
                </Typography>
                <Swiper
                    onSwiper={(swiper) => {
                        swiperRef.current = swiper
                        swiper.autoplay?.start()
                    }}
                    key={topHoles.join(',')}
                    modules={[Autoplay]}
                    autoplay={{
                        delay: 15000,
                        disableOnInteraction: false,
                    }}
                    loop
                    spaceBetween={30}
                    slidesPerView={1}
                >
                    {topHoles.map(holeNumber => {
                        const holeData = holeInfo[holeNumber]?.hole
                        if (!holeData) return null
                        return (
                            <SwiperSlide key={holeNumber}>
                                <Box sx={{position: 'relative', borderRadius: '15px', overflow: 'hidden'}}>
                                    <Box sx={{
                                        position: 'absolute',
                                        zIndex: 2,
                                        right: '17%',
                                        top: '10%',
                                        transform: 'translateY(-50%)'
                                    }}>
                                        <Typography
                                            variant="h4"
                                            fontWeight="bold"
                                            sx={{
                                                fontSize: 'clamp(24px, 1.2vw, 42px)',
                                                color: 'black',
                                                fontFamily: 'Alatsi, sans-serif'
                                            }}
                                        >
                                            {holeData.length}m
                                        </Typography>
                                    </Box>
                                    <Box sx={{display: 'flex', justifyContent: 'center', my: 2}}>
                                        <Image
                                            src={`/cards/${holeNumber}.webp?v=4`}
                                            alt={`Rada ${holeNumber}`}
                                            layout="intrinsic"
                                            width={450}
                                            height={630}
                                            style={{borderRadius: '10px'}}
                                            sizes="(max-width: 600px) 100vw, 450px"
                                        />
                                    </Box>
                                </Box>

                                <Box mt={3} display="flex" justifyContent="space-between" gap={4} alignItems="start">
                                    <Typography fontSize={20}>
                                        Raskuselt <strong>{holeData.rank}</strong>. rada (
                                        {holeData.average_diff !== undefined
                                            ? `${holeData.average_diff > 0 ? '+' : ''}${holeData.average_diff.toFixed(1)} viset par-ile`
                                            : ''}
                                        )
                                    </Typography>
                                    <Typography fontSize={20} sx={{borderTop: '3px solid #f42b03', pt: 0.5}}>
                                        {holeData.ob_percent !== undefined ? `${Math.round(holeData.ob_percent)}% viskas OB` : ''}
                                    </Typography>
                                </Box>
                                {renderScoreBar(holeData)}
                            </SwiperSlide>
                        )
                    })}
                </Swiper>
            </Box>

            {/* Second panel */}
            <Box sx={{flex: 1, maxWidth: 400, minWidth: 400}}>
                {Object.entries(topPlayersByDivision).map(([division, players]) => (
                    <Box key={division} mb={3}>
                        <Typography variant="h6" fontWeight="bold" mb={1}>
                            {division}
                        </Typography>
                        {players.map((player, index) => {
                            const breakdown = getScoreBreakdown(player)
                            return (
                                <Box key={player.UserID} mb={1}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography>{index + 1}. {player.Name}</Typography>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Box sx={{width: 40, textAlign: 'right'}}>
                                                <Typography fontWeight="bold">
                                                    {Number(player.Diff) > 0 ? `+${player.Diff}` : player.Diff}
                                                </Typography>
                                            </Box>
                                            <Box display="flex" gap={0.5} flexWrap="wrap" width={140}>
                                                {scoreCategories.map(({key, color}) => {
                                                    const count = breakdown[key as keyof typeof breakdown]

                                                    if (!count) return null
                                                    return (
                                                        <Box
                                                            key={key}
                                                            sx={{
                                                                width: 20,
                                                                height: 20,
                                                                borderRadius: '50%',
                                                                backgroundColor: color,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '12px',
                                                                fontWeight: 500,
                                                                color: '#000',
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
                ))}
            </Box>

            {/* Third panel */}
            <Box mt={0} textAlign="center">
                <Box display="flex" flexDirection="column" alignItems="center" gap={4}>
                    <Image
                        src="/white_logo.webp"
                        alt="Logo"
                        width={300}
                        height={255}
                        priority
                        style={{ maxWidth: '100%', height: 'auto' }}
                    />
                    {/* Most holes left */}
                    <Box>
                        <Typography variant="h6" fontWeight="bold">
                            🕒 Viimasel puulil jäänud mängida
                        </Typography>
                        <Box
                            mt={2}
                            sx={{
                                width: 100,
                                height: 100,
                                borderRadius: '50%',
                                backgroundColor: '#f8c600',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '32px',
                                fontWeight: 'bold',
                                color: '#000',
                                margin: '0 auto',
                            }}
                        >
                            {mostHolesLeft}
                        </Box>
                        <Typography variant="body2" mt={0}>
                            korvi 100st
                        </Typography>
                    </Box>

                    {/* Finished players */}
                    <Box>
                        <Typography variant="h6" fontWeight="bold">
                            🏁 Lõpetanud mängijaid
                        </Typography>
                        <Box
                            mt={2}
                            sx={{
                                width: 100,
                                height: 100,
                                borderRadius: '50%',
                                backgroundColor: '#a6e4a3',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '32px',
                                fontWeight: 'bold',
                                color: '#000',
                                margin: '0 auto',
                            }}
                        >
                            {finishedPlayersCount}
                        </Box>
                        <Typography variant="body2" mt={0}>
                            mängijat {playerCount}st
                        </Typography>
                    </Box>

                    {/* Total throws */}
                    <Box>
                        <Typography variant="h6" fontWeight="bold">
                            📊 Viskeid kokku
                        </Typography>
                        <Box
                            mt={2}
                            sx={{
                                width: 100,
                                height: 100,
                                borderRadius: '50%',
                                backgroundColor: '#b3d4fc',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '28px',
                                fontWeight: 'bold',
                                color: '#000',
                                margin: '0 auto',
                            }}
                        >
                            {totalThrows}
                        </Box>
                        <Typography variant="body2" mt={0}>
                            keskmiselt {(() => {
                            const diff = Math.round(averageDiff);
                            return diff === 0 ? '0' : `${diff > 0 ? '+' : ''}${diff}`;
                        })()} viset par-ile
                        </Typography>

                    </Box>
                </Box>
            </Box>
        </Box>
    )
}
