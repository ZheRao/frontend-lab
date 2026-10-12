
function ClientList({ clients }) {
    return (
        <ul className="list">
            {clients.map(
                (client) => (
                    <li className="row" key={client.id}>
                        <div className="stack">
                            <h3 className="client-title">{client.name}</h3>
                            <p className="client-meta">Last modified by: {client.modified_by}</p>
                        </div>
                        <div className="actions">
                            <button className="edit-client">
                                Edit
                            </button>
                            <button className="delete-client">
                                Delete
                            </button>
                        </div>
                    </li>
                )
            )}
        </ul>
    )
}

export default ClientList