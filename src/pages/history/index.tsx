import Layout from '@/src/components/Layout'
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    Typography,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import SickIcon from '@mui/icons-material/Sick'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import StarIcon from '@mui/icons-material/Star'
import usePlayerApi, {ParticipationLeader, Player, UserParticipation,} from '@/src/api/usePlayerApi'
import {useEffect, useMemo, useState} from 'react'

export default function HistoryPage() {
    const [participations, setParticipations] = useState<UserParticipation[]>([])
    const [leaders, setLeaders] = useState<ParticipationLeader[]>([])
    const [me, setMe] = useState<Player | null>(null)

    const { getPlayerParticipations, getParticipationLeaders, getLoggedInUser } = usePlayerApi()
    const timesLabel = (n: number) => (n === 1 ? 'kord' : 'korda')

    useEffect(() => {
        const load = async () => {
            try {
                const [p, l, u] = await Promise.all([
                    getPlayerParticipations(),
                    getParticipationLeaders(),
                    getLoggedInUser(),
                ])
                setParticipations(p ?? [])
                setLeaders(l ?? [])
                setMe(u ?? null)
            } catch (err) {
                console.error('Failed to load history page data:', err)
                setParticipations([])
                setLeaders([])
                setMe(null)
            }
        }
        load()
    }, [getPlayerParticipations, getParticipationLeaders, getLoggedInUser])

    const years = useMemo(() => {
        const start = 2017
        const end = 2025
        return Array.from({ length: end - start + 1 }, (_, i) => start + i)
    }, [])

    const byYear = useMemo(() => {
        const map = new Map<number, UserParticipation[]>()
        for (const p of participations) {
            if (!map.has(p.year)) map.set(p.year, [])
            map.get(p.year)!.push(p)
        }
        for (const [y, arr] of map.entries()) {
            arr.sort((a, b) => a.place - b.place || a.score - b.score)
            map.set(y, arr)
        }
        return map
    }, [participations])

    // how many distinct years *this user* has participated (from their participation data)
    const myParticipationYears = useMemo(() => {
        const s = new Set<number>()
        for (const p of participations) s.add(p.year)
        return s.size
    }, [participations])

    const leaderboard = useMemo(() => {
        if (!leaders.length) return null

        const groups = leaders.reduce((acc, l) => {
            const k = l.participationYears
            if (!acc[k]) acc[k] = []
            acc[k].push(l)
            return acc
        }, {} as Record<number, ParticipationLeader[]>)

        const amounts = Object.keys(groups).map(Number).sort((a, b) => b - a)

        for (const amt of amounts) {
            groups[amt].sort((a, b) => a.name.localeCompare(b.name, 'et'))
        }

        return { groups, amounts, maxAmount: amounts[0] }
    }, [leaders])

    // open max bucket by default
    const [expandedAmount, setExpandedAmount] = useState<number | false>(false)

    useEffect(() => {
        if (leaderboard?.maxAmount != null) {
            setExpandedAmount(leaderboard.maxAmount)
        }
    }, [leaderboard?.maxAmount])

    const handleAccordionChange = (amount: number) => (_: unknown, isExpanded: boolean) => {
        setExpandedAmount(isExpanded ? amount : false)
    }

    const isCancelledYear = (year: number) => year === 2020 || year === 2021
    const fmtScore = (score: number) => (score > 0 ? `+${score}` : `${score}`)

    // Comma-separated list with ability to bold "me"
    const NamesCommaList = ({
                                list,
                                meMetrixId,
                            }: {
        list: ParticipationLeader[]
        meMetrixId?: number
    }) => {
        return (
            <Typography
                sx={{
                    fontSize: { xs: 12, sm: 13 },
                    lineHeight: 1.35,
                    wordBreak: 'break-word',
                    whiteSpace: 'normal',
                }}
            >
                {list.map((p, idx) => {
                    const isMe = meMetrixId != null && p.metrixUserId === meMetrixId
                    return (
                        <Box
                            key={p.metrixUserId}
                            component="span"
                            sx={{ fontWeight: isMe ? 800 : 400 }}
                        >
                            {p.name}
                            {idx < list.length - 1 ? ', ' : ''}
                        </Box>
                    )
                })}
            </Typography>
        )
    }

    return (
        <Layout>
            <Box mt={2} display="flex" flexDirection="column" alignItems="center" textAlign="center" gap={2}>
                <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: 22, sm: 28 } }}>
                    Minu osalemised
                </Typography>

                {/* Participation list FIRST */}
                <Box width="100%" maxWidth={720}>
                    <List sx={{ py: 0 }}>
                        {years.map((year, idx) => {
                            const results = byYear.get(year) ?? []
                            const participated = results.length > 0
                            const cancelled = isCancelledYear(year)

                            const icon = cancelled ? (
                                <SickIcon color="warning" fontSize="small" />
                            ) : participated ? (
                                <CheckCircleIcon sx={{ color: 'success.main' }} fontSize="small" />
                            ) : (
                                <CancelIcon sx={{ color: 'error.main' }} fontSize="small" />
                            )

                            return (
                                <Box key={year}>
                                    <ListItem
                                        disableGutters
                                        sx={{
                                            px: { xs: 1, sm: 2 },
                                            py: { xs: 0.75, sm: 1.1 },
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: { xs: 1, sm: 1.5 },
                                        }}
                                    >
                                        <ListItemIcon sx={{ minWidth: { xs: 28, sm: 40 }, mt: 0.15 }}>
                                            {icon}
                                        </ListItemIcon>

                                        <Box
                                            sx={{
                                                flex: 1,
                                                minWidth: 0,
                                                display: 'flex',
                                                flexDirection: { xs: 'column', sm: 'row' },
                                                alignItems: 'flex-start',
                                                justifyContent: { xs: 'flex-start', sm: 'space-between' },
                                                gap: { xs: 0.25, sm: 2 },
                                            }}
                                        >
                                            <Typography
                                                fontWeight={700}
                                                sx={{ fontSize: { xs: 15, sm: 16 }, lineHeight: { xs: 1.2, sm: 1.9 } }}
                                            >
                                                {year}
                                            </Typography>

                                            {cancelled ? (
                                                <Typography
                                                    color="text.secondary"
                                                    sx={{
                                                        fontSize: { xs: 13, sm: 14 },
                                                        lineHeight: { xs: 1.2, sm: 1.9 },
                                                        textAlign: { xs: 'left', sm: 'right' },
                                                    }}
                                                >
                                                    Jäi ära koroonaviiruse tõttu
                                                </Typography>
                                            ) : !participated ? (
                                                <Typography
                                                    color="text.secondary"
                                                    sx={{
                                                        fontSize: { xs: 13, sm: 14 },
                                                        lineHeight: { xs: 1.2, sm: 1.9 },
                                                        textAlign: { xs: 'left', sm: 'right' },
                                                    }}
                                                >
                                                    Ei osalenud
                                                </Typography>
                                            ) : (
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        flexWrap: 'wrap',
                                                        justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                                                        columnGap: { xs: 1, sm: 1.5 },
                                                        rowGap: { xs: 0.35, sm: 0.5 },
                                                        maxWidth: { xs: '100%', sm: '70%' },
                                                    }}
                                                >
                                                    {results.map((r, i) => (
                                                        <Typography
                                                            key={`${year}-${i}-${r.place}-${r.score}`}
                                                            sx={{
                                                                whiteSpace: 'nowrap',
                                                                fontSize: { xs: 13, sm: 14 },
                                                                lineHeight: { xs: 1.2, sm: 1.9 },
                                                            }}
                                                        >
                                                            Koht: {r.place} ({fmtScore(r.score)})
                                                        </Typography>
                                                    ))}
                                                </Box>
                                            )}
                                        </Box>
                                    </ListItem>

                                    {idx < years.length - 1 && <Divider component="li" />}
                                </Box>
                            )
                        })}
                    </List>
                </Box>

                {/* Leaderboard SECOND */}
                <Box width="100%" maxWidth={720} textAlign="left">
                    <Typography
                        variant="h4"
                        textAlign="center"
                        fontWeight="bold"
                        sx={{ fontSize: { xs: 22, sm: 28 }, marginBottom: 2, marginTop: 3 }}
                    >
                        Enim osalemisi
                    </Typography>

                    {!leaderboard ? (
                        <Typography color="text.secondary" sx={{ fontSize: { xs: 13, sm: 14 } }}>
                            Andmeid ei leitud.
                        </Typography>
                    ) : (
                        <Box>
                            {leaderboard.amounts.map((amount) => {
                                const isMyBucket = myParticipationYears > 0 && amount === myParticipationYears

                                return (
                                    <Accordion
                                        key={amount}
                                        expanded={expandedAmount === amount}
                                        onChange={handleAccordionChange(amount)}
                                        disableGutters
                                        elevation={0}
                                        sx={{
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            borderRadius: 2,
                                            '&:before': { display: 'none' },
                                            mb: 1,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                    minWidth: 0,
                                                }}
                                            >
                                                {isMyBucket && <StarIcon fontSize="small" sx={{ color: 'warning.main' }} />}

                                                <Typography sx={{ fontWeight: 700, fontSize: { xs: 13, sm: 14 } }}>
                                                    {amount} {timesLabel(amount)}
                                                    <Typography
                                                        component="span"
                                                        sx={{ ml: 1, fontSize: { xs: 12, sm: 13 }, color: 'text.secondary' }}
                                                    >
                                                        ({leaderboard.groups[amount].length})
                                                    </Typography>
                                                </Typography>

                                            </Box>
                                        </AccordionSummary>

                                        <AccordionDetails>
                                            <NamesCommaList list={leaderboard.groups[amount]} meMetrixId={me?.metrixUserId} />
                                        </AccordionDetails>
                                    </Accordion>
                                )
                            })}
                        </Box>
                    )}
                </Box>
            </Box>
        </Layout>
    )
}
