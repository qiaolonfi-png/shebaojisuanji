import { supabase } from './supabase'

// Type definitions
export interface SalaryRecord {
  id?: number
  employee_id: string
  employee_name: string
  month: string
  salary_amount: number
}

export interface CityStandard {
  id?: number
  city_name: string
  year: string
  base_min: number
  base_max: number
  rate: number
}

export interface CalculationResult {
  id?: number
  employee_name: string
  avg_salary: number
  contribution_base: number
  company_fee: number
  created_at?: string
}

/**
 * 计算社保缴纳
 * @param cityName 城市名称
 * @param year 年份（从工资数据中提取）
 */
export async function calculateSocialInsurance(
  cityName: string,
  year: string
): Promise<CalculationResult[]> {
  // 1. 获取城市社保标准
  const { data: cityData, error: cityError } = await supabase
    .from('cities')
    .select('*')
    .eq('city_name', cityName)
    .eq('year', year)
    .single()

  if (cityError || !cityData) {
    throw new Error(`未找到城市 ${cityName} 在 ${year} 年的社保标准`)
  }

  // 2. 获取所有员工工资数据
  const { data: salaryData, error: salaryError } = await supabase
    .from('salaries')
    .select('*')

  if (salaryError) throw salaryError

  if (!salaryData || salaryData.length === 0) {
    throw new Error('没有找到工资数据，请先上传工资数据')
  }

  // 3. 按 employee_id + employee_name 分组计算月平均工资
  const employeeMap = new Map<string, SalaryRecord[]>()
  salaryData.forEach((record: SalaryRecord) => {
    const key = `${record.employee_id}-${record.employee_name}`
    if (!employeeMap.has(key)) {
      employeeMap.set(key, [])
    }
    employeeMap.get(key)!.push(record)
  })

  // 4. 计算每个员工的结果
  const results: CalculationResult[] = []

  for (const [key, records] of employeeMap) {
    const avgSalary = records.reduce((sum, r) => sum + r.salary_amount, 0) / records.length
    const employeeName = records[0].employee_name

    // 5. 确定缴费基数
    let contributionBase: number
    if (avgSalary < cityData.base_min) {
      contributionBase = cityData.base_min
    } else if (avgSalary > cityData.base_max) {
      contributionBase = cityData.base_max
    } else {
      contributionBase = avgSalary
    }

    // 6. 计算公司应缴金额
    const companyFee = contributionBase * cityData.rate

    results.push({
      employee_name: employeeName,
      avg_salary: Number(avgSalary.toFixed(2)),
      contribution_base: Number(contributionBase.toFixed(2)),
      company_fee: Number(companyFee.toFixed(2))
    })
  }

  return results
}

/**
 * 保存计算结果到数据库（使用upsert实现覆盖）
 */
export async function saveCalculationResults(
  results: CalculationResult[]
): Promise<void> {
  const { error } = await supabase
    .from('results')
    .upsert(results, {
      onConflict: 'employee_name'
    })

  if (error) throw error
}

/**
 * 获取所有计算结果
 */
export async function getAllResults(): Promise<CalculationResult[]> {
  const { data, error } = await supabase
    .from('results')
    .select('*')
    .order('employee_name')

  if (error) throw error
  return data || []
}

/**
 * 提取年份（从月份数据中，如 202401 -> 2024）
 */
export function extractYear(month: string | number): string {
  const monthStr = String(month)
  return monthStr.substring(0, 4)
}

/**
 * 获取所有不重复的城市名称
 */
export async function getAllCities(): Promise<string[]> {
  console.log('[getAllCities] 开始查询城市数据')
  const { data, error } = await supabase
    .from('cities')
    .select('city_name')
    .order('city_name')

  if (error) {
    console.error('[getAllCities] 查询失败:', error)
    throw error
  }

  console.log('[getAllCities] 查询结果:', data)

  // 去重并返回
  const uniqueCities = [...new Set(data?.map(d => d.city_name) || [])]
  console.log('[getAllCities] 去重后的城市列表:', uniqueCities)
  return uniqueCities
}
