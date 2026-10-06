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

      <AddTaskForm
        name={name}
        setName={setName}
        createdby={createdby}
        setCreatedby={setCreatedby}
        addTask={addTask}
      />

      <TaskList tasks={tasks}/>
    </div>
  )
}

export default App