// features/crop-plan/Overview.jsx

import { useState, useRef, useEffect } from 'react'
import { useSearchParams, } from 'react-router'

import {
    urlStates,
    resolver
} from './helpers.js'

// import { 
//     getCropPlan,
//     createRecord
// } from './fakeApi.js'

import {
    getCropPlan,
    createCropPlan,
    getCropPlanCategory
} from './cropPlanApi.js'

import CropCard from './CropCard.jsx'

import './CropPlan.css'

import { 
    PendingDialog,
    SuccessDialog,
} from '../../Dialogs.jsx'

import ErrorDialog from '../../ErrorDialog.jsx'

import FieldEditModal from './FieldEditModal.jsx'

import { getClients } from '../clients/clientApi.js'
import { getCrops } from '../crops/cropsApi.js'
import { getRevisions } from '../revisions/revisionsApi.js'
import { getForecastYears } from '../forecast-years/forecastYearsApi.js'

import { ApiError } from '../../ApiError.js'

const KNOWN_RECOVERIES = ['refresh', 'return-to-edit', 'refresh-catalog'] // 'refresh'- for field editor: close error + field editor + refresh, reset edit context
                                            // 'return-to-edit'- close error and return to field editor, draft/context preserved
                                            // 'refresh-catalog' - no UI state at all, refresh catalog to start crop plan UI

const CATALOG_REFRESH_FAILURE_ERROR = {
    type: "refresh",
    code: "REFRESH_ERROR",
    title: "Crop Plan Failed to Initialize",
    message: "Crop Plan configuration system cannot be initialized because of failing to retrieve data catalogs such as clients' record, crop plan categories, etc. Please try reloading again.",
    recovery: "refresh-catalog"
}

const REFRESH_FAILURE_ERROR = {
    type: "refresh",
    code: "REFRESH_ERROR",
    title: "Crop Plan Failed to Load",
    message: "The selected client's crop plan retrieval failed. Please try reloading again.",
    recovery: "refresh"
}
const UNKNOWN_ERROR = {
    type: "unknown",
    code: "UNKNOWN_ERROR",
    title: "Operation Outcome Unknown",
    message: "The server may have completed the operation. Refresh before attempting another change.",
    recovery: "refresh"
}

