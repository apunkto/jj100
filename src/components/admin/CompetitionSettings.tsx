import {Box, FormControl, FormControlLabel, InputLabel, MenuItem, Select, Switch, Typography} from '@mui/material'
import type {AdminCompetition} from '@/src/api/useAdminApi'
import {decodeHtmlEntities} from '@/src/utils/textUtils'

type CompetitionStatus = AdminCompetition['status']

interface CompetitionSettingsProps {
    competition: AdminCompetition
    updating: boolean
    onStatusChange: (status: CompetitionStatus) => void
    onCtpToggle: (enabled: boolean) => void
    onCheckinToggle: (enabled: boolean) => void
    onPredictionToggle: (enabled: boolean) => void
    onDidRainToggle: (enabled: boolean) => void
}

const STATUS_LABELS: Record<CompetitionStatus, string> = {
    waiting: 'Ootel',
    started: 'Võistlus Käib',
    finished: 'Lõppenud',
}

export function CompetitionSettings({
    competition,
    updating,
    onStatusChange,
    onCtpToggle,
    onCheckinToggle,
    onPredictionToggle,
    onDidRainToggle,
}: CompetitionSettingsProps) {
    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', mb: 3 }}>
            <Typography variant="h4" fontWeight="bold" textAlign="center" mb={1}>
                {decodeHtmlEntities(competition.name) || 'Võistluse seaded'}
            </Typography>

            <Box display="flex" flexDirection="column" gap={3} mt={4}>
                <FormControl fullWidth size="small" sx={{ maxWidth: 280 }}>
                    <InputLabel id="competition-status-label">Staatus</InputLabel>
                    <Select
                        labelId="competition-status-label"
                        label="Staatus"
                        value={competition.status}
                        onChange={(e) => onStatusChange(e.target.value as CompetitionStatus)}
                        disabled={updating}
                    >
                        <MenuItem value="waiting">{STATUS_LABELS.waiting}</MenuItem>
                        <MenuItem value="started">{STATUS_LABELS.started}</MenuItem>
                        <MenuItem value="finished">{STATUS_LABELS.finished}</MenuItem>
                    </Select>
                </FormControl>
                <FormControlLabel
                    control={
                        <Switch
                            checked={competition.ctp_enabled}
                            onChange={(e) => onCtpToggle(e.target.checked)}
                            disabled={updating}
                        />
                    }
                    label="CTP lubatud"
                />

                <FormControlLabel
                    control={
                        <Switch
                            checked={competition.checkin_enabled}
                            onChange={(e) => onCheckinToggle(e.target.checked)}
                            disabled={updating}
                        />
                    }
                    label="Luba loosimängud"
                />

                <FormControlLabel
                    control={
                        <Switch
                            checked={competition.prediction_enabled}
                            onChange={(e) => onPredictionToggle(e.target.checked)}
                            disabled={updating}
                        />
                    }
                    label="Luba ennustamine"
                />

                <FormControlLabel
                    control={
                        <Switch
                            checked={competition.did_rain}
                            onChange={(e) => onDidRainToggle(e.target.checked)}
                            disabled={updating}
                        />
                    }
                    label="Sadas vihma"
                />
            </Box>
        </Box>
    )
}
