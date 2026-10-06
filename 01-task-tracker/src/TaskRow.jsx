function TaskRow({task}){
    return (
        <tr>
            <td>{task.name}</td>
            <td>{task.created_by}</td>
            <td>
                <button>Delete</button>
            </td>
        </tr>
    )
}

export default TaskRow