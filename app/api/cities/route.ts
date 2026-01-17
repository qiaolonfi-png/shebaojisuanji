import { NextResponse } from 'next/server'
import { getAllCities } from '@/lib/calculator'

export async function GET() {
  try {
    console.log('[API cities] 开始获取城市列表')
    const cities = await getAllCities()
    console.log('[API cities] 获取到的城市列表:', cities)
    return NextResponse.json(cities)
  } catch (error) {
    console.error('[API cities] 获取城市列表失败：', error)
    return NextResponse.json(
      { error: '获取城市列表失败：' + (error as Error).message },
      { status: 500 }
    )
  }
}
