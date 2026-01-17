// Database initialization SQL statements
export const createCitiesTable = `
  CREATE TABLE IF NOT EXISTS cities (
    id INTEGER PRIMARY KEY,
    city_name TEXT NOT NULL,
    year TEXT NOT NULL,
    base_min INTEGER NOT NULL,
    base_max INTEGER NOT NULL,
    rate FLOAT NOT NULL
  );
`;

export const createSalariesTable = `
  CREATE TABLE IF NOT EXISTS salaries (
    id INTEGER PRIMARY KEY,
    employee_id TEXT NOT NULL,
    employee_name TEXT NOT NULL,
    month TEXT NOT NULL,
    salary_amount INTEGER NOT NULL
  );
`;

export const createSalariesIndex = `
  CREATE INDEX IF NOT EXISTS idx_salaries_employee ON salaries(employee_id, employee_name);
`;

export const createResultsTable = `
  CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    employee_name TEXT NOT NULL UNIQUE,
    avg_salary FLOAT NOT NULL,
    contribution_base FLOAT NOT NULL,
    company_fee FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
`;

export const getAllTablesSQL = [
  createCitiesTable,
  createSalariesTable,
  createSalariesIndex,
  createResultsTable,
];
