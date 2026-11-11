// features/crop-plan/FieldEditModal.jsx

import { useRef, useEffect, useState } from 'react'
import {
    clients,
    revisions
} from './sampleData.js'

import { formatValue } from './helpers.js'
import { formatDate } from './helpers.js'

function FieldEditModal({ open, onModalClose, onRequestSubmit, contextKey, crop, catInfo, fieldInfo }) {
    const dialogRef = useRef(null)

    useEffect(() => {
        const dialog = dialogRef.current 
        if (open) {
            if (!dialog.open) dialog.showModal()
        } else {
            if (dialog.open) dialog.close()
        }
    }, [open])

    const [clientId, forecastYear, revisionId] = contextKey.split("|")
    const client = clients.find((client) => (client.id===Number(clientId)))
    const revision = revisions.find((rev) => (rev.id === Number(revisionId)))
    // inherited revision
    const recordRevisionId = fieldInfo?.revisionId
    const recordRevision = revisions.find((rev) => (rev.id === recordRevisionId))

    const validateInput = (input) => {
        return (
            input.trim() === '' 
                ? {type: "validation", title: "Invalid Value", code: "INVALID_VALUE",
                    message: "Value cannot be missing or consist entirely of whitespace",
                    recovery: "return-to-draft"} // setting up error object for error dialog later
                : null
        )
    }

    const [draft, setDraft] = useState({ value: '', memo: null })    // on edit, setDraft({ value: ..., memo: ... })

    return (
        <dialog ref={dialogRef} onClose={onModalClose} className="dialog dialog--wide">
            <form 
                className="dialog-body" 
                onSubmit={(event) => {
                    event.preventDefault()
                    if (draft.value.trim() === '') return   // safeguard against empty draft value
                    onRequestSubmit({
                        clientId,
                        forecastYear,
                        cropId: crop.id,
                        revisionId,
                        categoryKey: catInfo.key,
                        value: draft.value,
                        createdBy: "Test User",
                        memo: (draft.memo ?? '').trim() === '' ? null : draft.memo.trim()
                    })
                    onModalClose()
                }}
            >
                <header className="field-dialog__header">
                    <div className="field-dialog__title-row">
                        <h3 className="dialog-title">{catInfo.label}</h3>
                        <p className="field-dialog__context">
                            {client.name} · {forecastYear} · Rev {revision.order} · {revision.name}
                        </p>
                    </div>
                    <span className="field-dialog__crop">{crop.name}</span>
                </header>

                <div className="field-dialog__current">
                    <span className="field-dialog__current-label">Current value</span>
                    <span className="field-dialog__current-value" >
                        {fieldInfo ? formatValue(fieldInfo.value) : "—"}
                        {fieldInfo && <span className="crop-field__unit">{catInfo.unit}</span>}
                    </span>
                    
                    {fieldInfo === undefined ? (
                        <span className="field-dialog__status">No existing input</span>
                    ) : fieldInfo.isInherited ? (
                        <span className="field-dialog__status">
                            <span className="indicator indicator--inherited" aria-hidden="true" />
                            Inherited from Rev {recordRevision?.order} · {recordRevision?.name}
                        </span>
                    ) : (
                        <span className="field-dialog__status">
                            <span className="indicator indicator--local" aria-hidden="true" />
                            Saved in this revision
                        </span>
                    )}
                    {fieldInfo?.memo && <p className="field-dialog__memo">Last memo: {fieldInfo.memo}</p>}
                </div>
                
                <label className="field">
                    <span>
                        New Value <span className="field-dialog__unit-hint">({catInfo.unit})</span>
                    </span>
                    
                    <input 
                        className="input" 
                        inputMode="decimal"
                        value={draft.value}
                        onChange={(event) => setDraft((prev) => ({...prev, value:event.target.value}))}
                    />
                </label>

                <label className="field">
                    Memo (optional)
                    <textarea 
                        className="input" 
                        rows={2}
                        value={draft?.memo ?? ''}
                        onChange={(event) => setDraft((prev) => ({...prev, memo:event.target.value}))}
                        // no memo inheritance 
                    />
                </label>

                <div className="actions">
                    <button type="button" className="btn btn-secondary" onClick={onModalClose}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                        Save
                    </button>
                </div>
            </form>

            <section className="field-dialog__history" aria-labelledby="history-title">
                <h4 id="history-title" className="field-dialog__history-title">
                    History in Rev {revision.order}
                </h4>
                {fieldInfo && fieldInfo.history.length !== 0 ? (
                    <ol className="history-list">
                        {fieldInfo.history.map((record, index) => (
                            <li key={record.id} className="history-entry">
                                <div className="history-entry__top">
                                    <span className="history-entry__value">
                                        {formatValue(record.value)}
                                        <span className="crop-field__unit">{catInfo.unit}</span>
                                        {index === 0 && <span className="history-entry__badge">Current</span>}
                                    </span>
                                    <span className="history-entry__meta">
                                        {formatDate(record.createdAt)} · {record.createdBy}
                                    </span>
                                </div>
                                <p className={record.memo ? "history-entry__memo" : "history-entry__memo history-emtry__memo--empty"}>
                                    {record.memo ?? "No memo"}
                                </p>
                            </li>
                        ))}
                    </ol>
                ) : (
                    <p className="field-dialog__empty">No edits in Rev {revision.order}</p>
                )}
            </section>
        </dialog>
    )
}

export default FieldEditModal