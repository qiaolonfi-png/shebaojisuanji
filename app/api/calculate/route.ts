import { NextRequest, NextResponse } from 'next/server'
import { calculateSocialInsurance, saveCalculationResults } from '@/lib/calculator'

export async function POST(request: NextRequest) {
  try {
    const { cityName, year } = await request.json()

    if (!cityName || !year) {
      return NextResponse.json(
        { error: '缺少城市名称或年份' },
        { status: 400 }
      )
    }

    const results = await calculateSocialInsurance(cityName, year)
    await saveCalculationResults(results)

    return NextResponse.json({
      success: true,
      count: results.length,
      message: `成功计算 ${results.length} 名员工的社保费用`
    })
  } catch (error) {
    console.error('Calculate error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
