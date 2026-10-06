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

  const addTask = () => {
    const new_item = {
      id: tasks.at(-1).id + 1,
      name: `${name}`,
      created_by: `${createdby}`
    }
    const append = (old_array, new_value) => {
      return [...old_array, new_value]
    }
    setTasks([...tasks, new_item])
    setName('')
    setCreatedby('')
  }
  
  return (
    <div>
      <h1>Task Tracker</h1>

      <input
        value={name}
        onChange={(event)=>setName(event.target.value)}
      />

      <input 
        value={createdby}
        onChange={(event)=>setCreatedby(event.target.value)}
      />

      <button
        onClick={addTask}
      >
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
                <tr key={task.id}> 
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