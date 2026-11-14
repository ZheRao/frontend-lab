// features/crop-plan/Overview.jsx

import { useState, useRef, useEffect } from 'react'
import { useSearchParams, } from 'react-router'
import { 
    clients,
    revisions,
    categories,
    crops
} from './sampleData.js'

import {
    urlStates,
    resolver
} from './helpers.js'

import { 
    getCropPlan
} from './fakeApi.js'

import CropCard from './CropCard.jsx'
import './CropPlan.css'

import { 
    PendingDialog,
    SuccessDialog,
    NoticeBanner, 
} from '../../Dialogs.jsx'

import ErrorDialog from '../../ErrorDialog.jsx'

import FieldEditModal from './FieldEditModal.jsx'

const KNOWN_RECOVERIES = ['refresh']
const REFRESH_FAILURE_ERROR = {
    type: "refresh",
    code: "REFRESH_ERROR",
    title: "Crop Plan Failed to Load",
    message: "The selected client's crop plan retrieval failed. Please try reloading again.",
    recovery: "refresh"
}

function Overview() {
    const forecastYears = [ 2026, 2027, 2028, 2029 ]  // list of Numbers, accepted limitation: hard coded forecast year, later maybe a separate year table?

    // states
    //  crop plan data
    const [loadedPlan, setLoadedPlan] = useState(null)  // { clientId, forecastYear, rows }
    //  system state
    const [sysState, setSysState] = useState('idle') // "loading" | "pending" | "success" | "idle"
    //  error state
    const [error, setError] = useState(null)    // { type, code, title, message, recovery }
    const recovery = KNOWN_RECOVERIES.includes(error?.recovery) ? error.recovery : 'refresh'    // make refresh the default recovery
    const isSystemBusy = (sysState === "loading" || sysState === "pending" || error !== null)

    const [searchParams, setSearchParams] = useSearchParams()

    // read URL state
    const clientId = searchParams.get("client")         //  string, event.target.value is string, URL components get string, here extraction gets string
    const forecastYear = searchParams.get("year")       //  string, event.target.value is string, URL components get string, here extraction gets string
    const revisionId = searchParams.get("revision")     //  string, event.target.value is string, URL components get string, here extraction gets string


    // field editor context: does the field user requested to edit match the current context? is it consistent to go ahead to enable edit?
    const subContextKey = `${clientId}|${forecastYear}` // partial context, client, year only
    const contextKey = `${clientId}|${forecastYear}|${revisionId}`  // full context, client, year, revision
    const [editContext, setEditContext] = useState(null)    // on click, setEditContext({ contextkey, cropId, categoryKey })
    const canOpenEditDialog = editContext !== null && editContext.contextKey === contextKey

    // loaded crop plan context: should the crop plan being loaded? does loaded crop plan match the current URL?
    const matchesCropPlanContext = 
        loadedPlan?.clientId === clientId && 
        loadedPlan?.forecastYear === forecastYear 

    // adding crop
    //  start crop draft always set revision to 1 globally, changing revision deletes the draft, so you cannot directly add rev2 for a new crop, everything starts from rev1
    const [draftCrop, setDraftCrop] =  useState(null)   //  { subContextKey, cropId }
    const visibleDraftCropId = 
        draftCrop !== null && 
        draftCrop.subContextKey === subContextKey && 
        revisionId === "1"
        ? draftCrop.cropId 
        : null

    const startCropEdit = (id) => {
        setDraftCrop({
            subContextKey,
            cropId: id
        })
    }

    // sync reference
    const refreshLock = useRef(false)   // prevent duplicated refresh

    // determine validity of the parameters
    const extractIds = (list) => {
        return list.map((item) => (item.id))
    }
    const validClientId = extractIds(clients)       // list of Numbers
    const validRevisionId = extractIds(revisions)   // list of Numbers
    const currentUrlState = urlStates({
        rawClientId: clientId,
        clientList: validClientId,
        rawForecastYear: forecastYear,
        yearList: forecastYears,
        rawRevisionId: revisionId,
        revisionList: validRevisionId
    })

    // effects
    //  loading new crop plan data
    useEffect(() => {
        if (!clientId || !forecastYear) return 

        const load = async () => {
            const result = await refresh()
            
            if (result === 'failed') {
                setError(REFRESH_FAILURE_ERROR)
            }
        }
        load()
    }, [clientId, forecastYear])

    //  disable 'Esc' while system busy
    useEffect(()=>{
        if (!isSystemBusy) return 
        const blockEscape = (event) => {
            if (event.key==='Escape') event.preventDefault()
        }
        document.addEventListener('keydown', blockEscape, true)
        return () => document.removeEventListener('keydown', blockEscape, true)
    }, [isSystemBusy])

    // async functions
    const refresh = async () => {
        if (refreshLock.current) return 'skipped'
        setSysState('loading')
        refreshLock.current = true
        try {
            const rows = await getCropPlan(clientId, forecastYear)
            setLoadedPlan({
                clientId,
                forecastYear,
                rows
            })
            return 'succeed'
        } catch (err) {
            return 'failed'
        } finally {
            refreshLock.current = false
            setSysState('idle') // if there's error, system is still busy because error !== null, reset system state to idle
            
        }
    }

    // resolve raw data
    const data = matchesCropPlanContext ? loadedPlan.rows : []
    const resolvedData = currentUrlState !== 'valid' || !matchesCropPlanContext ? {} : resolver(data, Number(revisionId), revisions, categories)
    const existingCrops = Object.keys(resolvedData)
    const cropCandidates = crops.filter((crop)=>(!existingCrops.includes(String(crop.id))))
    // look up values for eidting
    const editingCrop = editContext === null ? undefined : crops.find((crop)=>(crop.id===editContext.cropId))
    const editingCategory = editContext === null ? undefined : categories.find((cat)=>(cat.key===editContext.categoryKey))
    const editingField = editContext === null ? undefined : resolvedData[editContext.cropId]?.[editingCategory.key]

    // transform catelog data
    const sortedRevisions = [...revisions].sort((a,b )=> a.order - b.order)

    // error handling
    const handleErrorRecovery = async () => {
        if (error === null) return 

        if (recovery !== error.recovery) {
            setError({
                type: "unknown",
                code: "UNKNOWN",
                title: "Unknown Error Occurred",
                message: `An error without valid recovery option has occurred, please contact system admin with this error code: ${error.code}`,
                recovery: "refresh"
            })
            return
        }

        setError(null)
        if (recovery === "refresh") {
            const result = await refresh()

            if (result === 'failed') {
                setError(REFRESH_FAILURE_ERROR)
            }
        }
    }


    // helpers
    //  update URL parameter
    const updateContext = (key, value) => {
        const next = new URLSearchParams(searchParams)

        next.set(key, value)
        if (key === "client" || key === "year") {
            next.delete("revision")
            setDraftCrop(null)

            if (next.get("year") && next.get("client")) {
                next.set("revision", "1")
            }
        }

        setSearchParams(next)
    }

    const handleFieldSelect = (crop, catInfo) => {
        setEditContext({
            contextKey,
            cropId: crop.id,
            categoryKey: catInfo.key
        })
    }

    const closeFieldEditor = () => {
        setEditContext(null)
    }

    const handleFieldSubmit = ({ clientId, forecastYear, cropId, revisionId, categoryKey, value, createdBy, memo, }) => {
        console.log(`meta data: client: ${clientId}, forecastYear: ${forecastYear}`)
        console.log(`record {cropId: ${cropId}, revisionId: ${revisionId}, categoryKey: ${categoryKey}, value: ${Number(value)}, memo: ${memo}}`)
    }
    

    return (
        <div className="crop-plan">
            {/* headers */}
            <header className="crop-plan__header">
                <h1 className="crop-plan__title">Crop Plan Configuration</h1>
                <p className="crop-plan__subtitle">Forecast inputs by client and year</p>
            </header>

            {/* client/year selection, revision, crop cards  */}
            <div className="workspace">
                <section className="context" aria-label="Plan context">
                    {/* client/year selector  */}
                    <div className="context__selectors">
                        <div className="control">
                            <label htmlFor="client" className="control__label">Client</label>
                            <select 
                                id="client"
                                className="control__select"
                                value={clientId ?? ""} 
                                onChange={(event) => updateContext("client", event.target.value)}
                            >
                                <option value="" disabled>Please select a client</option>
                                {clients.map((client) => (
                                    <option 
                                        key={client.id}
                                        value={String(client.id)}
                                    >
                                        {client.name}
                                    </option>
                                ))}
                            </select>                        
                        </div>

                        <div className="control">
                            <label htmlFor="year" className="control__label">Forecast year</label>
                            <select 
                                id="year"
                                className="control__select"
                                value={forecastYear ?? ""} 
                                onChange={(event) => updateContext("year", event.target.value)}
                            >
                                <option value="" disabled>Please select a forecast year</option>
                                {forecastYears.map((year) => (
                                    <option key={year} value={String(year)}>{year}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* revision selector */}
                    {currentUrlState === 'valid' && (
                        <div className="control">
                            <div className="control__label-row">
                                <span className="control__label" id="revision-label">Revision</span>
                                <p className="legend">
                                    <span className="indicator indicator--local" aria-hidden="true" /> Saved in this revision
                                    <span className="indicator indicator--inherited" aria-hidden="true" /> Inherited
                                </p>
                            </div>
                            <div className="revision-group" role="group" aria-labelledby='revision-label'>
                                {(Object.keys(resolvedData).length === 0 
                                    ? sortedRevisions.filter((rev) => rev.order === 1)
                                    : sortedRevisions
                                ).map((rev) => {
                                    const isSelected = String(rev.id) === revisionId 
                                    return (
                                        <button 
                                            key={rev.id}
                                            type="button"
                                            className={isSelected ? "revision-button revision-button--selected" : "revision-button"}
                                            aria-pressed={isSelected}
                                            onClick={()=>{
                                                updateContext("revision", String(rev.id))
                                            }}
                                        >
                                            {rev.order} · {rev.name}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </section>

                {/* render appropriate state and/or crop cards */}
                {currentUrlState === 'partial' ? (
                        <p className="workspace__message">Select a client and a forecast year to see its crop plan.</p>
                    ) : currentUrlState === 'invalid' ? (
                        <p className="workspace__message">This link doesn't match a known client, year, or revision. Choose them again above.</p>
                    ) : sysState === 'loading' ? (
                        // loading
                        <PendingDialog
                            open={sysState === 'loading'}
                            label='Loading Crop Plan ...'
                        />
                    ) : (
                        <section className="crops" aria-labelledby="crops-title">
                            <div className="crops__header">
                                <h2 id="crops-title" className="crops__title">Crops</h2>
                                <select 
                                    id="crop"
                                    className="btn btn-secondary add-crop"
                                    value=""
                                    onChange={(event)=>{
                                        updateContext("revision", "1")  // reset revision to 1, so draft always starts from revision 1
                                        startCropEdit(Number(event.target.value))
                                    }}
                                    aria-label="Add crop"
                                >
                                    <option value="" disabled> + Add crop</option>
                                    {cropCandidates.map((crop) => (
                                        <option
                                            key={crop.id}
                                            value={String(crop.id)}
                                        >
                                            {crop.name}
                                        </option>
                                    ))}
                                </select>   
                            </div>

                            {Object.keys(resolvedData).length === 0  && visibleDraftCropId===null ? (
                                <p className="workspace__message">No crops configured for this year yet.</p>
                            ) : (
                                <div className="crops__list">
                                    {visibleDraftCropId && (
                                        <CropCard key={draftCrop.cropId} categories={categories} onFieldSelect={handleFieldSelect} fields={{}}
                                            crop={crops.find((crop)=>(crop.id===draftCrop.cropId))}
                                        />
                                    )}
                                    {Object.entries(resolvedData).map(([cropId, fields]) => {
                                        const crop = crops.find((crop) => crop.id === Number(cropId))
                                        return <CropCard key={cropId} crop={crop} fields={fields} categories={categories} onFieldSelect={handleFieldSelect} />
                                    })}
                                </div>
                                
                            )}
                        </section>
                    )
                }
            </div>

            {/* field editor  */}
            {canOpenEditDialog && (
                <FieldEditModal 
                    open={canOpenEditDialog}
                    onModalClose={closeFieldEditor}
                    onRequestSubmit={handleFieldSubmit}
                    contextKey={editContext.contextKey}
                    crop={editingCrop}
                    catInfo={editingCategory}
                    fieldInfo={editingField}
                />
            )}

            {/* dialogs: pending, success, error */}
            <ErrorDialog
                open={error !== null}
                title={error?.title}
                message={error?.message}
                actionLabel={error?.recovery==='refresh' ? 'Refresh Crop Plan Data' : 'Close'}
                onAction={handleErrorRecovery}
            />
        </div>
    )
}

export default Overview