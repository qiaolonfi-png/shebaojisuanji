import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import * as xlsx from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const table = formData.get('table') as string

    if (!file || !table) {
      return NextResponse.json(
        { error: '缺少文件或表名' },
        { status: 400 }
      )
    }

    // 验证表名
    if (!['cities', 'salaries'].includes(table)) {
      return NextResponse.json(
        { error: '无效的表名' },
        { status: 400 }
      )
    }

    // 读取Excel文件
    const arrayBuffer = await file.arrayBuffer()
    const workbook = xlsx.read(arrayBuffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = xlsx.utils.sheet_to_json(worksheet)

    console.log(`[Upload ${table}] Excel原始数据:`, JSON.stringify(data, null, 2))

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Excel文件为空' },
        { status: 400 }
      )
    }

    // 数据转换和验证
    const processedData = data.map((row: any, index: number) => {
      console.log(`[Upload ${table}] 处理第 ${index + 1} 行:`, row)

      if (table === 'cities') {
        // 兼容多种列名格式：city_name, city_namte, cityname，并处理前后空格
        // 先获取所有可能的键
        const keys = Object.keys(row).map(k => k.trim())

        // 查找城市名称列（忽略大小写和空格）
        const cityKey = Object.keys(row).find(key =>
          key.trim().toLowerCase().replace(/\s+/g, '') === 'city_name' ||
          key.trim().toLowerCase().replace(/\s+/g, '') === 'city_namte' ||
          key.trim().toLowerCase().replace(/\s+/g, '') === 'cityname'
        )

        console.log(`[Upload ${table}] 找到的城市列名: "${cityKey}"`)

        const cityName = cityKey ? String(row[cityKey]).trim() : ''

        if (!cityName) {
          console.error(`[Upload ${table}] 第 ${index + 1} 行缺少城市名称，可用列:`, Object.keys(row))
          throw new Error(`第 ${index + 1} 行：找不到城市名称列 (city_name/city_namte)，请检查Excel列名`)
        }

        const result = {
          id: Number(row.id),
          city_name: cityName,
          year: String(row.year).trim(),
          base_min: Number(row.base_min),
          base_max: Number(row.base_max),
          rate: Number(row.rate)
        }
        console.log(`[Upload ${table}] 转换后:`, result)
        return result
      } else {
        // salaries 表
        const result = {
          id: Number(row.id),
          employee_id: String(row.employee_id).trim(),
          employee_name: String(row.employee_name).trim(),
          month: String(row.month),
          salary_amount: Number(row.salary_amount)
        }
        console.log(`[Upload salaries] 转换后:`, result)
        return result
      }
    })

    console.log(`[Upload ${table}] 准备插入 ${processedData.length} 条数据`)

    // 直接插入数据（如果需要覆盖，先删除）
    const { error: deleteError } = await supabase.from(table).delete().neq('id', -1)
    if (deleteError) {
      console.warn(`[Upload ${table}] 清空表警告:`, deleteError.message)
    }

    const { data: insertData, error: insertError } = await supabase.from(table).insert(processedData).select()
    if (insertError) {
      console.error(`[Upload ${table}] 插入错误:`, insertError)
      throw insertError
    }

    console.log(`[Upload ${table}] 插入成功，返回数据:`, insertData)

    return NextResponse.json({
      success: true,
      count: processedData.length,
      message: `成功上传 ${processedData.length} 条数据到 ${table} 表`,
      data: insertData
    })

  } catch (error) {
    console.error('[Upload error]:', error)
    return NextResponse.json(
      { error: '上传失败：' + (error as Error).message },
      { status: 500 }
    )
  }
}
