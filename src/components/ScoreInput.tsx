import React, {useEffect, useState} from 'react'
import {Box, Paper, type SxProps, TextField, type Theme, Typography} from '@mui/material'
import {useTranslation} from 'react-i18next'

/** On `action.hover` section cards, fields must read as active (not disabled gray). */
/** Section wrapper for each prediction form field */
export const predictionFormSectionPaperSx = {
    p: 2,
    borderRadius: 2,
    border: 1,
    borderColor: 'divider',
    bgcolor: 'action.hover',
} as const

export const predictionFormTextFieldSx: SxProps<Theme> = {
    '& .MuiOutlinedInput-root': {
        bgcolor: 'background.paper',
    },
    '& .MuiOutlinedInput-root:not(.Mui-error) .MuiOutlinedInput-notchedOutline': {
        borderColor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.grey[600] : theme.palette.grey[400]),
    },
    '&:hover .MuiOutlinedInput-root:not(.Mui-error) .MuiOutlinedInput-notchedOutline': {
        borderColor: (theme) => theme.palette.primary.main,
    },
}

interface ScoreInputProps {
    label: string
    /** 1-based step number shown before the question text */
    questionNumber?: number
    description?: string
    /** Smaller hint under the question (e.g. negative = under par) */
    showParHint?: boolean
    value: number | null | undefined
    onChange: (value: number | null) => void
    fullWidth?: boolean
    required?: boolean
    error?: boolean
    helperText?: string
    touched?: boolean // Force show validation errors even if not blurred
}

/**
 * A reusable score input component that handles golf score formatting.
 * - Displays positive numbers with "+" prefix (e.g., "+3")
 * - Displays negative numbers with "-" prefix (e.g., "-2")
 * - Displays zero as "0" without a sign
 * - Allows typing intermediate values like "-" while entering negative numbers
 * - Parses "+3" input to 3 automatically
 */
export const ScoreInput: React.FC<ScoreInputProps> = ({
    label,
    questionNumber,
    description,
    showParHint = false,
    value,
    onChange,
    fullWidth = true,
    required = false,
    error: externalError = false,
    helperText: externalHelperText,
    touched = false,
}) => {
    const {t} = useTranslation('prediction')
    // Internal state to allow intermediate input values like "-"
    const [inputValue, setInputValue] = useState<string>('')
    const [hasBlurred, setHasBlurred] = useState(false)

    // Update input value when external value changes (e.g., when loading from API)
    useEffect(() => {
        queueMicrotask(() => {
            if (value === null || value === undefined) {
                setInputValue('')
            } else if (value === 0) {
                setInputValue('0')
            } else if (value > 0) {
                setInputValue(`+${value}`)
            } else {
                setInputValue(String(value))
            }
        })
    }, [value])

    // Validation logic
    const isEmpty = inputValue.trim() === '' || inputValue.trim() === '-'
    const hasInvalidInput =
        inputValue.trim() !== '' && inputValue.trim() !== '-' && !isValidNumericInput(inputValue.trim())

    // Show error if touched (forced) or blurred, and field is invalid
    const shouldShowError = touched || hasBlurred
    const showError = (shouldShowError && ((required && isEmpty) || hasInvalidInput)) || externalError
    const errorMessage = hasInvalidInput
        ? t('validation_invalidNumber')
        : required && isEmpty && shouldShowError
          ? t('validation_required')
          : externalHelperText || ''

    function isValidNumericInput(input: string): boolean {
        if (input === '' || input === '-') return true // Allow intermediate states

        // Remove leading + if present
        let parseValue = input
        if (parseValue.startsWith('+')) {
            parseValue = parseValue.substring(1)
        }

        // Check if it's a valid number
        const numValue = Number(parseValue)
        return Number.isFinite(numValue) && !isNaN(numValue)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value

        // Update input state immediately to allow typing "-"
        setInputValue(newValue)

        // Parse and update parent component
        const trimmed = newValue.trim()
        if (trimmed === '' || trimmed === '-') {
            onChange(null)
            return
        }

        // Parse "+3" to "3", but keep "-3" as "-3"
        let parseValue = trimmed
        if (parseValue.startsWith('+')) {
            parseValue = parseValue.substring(1)
        }

        const numValue = Number(parseValue)
        if (Number.isFinite(numValue) && !isNaN(numValue)) {
            onChange(numValue)

            // Format display value
            if (numValue === 0) {
                setInputValue('0')
            } else if (numValue > 0) {
                setInputValue(`+${numValue}`)
            } else {
                setInputValue(String(numValue))
            }
        }
    }

    const handleBlur = () => {
        setHasBlurred(true)
    }

    return (
        <Paper variant="outlined" component="section" elevation={0} sx={predictionFormSectionPaperSx}>
            {description ? (
                <Typography
                    component="h3"
                    variant="subtitle1"
                    sx={{
                        fontWeight: 600,
                        color: 'text.primary',
                        letterSpacing: '0.01em',
                        lineHeight: "1.35rem",
                        mb: showParHint ? 0.5 : 1.25,
                    }}
                >
                    {questionNumber != null ? (
                        <Box component="span" sx={{color: 'primary.main', fontWeight: 700, mr: 0.75}}>
                            {questionNumber}.
                        </Box>
                    ) : null}
                    {description}
                </Typography>
            ) : null}
            {showParHint ? (
                <Typography
                    variant="caption"
                    color="text.secondary"
                    component="p"
                    sx={{m: 0, mb: 1, lineHeight: "1.45rem", maxWidth: '100%'}}
                >
                    {t('scoreVsParHint')}
                </Typography>
            ) : null}
            <TextField
                label={label}
                type="text"
                value={inputValue}
                onChange={handleChange}
                onBlur={handleBlur}
                fullWidth={fullWidth}
                required={required}
                error={showError}
                helperText={showError ? errorMessage : undefined}
                size="small"
                placeholder={t('scoreInputPlaceholder')}
                variant="outlined"
                sx={predictionFormTextFieldSx}
            />
        </Paper>
    )
}
