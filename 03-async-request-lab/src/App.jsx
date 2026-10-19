import { useState, useEffect, useRef } from 'react'

import './App.css'
import ClientList from './ClientList.jsx'
import {
  DeleteClientModal,
  ModifyClientModal
} from './Modals.jsx'
import {
  PendingDialog,
  SuccessDialog
} from './Dialogs.jsx'
import ErrorDialog from './ErrorDialog.jsx'

import {
  fakeCreateClient,
  fakeDeleteClient,
  fakeEditClient,
  fakeGetClient
} from './fakeClientService.js'



function App() {
  // states
  const [clients, setClients] = useState([])
  const [workflow, setWorkflow] = useState('view') // view | add | edit | delete
  const [draft, setDraft] = useState(null) // includes 'name'
  const [clientId, setClientId] = useState(null)
  const selectedClient = clients.find(
    client => client.id === clientId
  )
  const [error, setError] = useState(null)  // type: validation | retryable | non-retryable
                                            // title, message
  const [request, setRequest] = useState('idle')  // idle | pending | succeeded
  const isPending = (request==='pending')
  const [isWaitingLong, setIsWaitingLong] = useState(false)
  const [observationRound, setObservationRound] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const isSystemBusy = (request==='pending' || isLoading || error !== null)

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
    refresh(true)
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

  const exitWorkflow = () => {
    // check disabled, because dialog will be closed nontherless, let state stay in line
    // if (!canExit) return   // forbit exit workflow while a request is pending
    resetWorkflow()
  }

  const dismissError = () => {
    if (error?.type === 'validation') {
      setDraft((prev)=>({...prev, name: ''}))
    }
    setError(null)
  }

  // methods for submitting requests
  const refresh = async (initial=false) => {
    if (refreshLock.current) return // prevent duplicated refresh
    setIsLoading(true)
    try{
      refreshLock.current = true
      const results = await fakeGetClient()
      setClients(results)
      return true
    } catch(err) {
      if (initial) {
        setError({
          type: "non-retryable",
          title: "Refresh Failed",
          message: "Clients cannot be retrieved, please refresh the browser manually"
        })
      } else {
        setError({
          type: "non-retryable",
          title: "Modification succeeded, but refresh failed",
          message: "Your change was accepted by the server, but the updated client list could not be retrieved. Please refresh your browser manually. Do not submit the same modification again"
        })
      }
      return false
    } finally {
      setIsLoading(false)
      refreshLock.current = false
    } 
  }

  const abortRequest = () => {
    requestGeneration.current++   // later when promise resolves/reject, ignore
    requestLock.current = false   // release the concurrent-submission lock
    setRequest('idle')
    resetWorkflow()
    // perform refresh
    refresh()
  }

  const runWrite = async (action) => {
    const myGeneration = ++requestGeneration.current    // if current request is aborted by user, ignore returned result/error later
    setIsWaitingLong(false) // switched into ture every period, triggering options to keep waiting or abort
    setObservationRound(0)  // start the timer

    setRequest('pending')    // officially mark request pending

    try {
      requestLock.current = true  // issue duplication-preventing lock
      await action()   // submit request
      if (myGeneration !== requestGeneration.current) return // ignore aborted request results
      // request successful => refresh (other place to refresh is when user abort request)
      const refreshSucceeded = await refresh()
      if (myGeneration !== requestGeneration.current) return // check the request generation again after another async boundary
      if (refreshSucceeded) {
        // if refresh failed, refresh has already set a blocking error
        requestSucceed()    // mark reqest 'succeeded' (triger success dialog) then reset workflow
      } else {
        setRequest('idle')
      }
      
    } catch(err) {
      if (myGeneration !== requestGeneration.current) return // ignore aborted request error
      // set request status back to 'idle' + error dialog 
      requestFailed({
          type: "retryable",
          title: "Request Failed",
          message: err.message
      })
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
      await runWrite(()=>fakeCreateClient(draft.name))
      
    } else if (workflow==='edit') {
      await runWrite(()=>fakeEditClient(clientId, selectedClient.name, draft.name))
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
    await runWrite(() => fakeDeleteClient(clientId, selectedClient.name))
  }

  // methods for validation
  const validateClientName = (name) => {
    return (
      name.trim() === '' 
        ? {type: 'validation', title: 'Invalid Client Name',
           message: 'Client name cannot consist entirely of whitespace'}
        : null
    )
  }

  // methods for routing request success/failure behavior
  const requestSucceed = () => {
    setRequest('succeeded')
    resetWorkflow()
  }

  const requestFailed = ({type, title, message}) => {
    setRequest('idle')
    setError({type, title, message})
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
        onClose={exitWorkflow}
        isPending={isPending}
      />

      <DeleteClientModal 
        open={workflow==='delete'}
        client_name={selectedClient?.name ?? ''}
        onConfirm={confirmDelete}
        onClose={exitWorkflow}
        isPending={isPending}
      />

      <PendingDialog open={(request === 'pending' && !isLoading)} label="Processing...">
        {isWaitingLong && (
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
        onClose={dismissError}
        showClose={error?.type!=='non-retryable'}
      />
    </section>
  )

}

export default App