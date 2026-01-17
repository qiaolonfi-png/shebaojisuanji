import { NextResponse } from 'next/server'
import { getAllResults } from '@/lib/calculator'

export async function GET() {
  try {
    const results = await getAllResults()
    return NextResponse.json(results)
  } catch (error) {
    console.error('Get results error:', error)
    return NextResponse.json(
      { error: '获取结果失败' },
      { status: 500 }
    )
  }
}
