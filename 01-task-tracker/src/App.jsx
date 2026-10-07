import './App.css'
import {useState} from 'react'

import TaskList from './TaskList.jsx'
import AddTaskForm from './addTaskForm.jsx'
import { fakeCreateTask } from './fakeAPI.js'

function App(){

  const [name, setName] = useState('')
  const [createdby, setCreatedby] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState(null)  // initialize as null, not ''

  const task_init = [
    {id: 1, name: "Read DDIA", created_by: "Zhe"},
    {id: 2, name: "Practice piano", created_by: "ChatGPT"}
  ]

  const [tasks, setTasks] = useState(task_init)

  const addTask = async () => {
    setIsBusy(true)
    setError(null)
    try {
      const createdTask = await fakeCreateTask(name,createdby)
      setTasks([...tasks, createdTask])
      setName('')
      setCreatedby('')
    } catch (err) {
      setError('Error!!!! ' + err.message)
    } finally {   // always re-enable the buttons
      setIsBusy(false)
    }
    
  }

  const deleteTask = (id) => {
    setTasks(tasks.filter((task) => (task.id!==id)))
  }

  const renameTask = (id, newName) => {
    const new_tasks = tasks.map((task)=>(task.id===id ? {...task, name: newName} : task))
    setTasks(new_tasks)
  }
  
  return (
    <div>
      <h1>Task Tracker</h1>

      <AddTaskForm
        name={name}
        setName={setName}
        createdby={createdby}
        setCreatedby={setCreatedby}
        addTask={addTask}
        isBusy={isBusy}
        error={error}
        setError={setError}
      />

      <TaskList 
        tasks={tasks}
        deleteTask={deleteTask}
        renameTask={renameTask}
      />

    </div>
  )
}

export default App