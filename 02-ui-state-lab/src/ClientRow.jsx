
function ClientRow( { client, onEdit } ) {
    return (
        <li className="row">
            <div className="stack">
                <h3 className="client-title">{client.name}</h3>
                <p className="client-meta">Last modified by: {client.modified_by}</p>
            </div>
            <div className="actions">
                <button className="edit-client"
                    onClick={()=>onEdit(client)}
                >
                    Edit
                </button>
                <button className="delete-client">
                    Delete
                </button>
            </div>
        </li>
    )
}

export default ClientRow