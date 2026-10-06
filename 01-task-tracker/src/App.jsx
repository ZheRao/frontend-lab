import './App.css'
import {useState} from 'react'

import TaskList from './TaskList.jsx'

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

      <TaskList tasks={tasks}/>
    </div>
  )
}

export default App