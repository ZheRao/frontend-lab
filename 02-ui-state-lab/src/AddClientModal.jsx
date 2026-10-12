import { useEffect, useRef } from 'react'

function AddClientModal( { workflow, draft, setDraft, onClose } ) {
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
            <form method="dialog">
            <h3 className="title-popup">Add New Client</h3>
            <label>
                Client Name: 
                <input className="user-entry" 
                value={draft?.client_name ?? ''}
                onChange={(event)=>setDraft((prev)=>({...prev, client_name:event.target.value}))}
                />
            </label>
            <div className="actions">
                <button value="save">Save</button>
                <button value="cancel">Cancel</button>
            </div>
            </form>
        </dialog>
    )
}

export default AddClientModal