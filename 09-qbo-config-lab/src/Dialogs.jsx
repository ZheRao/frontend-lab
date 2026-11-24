import { useEffect, useRef } from 'react'

export function PendingDialog({ open, label="Processing...", children }) {
    const dialogRef = useRef(null)

    useEffect(() => {
        const dialog = dialogRef.current 
        if (open) {
            if (!dialog.open) dialog.showModal()
        } else {
            if (dialog.open) dialog.close()
        }
    }, [open])

    return (
        <dialog ref={dialogRef} className="dialog dialog--pending"
            onCancel={(event)=>{
                event.preventDefault()
            }}
        >
            <div className="pending-body">
                <span className="spinner" aria-hidden="true" />
                <p className="pending-label" role="status">{label}</p>
                {children && 
                    <div className="pending-extra">{children}</div>
                }
            </div>
        </dialog>
    )
}

export function SuccessDialog({ open, message="Success!", duration=2000, onDone }) {
    const dialogRef = useRef(null)

    // Always hold the LATEST onDone, without making the timer depend on it
    // (onDone is a new function on every App render; if it were a dependency of the timer effect,
    //  any App re-render would restart the 2-second timer.)
    const onDoneRef = useRef(null)
    useEffect(() => {
        onDoneRef.current = onDone
    })

    // Sync the dialog to 'open'
    useEffect(() => {
        const dialog = dialogRef.current
        if (open) {
            if (!dialog.open) dialog.showModal()
        } else {
            if (dialog.open) dialog.close()
        }
    }, [open])

    // self-close: start a timer when opened; cancel it if closed early or unmounted
    useEffect(()=>{
        if (!open) return
        const timer = setTimeout(()=>onDoneRef.current?.(), duration)
        return ()=> clearTimeout(timer)
    }, [open, duration])

    return (
        <dialog
            ref={dialogRef}
            className="dialog dialog--success"
            onClose={()=> onDoneRef.current?.()}    /* Esc dismisses early */
            style={{ '--duration': `${duration}ms` }}
        >
            <div className="success-body">
                <svg className="icon icon-success" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <path d="m8 12 3 3 5-6" />
                </svg>
                <p className="success-label" role="status">{message}</p>
            </div>
            {open && <span className="success-timer" aria-hidden="true" />}
        </dialog>
    )
}

export function NoticeBanner({ notice, duration = 5000, onDone }){
    const ref = useRef(null)

    const onDoneRef = useRef(null)
    useEffect(()=>{
        onDoneRef.current = onDone
    })
    
    useEffect(()=>{
        const banner = ref.current 
        if (!banner) return
        if (notice !== null) {
            if (!banner.matches(':popover-open')) banner.showPopover()
        } else {
            if (banner.matches(':popover-open')) banner.hidePopover()
        }
    }, [notice])

    useEffect(()=>{
        if (notice===null) return
        const timer = setTimeout(()=>onDoneRef.current?.(), duration)
        return () => clearTimeout(timer)
    }, [notice, duration])

    return (
        <div ref={ref} popover="manual" className="notice-banner" role="status">
            {notice && (
                <>
                    <h3 className="notice-title">
                        {notice?.title}
                    </h3>
                    <p className="notice-message">
                        {notice?.message}
                    </p>
                </>
            )}
        </div>
    )
}