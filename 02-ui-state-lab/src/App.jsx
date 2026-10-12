import { useState, useRef, useEffect } from 'react'

import './App.css'
import ClientList from './ClientList.jsx'
import AddClientModal from './AddClientModal.jsx'

function App() {

  const clients_init = [
    {id: 1, name: 'Farm A', modified_by: 'Alex'},
    {id: 2, name: 'Farm B', modified_by: 'Bob'}
  ]

  // states
  const [workflow, setWorkflow] = useState('view') // view | add | rename | delete
  const [draft, setDraft] = useState(null) // includes 'client_name', 'client_id'

  // sync reference

  // effects

  // methods for entering different workflow modes
  const enterAdd = () => {
    if (workflow !== 'view') return   // guard against being called while another workflow is active
    // enter Add operation sets
    //  workflow  -> 'add'
    //  draft     -> null
    setDraft({client_name: ''})
    setWorkflow('add')
  }

  // methods for exiting different workflow modes
  const exitAdd = () => {
    // exit Add operation sets
    //  workflow  -> 'view'
    //  draft     -> null
    setDraft(null)
    setWorkflow('view')
  }

  // methods for submitting requests
  const submitAdd = (event) => {
    event.preventDefault()
    console.log("add-new-client-form submitted, exitting ...")
    exitAdd()
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
        clients = {clients_init}
      />

      <AddClientModal 
        workflow={workflow}
        draft={draft}
        setDraft={setDraft}
        onSave={submitAdd}
        onClose={exitAdd}
      />

    </section>
  )

}

export default App