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
                    <div className="actions pending-actions">{children}</div>
                }
            </div>
        </dialog>
    )
}