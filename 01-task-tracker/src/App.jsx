import './App.css'
import {useState} from 'react'

function App(){

  const [name, setName] = useState('')
  const [createdby, setCreatedby] = useState('')

  const task_init = [
    {id: 1, name: "Read DDIA", created_by: "Zhe"},
    {id: 2, name: "Practice piano", created_by: "ChatGPT"}
  ]

  const [tasks, setTasks] = useState(task_init)
  
  return (
    <div>
      <h1>Task Tracker</h1>

      <input
        value={name}
        onChange={(event)=>setName(event.target.value)}
      />

      <p>{name}</p>

      <input 
        value={createdby}
        onChange={(event)=>setCreatedby(event.target.value)}
      />

      <p>{createdby}</p>

      <button>
        Add Task
      </button>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Created By</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {
            tasks.map(
              (task) => (
                <tr>
                  <td>{task.name}</td>
                  <td>{task.created_by}</td>
                  <td>
                    <button>Delete</button>
                  </td>
                </tr>
              )
            )
          }
        </tbody>
      </table>
    </div>
  )
}

export default App