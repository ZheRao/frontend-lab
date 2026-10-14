import { useEffect, useRef } from 'react'

export function ModifyClientModal( { open, title, draft, setDraft, onSave, onClose, isPending } ) {
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
        <dialog ref={dialogRef} onClose={onClose} className="dialog"
            onCancel={(event) => {
                if (isPending) event.preventDefault()
            }}
        >
            <form onSubmit={onSave} className="dialog-body">
                <h3 className="dialog-title">{title}</h3>
                <label className="field">
                    Client Name: 
                    <input className="input" 
                    value={draft?.name ?? ''}
                    disabled={isPending}
                    onChange={(event)=>setDraft((prev)=>({...prev, name:event.target.value}))}
                    />
                </label>
                <div className="actions">
                    <button type="submit" className="btn btn-primary" disabled={isPending}>
                        {isPending ? 'Saving...' : 'Save'}
                    </button>
                    <button type="button" className="btn btn-secondary" disabled={isPending}
                        onClick={()=>dialogRef.current.close()}>Cancel</button>
                </div>
            </form>
        </dialog>
    )
}

export function DeleteClientModal({ open, client_name, onConfirm, onClose, isPending}){
    const dialogRef = useRef(null)

    useEffect(()=> {
        const dialog = dialogRef.current 
        if (open) {
            if (!dialog.open) dialog.showModal()
        } else {
            if (dialog.open) dialog.close()
        }
    }, [open])

    return (
        <dialog ref={dialogRef} onClose={onClose} className="dialog dialog--danger"
            onCancel={(event) => {
                if (isPending) event.preventDefault()
            }}
        >
            <form onSubmit={onConfirm} className="dialog-body">
                <h3 className="dialog-title">Delete Requested</h3>
                <p className="highlight-box">{client_name}</p>
                <p className="dialog-text">This client will be permanently removed.</p>
                <div className="actions">
                    <button 
                        type="button" className="btn btn-secondary" autoFocus
                        onClick={()=>dialogRef.current.close()}
                        disabled={isPending}
                    >
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-danger" disabled={isPending}>
                        {isPending ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </form>
        </dialog>
    )
} 
