import React, {Component, ErrorInfo, ReactNode} from 'react'
import {Box, Button, Typography} from '@mui/material'

interface ErrorBoundaryProps {
    children: ReactNode
    fallback?: ReactNode
}

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = {hasError: false, error: null}
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return {hasError: true, error}
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo)
    }

    handleReset = () => {
        this.setState({hasError: false, error: null})
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    minHeight="50vh"
                    p={4}
                    textAlign="center"
                >
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                        Midagi läks valesti
                    </Typography>
                    <Typography variant="body1" color="text.secondary" mb={3}>
                        Palun proovi lehte uuesti laadida.
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={() => {
                            this.handleReset()
                            window.location.reload()
                        }}
                    >
                        Laadi uuesti
                    </Button>
                </Box>
            )
        }

        return this.props.children
    }
}
