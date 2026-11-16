CREATE TABLE clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_standardized TEXT NOT NULL,
    modified_by TEXT NOT NULL,
    modified_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    CONSTRAINT uq_client_name UNIQUE (name_standardized)
);

CREATE TABLE forecast_years (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    forecast_year   INTEGER NOT NULL,
    modified_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    modified_by     TEXT NOT NULL,
    CONSTRAINT uq_forecast_year UNIQUE (forecast_year)
);

CREATE TABLE crops (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    name                TEXT NOT NULL,
    name_standardized   TEXT NOT NULL,
    modified_by         TEXT NOT NULL,
    modified_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    CONSTRAINT uq_crop_name UNIQUE (name_standardized)
);

CREATE TABLE revisions (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    name                TEXT NOT NULL,
    revision_order      INTEGER NOT NULL,
    name_standardized   TEXT NOT NULL,
    modified_by         TEXT NOT NULL,
    modified_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    CONSTRAINT uq_rev_name UNIQUE (name_standardized),
    CONSTRAINT uq_rev_order UNIQUE (revision_order)
);


CREATE TABLE crop_plan (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id           INTEGER NOT NULL,
    forecast_year       INTEGER NOT NULL,
    crop_id             INTEGER NOT NULL,
    revision_id         INTEGER NOT NULL,
    category_key        TEXT NOT NULL,
    value               REAL NOT NULL,
    modified_by         TEXT NOT NULL,
    memo                TEXT,
    created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    CONSTRAINT fk_crop_plan_client
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_crop_plan_crop
        FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE RESTRICT,
    CONSTRAINT fk_crop_plan_revision
        FOREIGN KEY (revision_id) REFERENCES revisions(id) ON DELETE RESTRICT,
    CONSTRAINT fk_crop_plan_category
        FOREIGN KEY (category_key) REFERENCES crop_plan_categories(key) ON DELETE RESTRICT,
    CONSTRAINT fk_crop_plan_forecast_year
        FOREIGN KEY (forecast_year) REFERENCES forecast_years(forecast_year) ON DELETE RESTRICT
);

CREATE TABLE crop_plan_categories (
    key             TEXT PRIMARY KEY,
    crop_year       TEXT NOT NULL,
    label           TEXT NOT NULL,
    unit            TEXT NOT NULL
);

INSERT INTO crops (name, name_standardized, modified_by)
VALUES  ('Durum', 'durum', 'Zhe'),
        ('Canola', 'canola', 'Zhe'),
        ('Barley', 'barley', 'Zhe'),
        ('Green Lentils', 'green_lentils', 'Zhe'),
        ('Red Lentils', 'red_lentils', 'Zhe'),
        ('Wheat (HRSW)', 'wheat_(hrsw)', 'Zhe'),
        ('Chick Peas', 'chick_peas', 'Zhe'),
        ('Oats', 'oats', 'Zhe'),
        ('Seed Oats', 'seed_oats', 'Zhe'),
        ('Soy Beans', 'soy_beans', 'Zhe'),
        ('Flax', 'flax', 'Zhe'),
        ('Maple Peas', 'maple_peas', 'Zhe'),
        ('Fenugreek', 'fenugreek', 'Zhe'),
        ('Hemp', 'hemp', 'Zhe');

INSERT INTO revisions (name, name_standardized, revision_order, modified_by)
VALUES  ('Pre-seeding', 'pre-seeding', 1, 'Zhe'),
        ('Post-seeding', 'post-seeding', 2, 'Zhe'),
        ('Pre-harvest', 'pre-harvest', 3, 'Zhe'),
        ('Post-harvest', 'post-harvest', 4, 'Zhe');

INSERT INTO crop_plan_categories (key, crop_year, label, unit)
VALUES  ( 'prior.quantity_inventory', 'prior', 'Opening Inventory', 'bu' ),
        ( 'prior.unit_price', 'prior', 'Unit Price (Prior)', '$/bu' ),
        ( 'acres', 'current', 'Acres', 'ac' ),
        ( 'unit_price', 'current', 'Unit Price', '$/bu' ),
        ( 'yield', 'current', 'Yield / Acre', 'bu/ac' ),
        ( 'chem_cost', 'current', 'Chem', '$/ac' ),
        ( 'fert_cost', 'current', 'Fert', '$/ac' ),
        ( 'fuel_cost', 'current', 'Fuel', '$/ac' ),
        ( 'rent_cost', 'current', 'Rent', '$/ac' ),
        ( 'seed_cost', 'current', 'Seed', '$/ac' );

INSERT INTO forecast_years (forecast_year, modified_by)
VALUES  (2026, 'Zhe'),
        (2027, 'Zhe'),
        (2028, 'Zhe'),
        (2029, 'Zhe');