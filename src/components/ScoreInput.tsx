import React, {useEffect, useState} from 'react'
import {Box, TextField, Typography} from '@mui/material'

interface ScoreInputProps {
    label: string
    description?: string
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
    description,
    value,
    onChange,
    fullWidth = true,
    required = false,
    error: externalError = false,
    helperText: externalHelperText,
    touched = false,
}) => {
    // Internal state to allow intermediate input values like "-"
    const [inputValue, setInputValue] = useState<string>('')
    const [hasBlurred, setHasBlurred] = useState(false)

    // Update input value when external value changes (e.g., when loading from API)
    useEffect(() => {
        if (value === null || value === undefined) {
            setInputValue('')
        } else if (value === 0) {
            setInputValue('0')
        } else if (value > 0) {
            setInputValue(`+${value}`)
        } else {
            setInputValue(String(value))
        }
    }, [value])

    // Validation logic
    const isEmpty = inputValue.trim() === '' || inputValue.trim() === '-'
    const hasInvalidInput = inputValue.trim() !== '' && 
                           inputValue.trim() !== '-' && 
                           !isValidNumericInput(inputValue.trim())
    
    // Show error if touched (forced) or blurred, and field is invalid
    const shouldShowError = touched || hasBlurred
    const showError = shouldShowError && ((required && isEmpty) || hasInvalidInput) || externalError
    const errorMessage = hasInvalidInput 
        ? 'Palun sisesta korrektne numbriline väärtus'
        : required && isEmpty && shouldShowError
        ? 'See väli on kohustuslik'
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
        <Box>
            {description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {description}
                </Typography>
            )}
            <TextField
                label={label}
                type="text"
                value={inputValue}
                onChange={handleChange}
                onBlur={handleBlur}
                fullWidth={fullWidth}
                required={required}
                error={showError}
                helperText={showError ? errorMessage : ''}
            />
        </Box>
    )
}
