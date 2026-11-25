CREATE TABLE clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_standardized TEXT NOT NULL,
    fiscal_year_end INTEGER NOT NULL DEFAULT 10,
    modified_by TEXT NOT NULL,
    modified_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    CONSTRAINT uq_client_name UNIQUE (name_standardized),
    CONSTRAINT fiscal_year_range 
        CHECK (fiscal_year_end BETWEEN 1 AND 12)
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

CREATE TABLE cash_flow_categories (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    name                    TEXT NOT NULL,
    name_standardized       TEXT NOT NULL,
    modified_by             TEXT NOT NULL,
    modified_at             TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    CONSTRAINT uq_qbo_category_name UNIQUE (name_standardized)
);

CREATE TABLE config_sources (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    name                TEXT NOT NULL,
    name_standardized   TEXT NOT NULL,
    modified_by         TEXT NOT NULL,
    modified_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    CONSTRAINT uq_config_source_name UNIQUE (name_standardized)
);


CREATE TABLE sources (
    id                          INTEGER PRIMARY KEY AUTOINCREMENT,
    name                        TEXT NOT NULL,
    name_standardized           TEXT NOT NULL,
    cash_flow_category_id       INTEGER NOT NULL,
    config_source_id            INTEGER NOT NULL,
    is_positive_signed          INTEGER NOT NULL,
    modified_by                 TEXT NOT NULL,
    modified_at                 TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    CONSTRAINT sign_is_bool
        CHECK (is_positive_signed IN (0, 1)),
    CONSTRAINT fk_source_to_category
        FOREIGN KEY (cash_flow_category_id) REFERENCES cash_flow_categories(id) ON DELETE RESTRICT,
    CONSTRAINT fk_source_to_config_source
        FOREIGN KEY (config_source_id) REFERENCES config_sources(id) ON DELETE RESTRICT,
    CONSTRAINT uq_source_name UNIQUE (name_standardized)
);

CREATE TABLE qbo_actuals (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id           INTEGER NOT NULL,
    fiscal_year         INTEGER NOT NULL,
    source_id           INTEGER NOT NULL,
    value               REAL NOT NULL,
    memo                TEXT,
    modified_by         TEXT NOT NULL,
    modified_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    CONSTRAINT fk_qbo_actual_to_client
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_qbo_actual_to_source
        FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE RESTRICT
);

CREATE INDEX qbo_actuals_idx
    ON qbo_actuals (client_id, fiscal_year, source_id, id DESC);

CREATE TABLE qbo_configurations (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id       INTEGER NOT NULL,
    forecast_year   INTEGER NOT NULL,
    source_id       INTEGER NOT NULL,
    revision_id     INTEGER NOT NULL,
    perc_change     REAL,       -- 2.5 means 2.5%
    current_value   REAL,
    memo            TEXT,
    modified_by     TEXT NOT NULL,
    modified_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    CONSTRAINT fk_qbo_config_to_client
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_qbo_config_to_forecast_year
        FOREIGN KEY (forecast_year) REFERENCES forecast_years(forecast_year) ON DELETE RESTRICT,
    CONSTRAINT fk_qbo_config_to_source
        FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE RESTRICT,
    CONSTRAINT fk_qbo_config_to_revision
        FOREIGN KEY (revision_id) REFERENCES revisions(id) ON DELETE RESTRICT,
    CONSTRAINT percentage_value CHECK (perc_change >= 0),
    CONSTRAINT projection_mode_exclusive CHECK (
        (perc_change IS NOT NULL AND current_value IS NULL) 
        OR 
        (perc_change IS NULL AND current_value IS NOT NULL)
    )
);

CREATE INDEX qbo_config_idx
    ON qbo_configurations (client_id, forecast_year, source_id, revision_id, id DESC);

CREATE TABLE monthly_allocation (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id       INTEGER NOT NULL,
    forecast_year   INTEGER NOT NULL,
    source_id       INTEGER NOT NULL,
    month_id        INTEGER NOT NULL,
    perc            REAL NOT NULL,  -- 2.5 means 2.5%
    modified_by     TEXT NOT NULL,
    modified_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    CONSTRAINT fk_schedule_to_client
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_schedule_to_forecast_year
        FOREIGN KEY (forecast_year) REFERENCES forecast_years(forecast_year) ON DELETE RESTRICT,
    CONSTRAINT fk_schedule_to_source
        FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE RESTRICT,
    CONSTRAINT percentage_value
        CHECK (perc >= 0 AND  perc <= 100),
    CONSTRAINT uq_monthly_allocation
        UNIQUE (client_id, forecast_year, source_id, month_id),
    CONSTRAINT month_value
        CHECK (month_id BETWEEN 1 AND 12)
);


INSERT INTO crops (name, name_standardized, modified_by)
VALUES  ('Durum', 'durum', 'Zhe'),
        ('Canola', 'canola', 'Zhe'),
        ('Barley', 'barley', 'Zhe'),
        ('Green Lentils', 'green_lentils', 'Zhe'),
        ('Red Lentils', 'red_lentils', 'Zhe'),
        ('Wheat (HRSW)', 'wheat_hrsw', 'Zhe'),
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


INSERT INTO cash_flow_categories (id, name, name_standardized, modified_by)
VALUES  (1, 'Cash Inflow From Operations', 'cash_inflow_from_operations', 'Zhe'),
        (2, 'Cash Inflow From Financing', 'cash_inflow_from_financing', 'Zhe'),
        (3, 'Direct Input Costs', 'direct_input_costs', 'Zhe'),
        (4, 'Operating Expenses', 'operating_expenses', 'Zhe'),
        (5, 'Additional Cash Outflow', 'additional_cash_outflow', 'Zhe');


