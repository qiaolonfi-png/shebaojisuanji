import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  const results = {
    cities: { success: false, error: null as string | null },
    salaries: { success: false, error: null as string | null },
    salariesIndex: { success: false, error: null as string | null },
    results: { success: false, error: null as string | null },
  }

  // Create cities table
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS cities (
          id INTEGER PRIMARY KEY,
          city_name TEXT NOT NULL,
          year TEXT NOT NULL,
          base_min INTEGER NOT NULL,
          base_max INTEGER NOT NULL,
          rate FLOAT NOT NULL
        );
      `
    })
    if (error) {
      // Try direct SQL approach if RPC fails
      results.cities.error = error.message
    } else {
      results.cities.success = true
    }
  } catch (e) {
    results.cities.error = String(e)
  }

  // Create salaries table
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS salaries (
          id INTEGER PRIMARY KEY,
          employee_id TEXT NOT NULL,
          employee_name TEXT NOT NULL,
          month TEXT NOT NULL,
          salary_amount INTEGER NOT NULL
        );
      `
    })
    if (error) {
      results.salaries.error = error.message
    } else {
      results.salaries.success = true
    }
  } catch (e) {
    results.salaries.error = String(e)
  }

  // Create salaries index
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_salaries_employee ON salaries(employee_id, employee_name);
      `
    })
    if (error) {
      results.salariesIndex.error = error.message
    } else {
      results.salariesIndex.success = true
    }
  } catch (e) {
    results.salariesIndex.error = String(e)
  }

  // Create results table
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS results (
          id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
          employee_name TEXT NOT NULL UNIQUE,
          avg_salary FLOAT NOT NULL,
          contribution_base FLOAT NOT NULL,
          company_fee FLOAT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })
    if (error) {
      results.results.error = error.message
    } else {
      results.results.success = true
    }
  } catch (e) {
    results.results.error = String(e)
  }

  // Check if any operations succeeded
  const allFailed = Object.values(results).every(r => !r.success && r.error)

  if (allFailed) {
    return NextResponse.json(
      {
        error: '数据库初始化失败。请确保在 Supabase 控制台手动创建表结构。',
        details: results,
        manualInstructions: {
          cities: `CREATE TABLE IF NOT EXISTS cities (
  id INTEGER PRIMARY KEY,
  city_name TEXT NOT NULL,
  year TEXT NOT NULL,
  base_min INTEGER NOT NULL,
  base_max INTEGER NOT NULL,
  rate FLOAT NOT NULL
);`,
          salaries: `CREATE TABLE IF NOT EXISTS salaries (
  id INTEGER PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  month TEXT NOT NULL,
  salary_amount INTEGER NOT NULL
);`,
          salariesIndex: `CREATE INDEX IF NOT EXISTS idx_salaries_employee ON salaries(employee_id, employee_name);`,
          results: `CREATE TABLE IF NOT EXISTS results (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  employee_name TEXT NOT NULL UNIQUE,
  avg_salary FLOAT NOT NULL,
  contribution_base FLOAT NOT NULL,
  company_fee FLOAT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`
        }
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: '数据库初始化完成',
    results
  })
}

// GET endpoint to check if tables exist
export async function GET() {
  const checks = {
    cities: false,
    salaries: false,
    results: false,
  }

  try {
    const { data: cities } = await supabase.from('cities').select('id').limit(1)
    checks.cities = !cities  // If error, table doesn't exist
  } catch { }

  try {
    const { data: salaries } = await supabase.from('salaries').select('id').limit(1)
    checks.salaries = !salaries
  } catch { }

  try {
    const { data: results } = await supabase.from('results').select('id').limit(1)
    checks.results = !results
  } catch { }

  const allExist = Object.values(checks).every(v => v)

  return NextResponse.json({
    initialized: allExist,
    tables: checks
  })
}
