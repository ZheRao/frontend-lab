import { useEffect, useRef } from 'react'

export function ErrorDialog({ open, title, message, actionLabel, onAction }) {
    const errRef = useRef(null)

    useEffect(() => {
        const dialog = errRef.current 

        if (open) {
            if (!dialog.open) dialog.showModal()
        } else {
            if (dialog.open) dialog.close()
        }
    }, [open])

    return (
        <dialog ref={errRef}
            onCancel={(event)=>{
                if (!showClose) event.preventDefault()
            }}
            className="dialog dialog--error"
        >
            <div className="dialog-body">
                <h3 className="dialog-title">
                    <svg className="icon icon-danger" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4" />
                        <path d="M12 16h.01" />
                    </svg>
                    {title}
                </h3>
                <p className="dialog-text">{message}</p>
                <div className="actions">
                    <button type="button" className="btn btn-neutral" onClick={onAction}>{actionLabel}</button>
                </div>
            </div>
        </dialog>
    )
}

export default ErrorDialog

