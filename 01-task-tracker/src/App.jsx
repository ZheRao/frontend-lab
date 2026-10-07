import './App.css'
import {useState} from 'react'

import TaskList from './TaskList.jsx'
import AddTaskForm from './addTaskForm.jsx'

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
    </div>
  )
}

export default App