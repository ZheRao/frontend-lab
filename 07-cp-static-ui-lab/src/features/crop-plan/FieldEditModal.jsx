// features/crop-plan/FieldEditModal.jsx

import { useRef, useEffect } from 'react'
import {
    clients,
    revisions
} from './sampleData.js'

import { formatValue } from './helpers.js'

// on edit, setDraft({ value: ..., memo: ... })
// on click, setEditContext({ contextkey, crop, catInfo, fieldInfo })
//  crop contains id and name, catInfo contains key, label, unit, fieldInfo contains value, memo, isInherited, history
function FieldEditModal({ open, draft, setDraft, editContext, onModalClose }) {
    const dialogRef = useRef(null)

    useEffect(() => {
        const dialog = dialogRef.current 
        if (open) {
            if (!dialog.open) dialog.showModal()
        } else {
            if (dialog.open) dialog.close()
        }
    }, [open])

    const { contextKey, crop, catInfo, fieldInfo } = editContext
    const [clientId, forecastYear, revisionId] = contextKey.split("|")
    const client = clients.find((client) => (client.id===Number(clientId)))
    const revision = revisions.find((rev) => (rev.id === Number(revisionId)))

    

    return (
        <dialog ref={dialogRef} onClose={onModalClose} className="dialog">
            <form className="dialog-body">
                <header>
                    <h3 className="dialog-title">{catInfo.label}</h3>
                    <span>{crop.name}</span>
                    <p>{client.name} · {forecastYear} · Rev {revision.order} · {revision.name}</p>
                </header>
                <span>
                    Current value 
                    {fieldInfo ? formatValue(fieldInfo.value) : "—"}
                    {fieldInfo && (
                        <>
                            <span className="field__unit">{catInfo.unit}</span>
                            {fieldInfo.isInherited 
                                ? <p><span className="indicator indicator--inherited" aria-hidden="true" />Inherited</p>
                                : <p><span className="indicator indicator--local" aria-hidden="true" />Saved in this revision</p>
                                    
                            }
                        </>  
                    )}
                    <p>Memo: {(fieldInfo && fieldInfo?.memo !== null) ? fieldInfo.memo : '—'}</p>
                </span>
                
                <label className="field">
                    New Value <span>({catInfo.unit})</span>
                    <input className="input" 
                        value={draft?.value ?? ''}
                        onChange={(event) => setDraft((prev) => ({...prev, value:event.target.value}))}
                    />
                </label>

                <label className="field">
                    Memo (optional)
                    <input className="input" 
                        value={draft?.memo ?? ''}
                        onChange={(event) => setDraft((prev) => ({...prev, memo:event.target.value}))}
                        // no memo inheritance 
                    />
                </label>

                <div className="actions">
                    <button type="submit" className="btn btn-primary">
                        Save
                    </button>
                    <button type="button" className="btn btn-secondary"
                        onClick={()=>dialogRef.current.close()}>
                        Cancel
                    </button>
                </div>
            </form>

            <div>
                <h3 className="dialog-title">History in Rev {revision.order}</h3>
                {fieldInfo && fieldInfo.history.length !== 0 ? (
                    fieldInfo.history.map((record) => (
                        <p key={record.id}>{record.value}-{record.createdAt}-{record.createdBy}</p>
                    ))
                ) : (
                    <p>No edits in Rev {revision.order}</p>
                )}
            </div>
        </dialog>
    )
}

export default FieldEditModal