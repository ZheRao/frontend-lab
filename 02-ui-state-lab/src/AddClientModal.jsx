import { useEffect, useRef } from 'react'

function AddClientModal( { workflow, draft, setDraft, onSave, onClose } ) {
    const dialogRef = useRef(null)
    
    useEffect(() => {
        const dialog = dialogRef.current 
        if (workflow === 'add') {
            if (!dialog.open) dialog.showModal()
        } else {
            if (dialog.open) dialog.close()
        }
    }, [workflow])

    return (
        <dialog ref={dialogRef} onClose={onClose}>
            <form onSubmit={onSave}>
            <h3 className="title-popup">Add New Client</h3>
            <label>
                Client Name: 
                <input className="user-entry" 
                value={draft?.client_name ?? ''}
                onChange={(event)=>setDraft((prev)=>({...prev, client_name:event.target.value}))}
                />
            </label>
            <div className="actions">
                <button type="button" onClick={onSave}>Save</button>
                <button type="button" onClick={onClose}>Cancel</button>
            </div>
            </form>
        </dialog>
    )
}

export default AddClientModal