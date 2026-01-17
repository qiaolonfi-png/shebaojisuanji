'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Result {
  id: number
  employee_name: string
  avg_salary: number
  contribution_base: number
  company_fee: number
  created_at: string
}

export default function ResultsPage() {
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchResults()
  }, [])

  const fetchResults = async () => {
    try {
      const response = await fetch('/api/results')
      if (!response.ok) {
        throw new Error('获取结果失败')
      }
      const data = await response.json()
      setResults(data)
      setError(null)
    } catch (err) {
      console.error('获取结果失败：', err)
      setError('获取结果失败，请确保已执行计算')
    } finally {
      setLoading(false)
    }
  }

  // 格式化金额
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2
    }).format(amount)
  }

  // 格式化日期时间
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const totalFee = results.reduce((sum, r) => sum + r.company_fee, 0)

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 返回按钮 */}
        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回首页
        </Link>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">社保计算结果</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">共 {results.length} 条记录</span>
            <button
              onClick={fetchResults}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              刷新
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link href="/upload" className="inline-block text-blue-600 hover:text-blue-700">
              前往上传数据并计算 →
            </Link>
          </div>
        ) : results.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600 mb-4">暂无计算结果</p>
            <Link href="/upload" className="inline-block text-blue-600 hover:text-blue-700">
              前往上传数据并计算 →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">员工姓名</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">月平均工资</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">缴费基数</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">公司应缴</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">计算时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {results.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {result.employee_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-700">
                        {formatMoney(result.avg_salary)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-700">
                        {formatMoney(result.contribution_base)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-green-600">
                        {formatMoney(result.company_fee)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDateTime(result.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-sm font-semibold text-gray-700">
                      合计
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-bold text-green-700">
                      {formatMoney(totalFee)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
