import './App.css'
import {useState, useEffect} from 'react'

import TaskList from './TaskList.jsx'
import AddTaskForm from './addTaskForm.jsx'
import { fakeCreateTask, fakeGetTasks } from './fakeAPI.js'
import LoadingPopup from './LoadingPopup.jsx'

function App(){

  const [name, setName] = useState('')
  const [createdby, setCreatedby] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState(null)  // initialize as null, not ''
  // resolve the ambiguity between initial empty tasks vs. waiting server to respond
  //  signals we're retrieving the initial task list
  const [isLoading, setIsLoading] = useState(true)

  const [tasks, setTasks] = useState([])

  // initial load
  const loadTasks = async () => {
    const tasks_init = await fakeGetTasks()
    setTasks(tasks_init)
    setIsLoading(false)
  }

  useEffect(() => {
    loadTasks()
  }, [])

  const addTask = async () => {
    setIsBusy(true)
    setError(null)
    try {
      const createdTask = await fakeCreateTask(name,createdby)
      setTasks(current => [...current, createdTask])
      setName('')
      setCreatedby('')
    } catch (err) {
      setError('Error!!!! ' + err.message)
    } finally {   // always re-enable the buttons
      setIsBusy(false)
    }
    
  }

  const deleteTask = (id) => {
    setTasks(current => 
      current.filter((task) => (task.id!==id))
    )
  }

  const renameTask = (id, newName) => {
    setTasks(current => 
      current.map((task) => 
        task.id === id 
          ? {...task, name: newName}
          : task
      )
    )
  }
  
  return (
    <div>
      <h1>Task Tracker</h1>

      {isLoading 
        ?
        <LoadingPopup />
        :
        <>
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
        </>
      }

    </div>
  )
}

export default App