INSERT INTO config_sources (id, name, name_standardized, modified_by)
VALUES  (1, 'QBO Inputs (Income Statement)', 'qbo_inputs_income_statement', 'Zhe'),
        (2, 'QBO Inputs (Balance Sheet)', 'qbo_inputs_balance_sheet', 'Zhe'),
        (3, 'Crop Plan', 'crop_plan', 'Zhe'),
        (4, 'Debt Schedule', 'debt_schedule', 'Zhe');


INSERT INTO sources (name, name_standardized, cash_flow_category_id, config_source_id, is_positive_signed, modified_by)
VALUES  ('CROPS — CURRENT YEAR CROP SALES', 'current_production', 1, 3, 1, 'Zhe'),
        ('CROPS — OPENING INVENTORY SALES', 'prior_inventory', 1, 3, 1, 'Zhe'),
        ('CUSTOM WORK Receipt', 'custom_work_receipt', 1, 1, 1, 'Zhe'),
        ('GOVT PROGRAM PAYMENTS', 'gov_payments', 1, 1, 1, 'Zhe'),
        ('CROP INSURANCE', 'insurance_crop_hail', 1, 1, 1, 'Zhe'),
        ('REBATES', 'rebates', 1, 1, 1, 'Zhe'),
        ('CATTLE REVENUE', 'cattle_revenue', 1, 1, 1, 'Zhe'),
        ('ACCOUNTS RECEIVABLE COLLECTED', 'accounts_receivable_collected', 1, 2, 1, 'Zhe'),
        ('CROP ADVANCES — Input Loan', 'crop_adv_input_loans', 2, 2, 1, 'Zhe'),
        ('CROP ADVANCES — Grains and Oilseeds Advance', 'crop_adv_grains_oilseeds', 2, 2, 1, 'Zhe'),
        ('CHEMICAL', 'chem_cost', 3, 3, 0, 'Zhe'),
        ('FERTILIZER', 'fert_cost', 3, 3, 0, 'Zhe'),
        ('SEED PURCHASES', 'seed_cost', 3, 3, 0, 'Zhe'),
        ('BLDG & FENCE REPAIRS', 'bldg_fence_repairs', 4, 1, 0, 'Zhe'),
        ('CUSTOM WORK', 'custom_work', 4, 1, 0, 'Zhe'),
        ('LABOUR', 'labour', 4, 1, 0, 'Zhe'),
        ('LEGAL / ACCOUNTING / OFFICE', 'legal_accounting_office', 4, 1, 0, 'Zhe'),
        ('FUEL AND OIL', 'fuel_cost', 4, 1, 0, 'Zhe'),
        ('MACH. & EQUIP. (REPAIR, LICENSES, INS)', 'mach_equip_repair_license', 4, 1, 0, 'Zhe'),
        ('INSURANCE — CROP', 'insurance_crop', 4, 1, 0, 'Zhe'),
        ('INSURANCE — OTHER', 'insurance_other', 4, 1, 0, 'Zhe'),
        ('SMALL TOOLS', 'small_tools', 4, 1, 0, 'Zhe'),
        ('TRANSPORTATION & MARKETING', 'transportation_marketing', 4, 1, 0, 'Zhe'),
        ('UTILITIES', 'utilities', 4, 1, 0, 'Zhe'),
        ('TRAVEL', 'travel', 4, 1, 0, 'Zhe'),
        ('INTEREST & BANK CHARGES', 'interest_bank_charges', 4, 1, 0, 'Zhe'),
        ('INTEREST — LOANS & LEASES', 'interest_loans_leases', 4, 1, 0, 'Zhe'),
        ('INTEREST — LOANS & LEASES — DEMAND LOAN (LOC)', 'interest_loans_leases_loc', 4, 1, 0, 'Zhe'),
        ('INTEREST — LOANS & LEASES — DEBT SCHEDULE CALCULATION', 'interest_loans_leases_debt_schedule', 4, 4, 0, 'Zhe'),
        ('MISCELLANEOUS EXPENSES', 'miscellaneous_expenses', 4, 1, 0, 'Zhe'),
        ('TAXES', 'taxes', 4, 1, 0, 'Zhe'),
        ('LEVIES', 'levies', 4, 1, 0, 'Zhe'),
        ('GRAIN DRYING', 'grain_drying', 4, 1, 0, 'Zhe'),
        ('RENT (LAND)', 'rent_cost', 4, 1, 0, 'Zhe'),
        ('RENT / LEASE (EQUIPMENT)', 'rent_lease_equipment', 4, 1, 0, 'Zhe'),
        ('CROP SHARE', 'crop_share', 4, 1, 0, 'Zhe'),
        ('GRAIN BAGS', 'grain_bags', 4, 1, 0, 'Zhe'),
        ('VETERINARY, MEDICINE, BREEDING FEES', 'veterinary_medicine_breeding_feed', 4, 1, 0, 'Zhe'),
        ('PERSONAL INCOME TAXES', 'personal_income_taxes', 5, 4, 0, 'Zhe'),
        ('CROP ADVANCES REPAID', 'crop_advances_prepaid', 5, 4, 0, 'Zhe'),
        ('ACCOUNTS PAYABLE', 'accounts_payable', 5, 4, 0, 'Zhe'),
        ('CAPITAL LEASE PAYMENTS', 'capital_leases', 5, 2, 0, 'Zhe'),
        ('EQUIPMENT DEBT PAYMENTS', 'equipment_debt', 5, 2, 0, 'Zhe'),
        ('LAND/BUILDING DEBT PAYMENTS', 'land_building_debt', 5, 2, 0, 'Zhe');