import { useState } from 'react'

import './App.css'
import ClientList from './ClientList.jsx'
import {
  DeleteClientModal,
  ModifyClientModal
} from './Modals.jsx'
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
  const [error, setError] = useState(null)  // type: validation | retryable | non-retryable
                                            // title, message

  // sync reference

  // effects

  // methods for entering different workflow modes
  const enterAdd = () => {
    if (workflow !== 'view') return   // guard against being called while another workflow is active
    // enter Add operation sets
    //  workflow  -> 'add'
    //  draft     -> ''
    setDraft({name: ''})
    setWorkflow('add')
  }
  const enterEdit = (client) => {
    if (workflow !== 'view') return   // extra safe guard
    // enter Edit operation sets
    //  clientId  -> current client's ID
    //  workflow  -> 'edit'
    //  draft     -> current client's name
    setClientId(client.id)
    setDraft({name: client.name})
    setWorkflow('edit')
  }
  const enterDelete = (client) => {
    if (workflow !== 'view') return   // extra safe guard
    // enter Delete operation sets
    //  clientId  -> current client's ID
    //  workflow  -> 'delete'
    setClientId(client.id)
    setWorkflow('delete')
  }

  // methods for exiting different workflow modes
  const exitWorkflow = () => {
    // exit Edit operation sets
    //  clientId  -> null
    //  workflow  -> 'view'
    //  draft     -> null
    //  error     -> null
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
  const submitModify = (event) => {
    event.preventDefault()

    const validationError = validateClientName(draft.name)
    if (validationError) {
      setError(validationError)
      console.log("Invalid input")
      return
    }

    console.log("Valid input: ", draft.name)
    exitWorkflow()
  }
  const confirmDelete = (event) => {
    event.preventDefault()

    console.log("Deleting client: ", selectedClient?.name)
    exitWorkflow()
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

  // other helpers
  const selectedClient = clients.find(
    client => client.id === clientId
  )

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
      />

      <DeleteClientModal 
        open={workflow==='delete'}
        client_name={selectedClient?.name ?? ''}
        onConfirm={confirmDelete}
        onClose={exitWorkflow}
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