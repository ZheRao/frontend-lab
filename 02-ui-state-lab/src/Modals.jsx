import { useEffect, useRef } from 'react'

function ModifyClientModal( { open, title, draft, setDraft, onSave, onClose } ) {
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
        <dialog ref={dialogRef} onClose={onClose}>
            <form onSubmit={onSave}>
                <h3 className="title-popup">{title}</h3>
                <label>
                    Client Name: 
                    <input className="user-entry" 
                    value={draft?.client_name ?? ''}
                    onChange={(event)=>setDraft((prev)=>({...prev, client_name:event.target.value}))}
                    />
                </label>
                <div className="actions">
                    <button type="submit">Save</button>
                    <button type="button" onClick={()=>dialogRef.current.close()}>Cancel</button>
                </div>
            </form>
        </dialog>
    )
}

export default ModifyClientModal
