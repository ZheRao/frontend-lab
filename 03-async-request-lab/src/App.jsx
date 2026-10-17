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
  fakeEditClient
} from './fakeClientService.js'


const clients_init = [
  {id: 1, name: 'Farm A', modified_by: 'Alex'},
  {id: 2, name: 'Farm B', modified_by: 'Bob'}
]

function App() {
  // states
  const [clients, setClients] = useState(clients_init)
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

  // helpers
  const canStartRequest = (request==='idle' && error===null)
  const canEnterAction = (workflow==='view' && canStartRequest)
  const canExit = (request==='idle' && error===null)

  // sync reference
  const requestLock = useRef(false) // prevent duplicated submission
  const requestGeneration = useRef(0) // ignored resolves/rejects of user chosen no-op promise 

  // effects
  //  disable 'Esc' while pending
  useEffect(() => {
      if (!isPending) return 
      const blockEscape = (event) => {
          if (event.key==='Escape') event.preventDefault()
      }
      document.addEventListener('keydown', blockEscape, true)
      return () => document.removeEventListener('keydown', blockEscape, true)
  }, [isPending])
  // 5 seconds waiting counter
  useEffect(() => {
    if (request !== 'pending') return
    const timer = setTimeout(()=>{
      setIsWaitingLong(true)
    }, 5000)
    return () => clearTimeout(timer)
  }, [request, observationRound])

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
    // implement auto refresh here, so every time an action canceled, list is refreshed
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
  const simulateLocalUpdate = (operation, payload) => {
    if (operation==='add') {
      setClients((prev) => [...prev, payload])
    } else if (operation==='delete') {
      setClients((prev)=>(
        prev.filter((client)=>(client.id!==payload.id))
      ))
    } else if (operation==='edit') {
      setClients((prev) => (
        prev.map((client)=>(
          client.id===payload.id 
          ? {...client, name:payload.name, modified_by:payload.modified_by} 
          : client
        ))
      ))
    }
  }

  const abortRequest = () => {
    requestGeneration.current++   // later when promise resolves/reject, ignore
    requestLock.current = false   // release the concurrent-submission lock
    setRequest('idle')
    resetWorkflow()
    // perform refresh
  }

  const runWrite = async (action) => {
    const myGeneration = ++requestGeneration.current    // if current request is aborted by user, ignore returned result/error later
    setIsWaitingLong(false) // switched into ture every period, triggering options to keep waiting or abort
    setObservationRound(0)  // start the timer

    setRequest('pending')    // officially mark request pending

    try {
      requestLock.current = true  // issue duplication-preventing lock
      const result = await action()   // submit request
      if (myGeneration !== requestGeneration.current) return // ignore aborted request results
      requestSucceed()    // mark reqest 'succeeded' (triger success dialog) then reset workflow
      // should refresh client next
      simulateLocalUpdate(workflow, result)
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
    // refresh list of clients next
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

      <ClientList 
        clients={clients}
        onEdit={enterEdit}
        onDelete={enterDelete}
      />

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

      <PendingDialog open={request === 'pending'} label="Processing...">
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
              onClick={()=>{abortRequest}}
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
      />


    </section>
  )

}

export default App