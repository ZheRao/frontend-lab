import { useState, useEffect, useRef } from 'react'

import './App.css'
import ClientList from './ClientList.jsx'
import {
  DeleteClientModal,
  ModifyClientModal
} from './Modals.jsx'
import {
  PendingDialog,
  SuccessDialog,
  NoticeBanner
} from './Dialogs.jsx'
import ErrorDialog from './ErrorDialog.jsx'

import {
  getClients,
  createClient,
  editClient,
  deleteClient
} from './clientApi.js'

import { ApiError } from "./ApiError"

const KNOWN_RECOVERIES = ['return-to-draft', 'return-to-table', 'refresh']

function App() {
  // states
  const [clients, setClients] = useState([])
  const [workflow, setWorkflow] = useState('view') // view | add | edit | delete
  const [draft, setDraft] = useState(null) // includes 'name'
  const [clientId, setClientId] = useState(null)
  const selectedClient = clients.find(
    client => client.id === clientId
  )
  const [error, setError] = useState(null)  // type: validation | retryable | non-retryable | refresh | unknown
                                            // code, title, message, recovery
  const recovery = KNOWN_RECOVERIES.includes(error?.recovery) ? error.recovery : 'refresh'  // make recovery universal
  const [request, setRequest] = useState('idle')  // idle | pending | succeeded
  const isPending = (request==='pending')
  const [isWaitingLong, setIsWaitingLong] = useState(false)
  const [observationRound, setObservationRound] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const isSystemBusy = (request==='pending' || isLoading || error !== null)

  const [notice, setNotice] = useState(null)  // null | {id, title, message}

  // helpers
  const canStartRequest = (request==='idle' && !isSystemBusy)
  const canEnterAction = (workflow==='view' && canStartRequest)
  const canExit = (request==='idle' && error===null && !isLoading)

  // sync reference
  const requestLock = useRef(false) // prevent duplicated submission
  const refreshLock = useRef(false) // prevent duplicated refresh
  const requestGeneration = useRef(0) // ignore resolves/rejects of user chosen no-op promise 

  // effects
  //  initial load
  useEffect(()=>{
    const loadInitial = async () => {
      const refreshResult = await refresh()
      if (refreshResult === "failed") {
        setError({
          type: "refresh",
          code: "REFRESH_ERROR",
          title: "Initial Loading Failed",
          message: "Initial client list failed to load, please refresh again.",
          recovery: "refresh"
        })
      }
    }
    loadInitial() // called instead of returning a promise as cleanup function before the next run or unmount
  }, [])
  //  disable 'Esc' while pending
  useEffect(() => {
      if (!isSystemBusy) return 
      const blockEscape = (event) => {
          if (event.key==='Escape') event.preventDefault()
      }
      document.addEventListener('keydown', blockEscape, true)
      return () => document.removeEventListener('keydown', blockEscape, true)
  }, [isSystemBusy])
  // 5 seconds waiting counter
  useEffect(() => {
    if (request !== 'pending' || isLoading) return
    const timer = setTimeout(()=>{
      setIsWaitingLong(true)
    }, 5000)
    return () => clearTimeout(timer)
  }, [request, observationRound, isLoading])

  // methods for entering different workflow modes
  const enterAdd = () => {
    if (!canEnterAction) return   // guard against being called while another workflow is active
    setDraft({name: ''})
    setWorkflow('add')
  }
  const enterEdit = (client) => {
    if (!canEnterAction) return   // extra safe guard
    setClientId(client.id)
    setDraft({name: client.name})
    setWorkflow('edit')
  }
  const enterDelete = (client) => {
    if (!canEnterAction) return   // extra safe guard
    setClientId(client.id)
    setWorkflow('delete')
  }

  // methods for exiting different workflow modes
  const resetWorkflow = () => {
    setClientId(null)
    setDraft(null)
    setWorkflow('view')
    setError(null)
  }

  const dismissError = () => {
    if (error?.type === 'validation') {
      setDraft((prev)=>({...prev, name: ''}))
    }
    setError(null)
  }

  // methods for submitting requests
  const refresh = async () => {
    if (refreshLock.current) return 'skipped' // prevent duplicated refresh

    refreshLock.current = true
    setIsLoading(true)

    try{
      const results = await getClients()
      setClients(results)
      return 'succeeded'
    } catch(err) {
      return 'failed'
    } finally {
      setIsLoading(false)
      refreshLock.current = false
    } 
  }

  const abortRequest = async () => {
    requestGeneration.current++   // later when promise resolves/reject, ignore
    requestLock.current = false   // release the concurrent-submission lock
    setRequest('idle')
    resetWorkflow()
    // perform refresh
    const refreshResult = await refresh()
    if (refreshResult === "failed") {
      setError({
        type: "refresh",
        code: "REFRESH_ERROR",
        title: "Unable to Refresh Clients",
        message: "The previous operation may still complete. The client list could not be refreshed, so its outcome remains uncertain.",
        recovery: "refresh"
      })
    }
  }

  const runWrite = async (action) => {
    const myGeneration = ++requestGeneration.current    // if current request is aborted by user, ignore returned result/error later
    setIsWaitingLong(false) // switched into ture every period, triggering options to keep waiting or abort
    setObservationRound(0)  // start the timer

    setRequest('pending')    // officially mark request pending

    try {
      requestLock.current = true  // issue duplication-preventing lock
      await action()   // submit request
      if (myGeneration !== requestGeneration.current) {
        setNotice({
          title: "Previous Request Completed",
          message: "An operation you stopped waiting for has since succeeded. Refresh the client list when convenient to see the latest data"
        })
        return
      }
      // request successful => refresh (other place to refresh is when user abort request)
      const refreshResult = await refresh()
      if (myGeneration !== requestGeneration.current) return  // check the request generation again after another async boundary 
      if (refreshResult === "succeeded") {
        requestSucceed()    // mark reqest 'succeeded' (triger success dialog) then reset workflow
      } else {
        requestFailed({
          type: "refresh",
          code: "REFRESH_ERROR",
          title: "Change Succeeded, Refresh Failed",
          message: "Your change was confirmed by the server, but the updated list could not be retrieved.",
          recovery: "refresh"
        })
      }
      
    } catch(err) {
      if (myGeneration !== requestGeneration.current) return // ignore aborted request error
      // set request status back to 'idle' + error dialog 
      if (err instanceof ApiError && err.type === "non-retryable") {
        requestFailed({
          type: "non-retryable",
          code: err.code,
          title: "Request Rejected",
          message: err.message,
          recovery: recoveryForError(err)
        })
      } else {
        requestFailed({
          type: "unknown",
          code: "UNKNOWN_ERROR",
          title: "Operation Outcome Unknown",
          message: "The server may have completed the operation. Refresh before attempting another change.",
          recovery: "refresh"
        })
      }
    } finally {
      // only release the duplicated-request-submission lock when we actually process the result/error
      //  meaning, user didn't abort this request
      if (myGeneration === requestGeneration.current) {
          requestLock.current = false
      }
    }
  }

  const submitModify = async (event) => {
    event.preventDefault()
    // don't start another request if 
    //    another request is pending/succeeded
    //    error is present
    //    duplicated request detected
    if (!canStartRequest || requestLock.current) return
     
    const validationError = validateClientName(draft.name)
    if (validationError) {
      setError(validationError)
      return
    }

    if (workflow==='add') {
      await runWrite(()=>createClient(draft.name))
      
    } else if (workflow==='edit') {
      await runWrite(()=>editClient(clientId, draft.name))
    } else {
      console.log('Error in submitting modification, not add nor edit')
    }
  }

  const confirmDelete = async (event) => {
    event.preventDefault()
    // don't start another request if 
    //    another request is pending/succeeded
    //    error is present
    //    duplicated request detected
    if (!canStartRequest || requestLock.current) return
    await runWrite(() => deleteClient(clientId))
  }

  // methods for validation
  const validateClientName = (name) => {
    return (
      name.trim() === '' 
        ? {type: 'validation', title: 'Invalid Client Name', code: 'INVALID_CLIENT_NAME',
           message: 'Client name cannot consist entirely of whitespace',
          recovery: 'return-to-draft'}
        : null
    )
  }

  // methods for routing request success/failure behavior
  const requestSucceed = () => {
    setRequest('succeeded')
    resetWorkflow()
  }

  const requestFailed = ({ type, code, title, message, recovery }) => {
    setRequest('idle')
    setError({type, code, title, message, recovery})
  }

  // error handling
  function recoveryForError(err) {
    if (!(err instanceof ApiError)) return "refresh"

    switch (err.code) {
      case "INVALID_CLIENT_NAME":
      case "DUPLICATE_CLIENT":
        return "return-to-draft"
      
      case "CLIENT_REFERENCED":
        return "return-to-table"

      case "CLIENT_NOT_FOUND":
      default:
        return "refresh"
    }
  }

  const handleErrorRecovery = async () => {
    if (!error) return 

    if (recovery!==error.recovery) {
        setError({
          type: "unknown",
          code: "UNKNOWN",
          title: "Unknown Error Occurred",
          message: `An error without valid recovery option has occurred, please contact system admin with this error code: ${error.code}`,
          recovery: "refresh"
      })
      return
    }

    if (recovery === "return-to-draft") {
      dismissError()
    } else if (recovery === "return-to-table") {
      resetWorkflow()
    } else if (recovery === "refresh") {
      resetWorkflow()
      const refreshResult = await refresh()

      if (refreshResult === "failed") {
        setError({
          type: "refresh",
          code: "REFRESH_ERROR",
          title: "Refresh Failed",
          message: "The client list could not be retrieved. Please try refreshing again.",
          recovery: "refresh"
        })
      }
    }
  }
  

  return (
    <section className="card">
      <header className="row">
        <div className="stack">
          <h2 className="title">CLIENTS</h2>
          <p className="subtitle">GrowLytics Management Portal</p>
        </div>
        <button className="btn btn-primary"
          onClick={enterAdd}
        >
          Add New Client
        </button>
      </header>

      <div className="pill" aria-hidden="true" />

      {isLoading ? (
        <PendingDialog open={isLoading} label="Loading Clients..." />
      ) : (
        <ClientList 
          clients={clients}
          onEdit={enterEdit}
          onDelete={enterDelete}
        />
      )}

      <ModifyClientModal 
        open={(workflow==='add') || (workflow==='edit')}
        title={workflow==='add' ? 'Add New Client' : 'Edit Client'}
        draft={draft}
        setDraft={setDraft}
        onSave={submitModify}
        onClose={resetWorkflow}
        isPending={isPending}
      />

      <DeleteClientModal 
        open={workflow==='delete'}
        client_name={selectedClient?.name ?? ''}
        onConfirm={confirmDelete}
        onClose={resetWorkflow}
        isPending={isPending}
      />

      <PendingDialog open={(request === 'pending' && !isLoading)} label="Processing...">
        {isWaitingLong && (
          <>
            <div className="actions">
              <button type="button" className="btn btn-secondary" 
                onClick={()=>{
                  setIsWaitingLong(false);setObservationRound((prev)=>prev+1)
                }}
              >
                Keep Waiting
              </button>
              <button type="button" className="btn btn-danger"
                onClick={abortRequest}
              >
                Stop Waiting & Refresh
              </button>
            </div>
            <p className="pending-hint">
              Stopping does not cancel the operation. It may still complete on the server. If this page receives confirmation later, you'll be notified.
            </p>
          </>
        )}
      </PendingDialog>

      <SuccessDialog
        open={request==='succeeded'}
        message="Request Succeeded!"
        onDone={()=>setRequest('idle')}
        duration={1000}
      />

      <ErrorDialog
        open={error !== null}
        title={error?.title}
        message={error?.message}
        actionLabel={recovery==='refresh' ? 'Refresh Client List' : 'Close'}
        onAction={handleErrorRecovery}
      />

      <NoticeBanner 
        notice={notice}
        onDone={()=>setNotice(null)}
      />
    </section>
  )

}

export default App