import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { extractYear } from '@/lib/calculator'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('salaries')
      .select('month')
      .limit(1)
      .single()

    if (error) {
      // 如果表为空或不存在
      return NextResponse.json(
        { error: '无法获取年份数据，请确保已上传工资数据' },
        { status: 404 }
      )
    }

    // 提取年份（从202401中提取2024）
    const year = extractYear(data.month)

    return NextResponse.json({ year })
  } catch (error) {
    return NextResponse.json(
      { error: '提取年份失败' },
      { status: 500 }
    )
  }
}
