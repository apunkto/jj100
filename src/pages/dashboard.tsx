import {useCallback, useEffect, useRef, useState} from 'react'
import {Swiper, SwiperSlide} from 'swiper/react'
import {Autoplay} from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/autoplay'
import {Box, Typography} from '@mui/material'
import Image from 'next/image'
import useCtpApi, {HoleResult} from '@/src/api/useCtpApi'

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
    {key: 'doubleBogeys', color: 'rgba(244,43,3,.26)', label: 'Double'},
    {key: 'tripleOrWorse', color: 'rgba(244,43,3,.42)', label: 'Triple+'},
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

            const res = await fetch('https://discgolfmetrix.com/api.php?content=result&id=3204901')
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

                grouped[division] = grouped[division].slice(0, 8)
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

    const renderScoreBar = (hole: HoleResult['hole']) => {
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
                                    px: 2,
                                    py: 1,
                                    borderRadius: '20px',
                                    backgroundColor: color,
                                    color: '#000',
                                    fontWeight: 600,
                                    fontSize: '2.5rem', // ~20px
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
// Only the JSX return block is updated. The rest of your logic remains the same.
    return (
        <Swiper
            onSwiper={(swiper) => {
                swiperRef.current = swiper
                swiper.autoplay?.start()
            }}
            modules={[Autoplay]}
            autoplay={{
                delay: 120000,
                disableOnInteraction: false,
            }}
            loop
            spaceBetween={50}
            slidesPerView={1}
            style={{height: '100vh'}}
        >
            {/* Panel 1 - Top Holes */}
            <SwiperSlide>
                <Box sx={{p: 6, height: '100vh', boxSizing: 'border-box'}}>

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
                                    <Box display="flex" justifyContent="center" alignItems="flex-start" gap={6}
                                         flexWrap="wrap">
                                        {/* Left: Hole Image */}
                                        <Box position={'relative'} mb={"4rem"}>
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
                                                        fontSize: 'clamp(35px, 1.7vw, 72px)',
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
                                                width={600}
                                                height={840}
                                                style={{borderRadius: '30px'}}
                                            />
                                        </Box>

                                        {/* Right: Hole Info */}
                                        <Box maxWidth={500}>

                                            <Typography fontSize="clamp(1.5rem, 3vw, 3rem)" mb={2}>
                                                Raskuselt <strong>{holeData.rank}</strong>. rada
                                            </Typography>
                                            <Typography textAlign={'right'} fontSize="clamp(1.5rem, 2.5vw, 2.5rem)" mb={10}>
                                                {holeData.average_diff !== undefined
                                                    ? `${holeData.average_diff > 0 ? '+' : ''}${holeData.average_diff.toFixed(1)} viset par-ile`
                                                    : ''}
                                            </Typography>

                                            <Typography textAlign={'right'} fontSize="clamp(1.5rem, 2.5vw, 2.5rem)" borderTop={'3px solid #f42b03'}  mb={10}>
                                                {holeData.ob_percent !== undefined ? `${Math.round(holeData.ob_percent)}% viskas OB` : ''}
                                            </Typography>

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
                                        <Typography fontSize="clamp(1.25rem, 2.5vw, 2rem)" minWidth={500}>
                                            {index + 1}. {player.Name}
                                        </Typography>
                                        <Box display="flex" alignItems="center" gap={2}>
                                            <Typography fontSize="clamp(1.5rem, 2vw, 2rem)" fontWeight="bold">
                                                {Number(player.Diff) > 0 ? `+${player.Diff}` : player.Diff}
                                            </Typography>
                                            <Box display="flex" gap={1} minWidth={600}>
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

                <Box sx={{p: 6, height: '100vh', textAlign: 'center', position: 'relative'}}>


                    <Box
                        display="flex"
                        flexWrap="wrap"
                        justifyContent="center"
                        gap={6}
                        maxWidth="1200px"
                        mx="auto"
                    >
                        {[{
                            label: '🕒 Viimasel puulil',
                            value: mostHolesLeft,
                            sub: 'korvi 100st',
                            bg: '#f8c600'
                        }, {
                            label: '🏁 Lõpetanud',
                            value: finishedPlayersCount,
                            sub: `mängijat ${playerCount}st`,
                            bg: '#a6e4a3'
                        }, {
                            label: '📊 Viskeid kokku',
                            value: totalThrows,
                            sub: `keskmiselt ${(() => {
                                const diff = Math.round(averageDiff);
                                return diff === 0 ? '0' : `${diff > 0 ? '+' : ''}${diff}`;
                            })()} viset par-ile`,
                            bg: '#b3d4fc'
                        }].map((item, i) => (
                            <Box
                                key={i}
                                sx={{
                                    flex: '1 1 300px',
                                    minWidth: '300px',
                                    maxWidth: '400px',
                                    textAlign: 'center',
                                }}
                            >
                                <Typography variant="h4" fontWeight="bold" mb={2}>
                                    {item.label}
                                </Typography>
                                <Box
                                    sx={{
                                        width: '30vh',
                                        height: '30vh',
                                        borderRadius: '50%',
                                        backgroundColor: item.bg,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 'clamp(2rem, 4.5vw, 44rem)',
                                        fontWeight: 'bold',
                                        color: '#000',
                                        margin: '0 auto',
                                    }}
                                >
                                    {item.value}
                                </Box>
                                <Typography variant="h6" mt={2}>
                                    {item.sub}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                    <Image
                        src="/white_logo.webp"
                        alt="Logo"
                        width={400}
                        height={300}
                        priority
                        style={{maxWidth: '80%', height: 'auto', marginBottom: '5vh'}}
                    />
                </Box>
            </SwiperSlide>
        </Swiper>
    )


}
