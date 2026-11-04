CREATE TABLE clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_standardized TEXT NOT NULL,
    modified_by TEXT NOT NULL,
    CONSTRAINT uq_client_name UNIQUE (name_standardized)
);

CREATE TABLE client_note (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id   INTEGER NOT NULL,
    note        TEXT NOT NULL,
    CONSTRAINT fk_client_notes_client
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT
);