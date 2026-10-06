import './App.css'

function App(){

  const task_init = [
    {id: 1, name: "Read DDIA", created_by: "Zhe"},
    {id: 2, name: "Practice piano", created_by: "ChatGPT"}
  ]
  
  return (
    <div>
      <h1>Task Tracker</h1>

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
            task_init.map(
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