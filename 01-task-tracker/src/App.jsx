import './App.css'
import {useState} from 'react'

import TaskList from './TaskList.jsx'
import AddTaskForm from './addTaskForm.jsx'
import { fakeCreateTask } from './fakeAPI.js'

function App(){

  // async experiment
  const experiment = async () => {
    console.log("1: before")

    // call 'fakeCreateTask()', it gives me a Promise.
    //  suspend the rest of this async function's execution until that Prommise settles
    //  when it fulfills, give me its fulfilled value
    const result = await fakeCreateTask()

    console.log("2: result =", result) 
    console.log("3: after")

    // click 'Async Experiment', then immediately click 'Other Button'
    //  immediate
    //    1. before
    //    OTHER BUTTON CLICKED
    //  2 seconds later
    //    API operation finished
    //    2. result = {
    //                    "id": 99,
    //                    "name": "Server-created task",
    //                    "created_by": "Fake Server"
    //                }
    //    3. after

  }

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
    setTasks([...tasks, new_item])
    setName('')
    setCreatedby('')
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
      />

      <TaskList 
        tasks={tasks}
        deleteTask={deleteTask}
        renameTask={renameTask}
      />

      <button
       onClick={experiment}
      >
        Async Experiment
      </button>

      <button
       onClick={()=>console.log("OTHER BUTTON CLICKED")}
      >
        Other Button
      </button>
    </div>
  )
}

export default App