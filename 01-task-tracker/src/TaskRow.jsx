function TaskRow({task, deleteTask}){
    return (
        <tr>
            <td>{task.name}</td>
            <td>{task.created_by}</td>
            <td>
                <button
                  onClick={()=>deleteTask(task.id)}
                >
                  Delete
                </button>
            </td>
        </tr>
    )
}

export default TaskRow