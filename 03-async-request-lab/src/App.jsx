import { useState, useEffect } from 'react'

import './App.css'
import ClientList from './ClientList.jsx'
import {
  DeleteClientModal,
  ModifyClientModal
} from './Modals.jsx'
import {
  PendingDialog
} from './PendingDialog.jsx'
import ErrorDialog from './ErrorDialog.jsx'


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
  const [request, setRequest] = useState('idle')  // idle | pending
  const isPending = (request==='pending')

  // helpers
  const canStartRequest = (request==='idle' && error===null)
  const canEnterAction = (workflow==='view' && canStartRequest)
  const canExit = (request==='idle' && error===null)

  // sync reference

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

  // methods for entering different workflow modes
  const enterAdd = () => {
    if (!canEnterAction) return   // guard against being called while another workflow is active
    // enter Add operation sets
    //  workflow  -> 'add'
    //  draft     -> ''
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
    if (!canExit) return   // forbit exit workflow while a request is pending
    resetWorkflow()
  }

  const dismissError = () => {
    if (error?.type === 'validation') {
      setDraft((prev)=>({...prev, name: ''}))
    }
    setError(null)
  }

  // methods for submitting requests
  const submitModify = (event) => {
    event.preventDefault()
    if (!canStartRequest) return  // don't request if another request is pending or error is present

    const validationError = validateClientName(draft.name)
    if (validationError) {
      setError(validationError)
      return
    }

    if (workflow==='add') {
      console.log("Adding new client draft set: ", draft.name)
    } else if (workflow==='edit') {
      console.log(`Modifying Client '${selectedClient.name}' to '${draft.name}'`)
    } else {
      console.log('Error in submitting modification, not add nor edit')
    }

    setRequest('pending')
  }

  const confirmDelete = (event) => {
    event.preventDefault()
    if (!canStartRequest) return  // don't request if another request is pending or error is present

    console.log("Deleting client: ", selectedClient?.name)
    setRequest('pending')
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
    console.log("request succeed, closing everything")
    setRequest('idle')
    resetWorkflow()
    // refresh list of clients next
  }

  const requestFailed = () => {
    console.log("request failed, skipped error dialog, returning to edit page")
    setRequest('idle')
    
    setError({
      type: 'retryable',
      title: 'Request Failed',
      message: 'The request was not completed. Please try again'
    })
    

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
        <button type="button" className="btn btn-secondary" onClick={requestSucceed}>
          Simulate success
        </button>
        <button type="button" className="btn btn-danger" onClick={requestFailed}>
          Simulate failure
        </button>
      </PendingDialog>

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