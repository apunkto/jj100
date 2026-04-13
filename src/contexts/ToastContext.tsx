import React, {createContext, ReactNode, useCallback, useContext, useMemo, useState} from 'react'
import {Alert, Snackbar} from '@mui/material'

type ToastContextType = {
    showToast: (message: string, severity?: 'success' | 'error' | 'warning' | 'info') => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [open, setOpen] = useState(false)
    const [message, setMessage] = useState('')
    const [severity, setSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success')

    const showToast = useCallback((msg: string, sev: 'success' | 'error' | 'warning' | 'info' = 'success') => {
        setMessage(msg)
        setSeverity(sev)
        setOpen(true)
    }, [])

    const handleClose = () => {
        setOpen(false)
    }

    const contextValue = useMemo(() => ({ showToast }), [showToast])

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            <Snackbar
                open={open}
                autoHideDuration={3000}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleClose} severity={severity}>
                    {message}
                </Alert>
            </Snackbar>
        </ToastContext.Provider>
    )
}

export const useToast = () => {
    const context = useContext(ToastContext)
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider')
    }
    return context
}
