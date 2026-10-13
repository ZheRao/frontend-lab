import { useState, useRef, useEffect } from 'react'

import './App.css'
import ClientList from './ClientList.jsx'
import { 
  ModifyClientModal
} from './Modals.jsx'

function App() {

  const clients_init = [
    {id: 1, name: 'Farm A', modified_by: 'Alex'},
    {id: 2, name: 'Farm B', modified_by: 'Bob'}
  ]

  // states
  const [workflow, setWorkflow] = useState('view') // view | add | edit | delete
  const [draft, setDraft] = useState(null) // includes 'client_name'
  const [clientId, setClientId] = useState(null)

  // sync reference

  // effects

  // methods for entering different workflow modes
  const enterAdd = () => {
    if (workflow !== 'view') return   // guard against being called while another workflow is active
    // enter Add operation sets
    //  workflow  -> 'add'
    //  draft     -> ''
    setDraft({client_name: ''})
    setWorkflow('add')
  }

  const enterEdit = (client) => {
    if (workflow !== 'view') return   // extra safe guard
    // enter Edit operation sets
    //  clientId  -> current client's ID
    //  workflow  -> 'edit'
    //  draft     -> current client's name
    setClientId(client.id)
    setDraft({client_name: client.name})
    setWorkflow('edit')
  }

  // methods for exiting different workflow modes
  const exitModify = () => {
    // exit Edit operation sets
    //  clientId  -> null
    //  workflow  -> 'view'
    //  draft     -> null
    setClientId(null)
    setDraft(null)
    setWorkflow('view')
  }

  // methods for submitting requests
  const submitAdd = (event) => {
    event.preventDefault()

    console.log("Target client ID: ", clientId)
    console.log("Proposed changes: ", draft?.client_name)
    exitModify()
  }

  const submitEdit = (event) => {
    event.preventDefault()

    console.log("Target client ID: ", clientId)
    console.log("Proposed changes: ", draft?.client_name)
    exitModify()
  }

  return (
    <section className="card">
      <header className="row">
        <div className="stack">
          <h2 className="title">CLIENTS</h2>
          <p className="subtitle">GrowLytics Management Portal</p>
        </div>
        <button className="add-client"
          onClick={enterAdd}
        >
          Add New Client
        </button>
      </header>

      <div className="pill" aria-hidden="true" />

      <ClientList 
        clients={clients_init}
        onEdit={enterEdit}
      />

      <ModifyClientModal 
        open={(workflow==='add') || (workflow==='edit')}
        title={workflow==='add' ? 'Add New Client' : 'Edit Client'}
        draft={draft}
        setDraft={setDraft}
        onSave={
          workflow==='add' ? submitAdd : submitEdit
        }
        onClose={exitModify}
      />

    </section>
  )

}

export default App