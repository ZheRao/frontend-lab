| error category | error type | error name | error code | error message |
| --- | --- | --- | --- | --- |
| `unique` | `IntegrityError` | `SQLITE_CONSTRAINT_UNIQUE` | `2067` | `UNIQUE constraint failed: {table}.{column_name}` |
| `non_null` | `IntegrityError` | `SQLITE_CONSTRAINT_NOTNULL` | `1299` | `NOT NULL constraint failed: {table}.{column_name}` |
| `foreign_key` | `IntegrityError` | `SQLITE_CONSTRAINT_FOREIGNKEY` | `787` | `FOREIGN KEY constraint failed` |
| `foreign_key_trigger` | `IntegrityError` | `SQLITE_CONSTRAINT_TRIGGER` | `1811` | `FOREIGN KEY constraint failed` |
| `busy` | `OperationError` | `SQLITE_BUSY`| `5` | `database is locked` |