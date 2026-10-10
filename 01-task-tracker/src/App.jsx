import './App.css'
import {useState, useEffect} from 'react'

import TaskList from './TaskList.jsx'
import AddTaskForm from './addTaskForm.jsx'
import { 
  fakeCreateTask, 
  fakeGetTasks, 
  fakeDeleteTasks,
  fakeRenameTask
} from './fakeAPI.js'
import LoadingPopup from './LoadingPopup.jsx'
import ErrorPopup from './ErrorPopup.jsx'

function App(){

  const [name, setName] = useState('')
  const [createdby, setCreatedby] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const [errorDialog, setErrorDialog] = useState(null) // has message, retry, canClose
  // resolve the ambiguity between initial empty tasks vs. waiting server to respond
  //  signals we're retrieving the initial task list
  const [isLoading, setIsLoading] = useState(true)

  const [tasks, setTasks] = useState([])

  // initial load
  const loadTasks = async () => {
    setIsLoading(true)
    setErrorDialog(null)
    try {
      const tasks_init = await fakeGetTasks()
      setTasks(tasks_init)
      
    } catch(err) {
      const error_message = 'Error!!!!! ' + err.message
      const retry_action = ()=>loadTasks()
      const can_close = false 
      setErrorDialog({
        message: error_message,
        retry: retry_action,
        canClose: can_close
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [])

  const runWrite = async (action) => {
    setIsBusy(true)
    setErrorDialog(null)
    try {
      const result = await action()
      return true
    } catch(err) {
      setErrorDialog({
        message: 'Error !!! ' + err.message,
        retry: () => runWrite(action),
        canClose: true 
      })
      return false
    } finally {
      setIsBusy(false)
      // don't 'return' here, 'finally' can override an ealier 'return' or even suppress an exception
    }
  }

  const addTask = async () => {
    setIsBusy(true)
    setErrorDialog(null)
    try {
      const createdTask = await fakeCreateTask(name,createdby)
      setTasks(current => [...current, createdTask])
      setName('')
      setCreatedby('')
    } catch (err) {
      const error_message = 'Error!!!! ' + err.message
      const retry_action = () => addTask()
      const can_close = true
      setErrorDialog({
        message: error_message,
        retry: retry_action,
        canClose: can_close
      })
    } finally {   // always re-enable the buttons
      setIsBusy(false)
    }
    
  }

  const deleteTask = async (id) => {
    setIsBusy(true)
    setErrorDialog(null)
    try {
      const response = await fakeDeleteTasks(id)
      setTasks(current => 
        current.filter((task) => (task.id!==id))
      )
    } catch(err) {
      const error_message = 'Error!!!! ' + err.message
      const retry_action = () => deleteTask(id)
      const can_close = true
      setErrorDialog({
        message: error_message,
        retry: retry_action,
        canClose: can_close
      })
    } finally {
      setIsBusy(false)
    }
  }

  const renameTask = async (id, newName) => {
    const result = await runWrite(
      async () => {
        await fakeRenameTask(id, newName)
        setTasks(current => 
          current.map((task) => 
            task.id === id 
              ? {...task, name: newName}
              : task
          )
        )
      }
    )
    return result
  }
  
  return (
    <div>
      <h1>Task Tracker</h1>

      {errorDialog ? (
        <ErrorPopup 
          message={errorDialog.message}
          onRetry={errorDialog.retry}
          onClose={()=>{setErrorDialog(null)}}
          showClose={errorDialog.canClose}
        />
      ) : isLoading ? (
        <LoadingPopup />
      ) : (
          <>
            <AddTaskForm
              name={name}
              setName={setName}
              createdby={createdby}
              setCreatedby={setCreatedby}
              addTask={addTask}
              isBusy={isBusy}
            />

            {tasks.length === 0 ? (
                <p>No Tasks Yet</p>
              ) : (
                <TaskList 
                  tasks={tasks}
                  deleteTask={deleteTask}
                  renameTask={renameTask}
                  isBusy={isBusy}
                />
              )
            }
          </>
        )
      }

    </div>
  )
}

export default App