function Overview() {
    // sync reference
    const requestLock = useRef(false)   // prevent duplicated mutation request
    const requestNum = useRef(0)        // identify stale requests
    const readNum = useRef(0)           // identify stale reads
    const catalogReadNum = useRef(0)    // identify stale catalog read

    // states
    //  catalog state
    const [catalog, setCatalog] = useState({
        status: 'loading',   // 'loading' | 'ready' | 'error'
        clients: [],
        crops: [],
        revisions: [],
        categories: [],
        forecast_years: []
    })
    const forecastYears = catalog.forecast_years.map((year)=>(year.forecast_year))
    //  crop plan data
    const [loadedPlan, setLoadedPlan] = useState(null)  // { clientId, forecastYear, rows }
    //  system state
    const [sysState, setSysState] = useState('idle') // "loading" | "pending" | "success" | "idle"
    //  error state
    const [error, setError] = useState(null)    // { type, code, title, message, recovery }
    const recovery = KNOWN_RECOVERIES.includes(error?.recovery) ? error.recovery : 'refresh'    // make refresh the default recovery
    const isSystemBusy = (sysState === "loading" || sysState === "pending" || error !== null || catalog.status !== 'ready')
    //  notice state
    const [notice, setNotice] = useState(null)  // { id, title, message }

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

    // determine validity of the parameters
    const extractIds = (list) => {
        return list.map((item) => (item.id))
    }
    const validClientId = extractIds(catalog.clients)       // list of Numbers
    const validRevisionId = extractIds(catalog.revisions)   // list of Numbers
    const currentUrlState = urlStates({
        rawClientId: clientId,
        clientList: validClientId,
        rawForecastYear: forecastYear,
        yearList: forecastYears,
        rawRevisionId: revisionId,
        revisionList: validRevisionId
    })

    // effects
    //  initial load of catalog data
    useEffect(() => {
        const initialLoad = async () => {
            const result = await refreshCatalog()
            if (result === 'failed') {
                setError(CATALOG_REFRESH_FAILURE_ERROR)
            }
        }
        initialLoad()
    }, [])

    //  loading new crop plan data once catalog data has been fetched
    useEffect(() => {
        if (catalog.status !== 'ready') return  //if catalog hasn't been successfully fetched, don't start crop plan data refresh
        if (!clientId || !forecastYear) return 

        const load = async () => {
            const result = await refresh()
            
            if (result === 'failed') {
                setError(REFRESH_FAILURE_ERROR)
            }
        }
        load()
    }, [catalog.status, clientId, forecastYear])

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
    const refreshCatalog = async () => {
        const currentReadNum = ++catalogReadNum.current 
        setCatalog((prev) => ({
            ...prev,
            status: 'loading'
        }))

        try {
            const [clients, categories, revisions, crops, forecast_years] = await Promise.all([
                getClients(),
                getCropPlanCategory(),
                getRevisions(),
                getCrops(),
                getForecastYears()
            ])

            if (currentReadNum === catalogReadNum.current) {
                setCatalog((prev) => ({
                    ...prev, 
                    status:'ready', 
                    clients: clients, 
                    categories: categories,
                    crops: crops,
                    revisions: revisions,
                    forecast_years: forecast_years
                }))
                return 'succeeded'
            } else {
                return 'stale'
            }

        } catch (err) {
            if (currentReadNum === catalogReadNum.current) {
                setCatalog((prev) => ({
                    ...prev,
                    status: 'error'
                }))
                return 'failed'
            }
            return 'stale'
        }
    }

    const refresh = async ({ partOfWrite = false } = {}) => {
        const currentRead = ++readNum.current
        setEditContext(null)    // when refreshing, always reset edit context for field editor
        setDraftCrop(null)  // when refreshing, always reset drop crop into null
        if (!partOfWrite) {
            // if this refresh is part of mutation, the system is already in 'pending', no need to set it to 'loading'
            setSysState('loading')
        }
        try {
            const rows = await getCropPlan(clientId, forecastYear)
            if (currentRead === readNum.current) {
                setLoadedPlan({
                    clientId,
                    forecastYear,
                    rows
                })
                return 'succeeded'
            }
            return 'stale'
        } catch (err) {
            if (currentRead !== readNum.current) return 'stale'
            return 'failed'
        } finally {
            if (!partOfWrite && currentRead === readNum.current) {
                // if this is part of mutation, the state will be set to 'success', so shouldn't set it to 'idle'
                setSysState('idle') // if there's error, system is still busy because error !== null, reset system state to idle
            }
            
        }
    }

    const runWrite = async (action) => {
        if (sysState !== 'idle' || isSystemBusy || requestLock.current) return // safeguard against when system is not ready for a mutation
        // prepare system states
        requestLock.current = true  // handled in finally
        setSysState('pending')  // handled in try/catch branches, not in finally, as it requires different states
        const currentRequestNum = ++requestNum.current

        // sending request
        try {
            const result = await action()

            // if this result is stale
            if (currentRequestNum !== requestNum.current) {
                setNotice({
                    title: "Previous Request Completed",
                    message: "An operation you stopped waiting for has since succeeded. Refresh the crop plan page when convenient to see the latest data"
                })
                return 
            }

            // refresh the crop plan data
            const refreshResult = await refresh({ partOfWrite: true })
            if (currentRequestNum !== requestNum.current) return    // if the request become stale during refresh, ignore

            if (refreshResult === 'succeeded') {
                setSysState('success')
                // onDone of success dialog need to set sys state back to 'idle'
            } else if (refreshResult === 'stale') {
                setSysState((current) => current==="pending" ? "idle" : current)    // clear writer's pending, but if the system is under another loading, leave it along
                return
            } else {
                setSysState('idle')
                setError({
                    type: "refresh",
                    code: "REFRESH_ERROR",
                    title: "Change Succeeded, Refresh Failed",
                    message: "Your change was confirmed by the server, but the updated list could not be retrieved.",
                    recovery: "refresh"
                })
            }

        } catch(err) {
            // set error and use recovery classifier to determine recovery if the result is not stale
            if (currentRequestNum !== requestNum.current) return 
            setSysState('idle')
            if (err instanceof ApiError && err.type === "non-retryable") {
                setError({
                    type: "non-retryable",
                    code: err.code,
                    title: "Request Rejected",
                    message: err.message,
                    recovery: "return-to-edit"
                })
            } else {
                setError(UNKNOWN_ERROR)
            }
        } finally {
            // reset request lock only if this request is not stale
            if (currentRequestNum === requestNum.current) {
                requestLock.current = false
            }
        }
    }

    // resolve raw data
    const data = matchesCropPlanContext ? loadedPlan.rows : []
    const resolvedData = currentUrlState !== 'valid' || !matchesCropPlanContext ? {} : resolver(data, Number(revisionId), catalog.revisions, catalog.categories)
    const existingCrops = Object.keys(resolvedData)
    const cropCandidates = catalog.crops.filter((crop)=>(!existingCrops.includes(String(crop.id))))
    // look up values for eidting
    const editingCrop = editContext === null ? undefined : catalog.crops.find((crop)=>(crop.id===editContext.cropId))
    const editingCategory = editContext === null ? undefined : catalog.categories.find((cat)=>(cat.key===editContext.categoryKey))
    const editingField = editContext === null ? undefined : resolvedData[editContext.cropId]?.[editingCategory.key]

    // transform catelog data
    const sortedRevisions = [...catalog.revisions].sort((a,b )=> a.revision_order - b.revision_order)

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

        // close error dialog
        setError(null)

        // if recover requires refresh, execute refresh
        if (recovery === "refresh") {
            const result = await refresh()

            if (result === 'failed') {
                setError(REFRESH_FAILURE_ERROR)
            }
        } else if (recovery === 'refresh-catalog') {
            const result = await refreshCatalog()

            if (result === 'failed') {
                setError(CATALOG_REFRESH_FAILURE_ERROR)
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


    const handleFieldSubmit = async ({ clientId, forecastYear, cropId, revisionId, categoryKey, value, memo, }) => {
        if (sysState !== 'idle' || isSystemBusy || requestLock.current) return // safeguard against when system is not ready for a mutation

        // validate 'value' input
        if (value.trim() === '') {
            setError({
                type: "validation", 
                title: "Invalid Value", 
                code: "INVALID_VALUE",
                message: "Value cannot be missing or consist entirely of whitespace",
                recovery: "return-to-edit"
            })
            return
        } 

        const valueConverted = Number(value)

        if (!Number.isFinite(valueConverted)) {
            setError({
                type: "validation", 
                title: "Invalid Value", 
                code: "INVALID_VALUE",
                message: "Value must be numeric",
                recovery: "return-to-edit"
            })
            return
        } else if (valueConverted < 0) {
            setError({
                type: "validation", 
                title: "Invalid Value", 
                code: "INVALID_VALUE",
                message: "Value must be non-negative",
                recovery: "return-to-edit"
            })
            return
        }

        await runWrite(() => createCropPlan({
            clientId,
            forecastYear,
            cropId,
            revisionId,
            categoryKey,
            value: valueConverted,
            memo
        }))

    }
    

    return (
        <div>
            {catalog.status !== 'ready' ? (
                <div>
                    <PendingDialog 
                        open={catalog.status==='loading'}
                        label='Initializing ...'
                    />
                    <ErrorDialog
                        open={error !== null}
                        title={error?.title}
                        message={error?.message}
                        actionLabel='re-initialize'
                        onAction={handleErrorRecovery}
                    />
                </div>
            ) : (
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
                                        {catalog.clients.map((client) => (
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
                                            ? sortedRevisions.filter((rev) => rev.revision_order === 1)
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
                                                    {rev.revision_order} · {rev.name}
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
                                                <CropCard key={draftCrop.cropId} categories={catalog.categories} onFieldSelect={handleFieldSelect} fields={{}}
                                                    crop={catalog.crops.find((crop)=>(crop.id===draftCrop.cropId))}
                                                />
                                            )}
                                            {Object.entries(resolvedData).map(([cropId, fields]) => {
                                                const crop = catalog.crops.find((crop) => crop.id === Number(cropId))
                                                return <CropCard key={cropId} crop={crop} fields={fields} categories={catalog.categories} onFieldSelect={handleFieldSelect} />
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
                            onModalClose={() => setEditContext(null)}
                            onRequestSubmit={handleFieldSubmit}
                            contextKey={editContext.contextKey}
                            crop={editingCrop}
                            catInfo={editingCategory}
                            fieldInfo={editingField}
                            isBusy={isSystemBusy}
                            allClients={catalog.clients}
                            allRevisions={catalog.revisions}
                        />
                    )}

                    {/* dialogs: pending, success, error */}
                    <PendingDialog
                        open={sysState==='pending'}
                        label="Processing ..."
                    />

                    <SuccessDialog
                        open={sysState === 'success'}
                        message='Request Succeeded!'
                        onDone={()=>setSysState('idle')}
                        duration={1000}
                    />

                    <ErrorDialog
                        open={error !== null}
                        title={error?.title}
                        message={error?.message}
                        actionLabel={error?.recovery==='refresh' ? 'Refresh Crop Plan Data' : 'Close'}
                        onAction={handleErrorRecovery}
                    />
                </div>
                )}
            </div>
    )
}

export default Overview