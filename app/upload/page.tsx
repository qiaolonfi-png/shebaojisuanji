'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function UploadPage() {
  const router = useRouter()
  const [citiesFile, setCitiesFile] = useState<File | null>(null)
  const [salariesFile, setSalariesFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // 处理文件上传
  const handleUpload = async (file: File, tableName: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('table', tableName)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    return response.json()
  }

  // 上传文件并自动执行计算
  const handleUploadAndCalculate = async () => {
    if (!citiesFile || !salariesFile) {
      setMessage({ type: 'error', text: '请选择两个Excel文件' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      // 步骤1: 并行上传两个文件
      setMessage({ type: 'success', text: '正在上传文件...' })
      await Promise.all([
        handleUpload(citiesFile, 'cities'),
        handleUpload(salariesFile, 'salaries')
      ])

      // 步骤2: 从salaries表提取年份
      setMessage({ type: 'success', text: '文件上传成功！正在提取年份...' })
      const yearResponse = await fetch('/api/extract-year')
      if (!yearResponse.ok) {
        const errorData = await yearResponse.json()
        setMessage({ type: 'error', text: errorData.error || '获取年份失败' })
        setLoading(false)
        return
      }
      const { year } = await yearResponse.json()

      // 步骤3: 获取城市列表（使用第一个城市）
      setMessage({ type: 'success', text: '正在获取城市信息...' })
      const citiesResponse = await fetch('/api/cities')
      if (!citiesResponse.ok) {
        setMessage({ type: 'error', text: '获取城市列表失败' })
        setLoading(false)
        return
      }
      const cities = await citiesResponse.json()
      if (!cities || cities.length === 0) {
        setMessage({ type: 'error', text: 'cities表中没有城市数据' })
        setLoading(false)
        return
      }

      // 步骤4: 使用第一个城市执行计算
      const cityName = cities[0]
      setMessage({ type: 'success', text: `正在使用 ${cityName} 的标准进行计算...` })

      const calcResponse = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityName, year })
      })

      const result = await calcResponse.json()

      if (calcResponse.ok) {
        setMessage({
          type: 'success',
          text: `计算完成！已为 ${result.count} 名员工计算社保费用，即将跳转到结果页...`
        })
        setTimeout(() => router.push('/results'), 1500)
      } else {
        setMessage({ type: 'error', text: result.error || '计算失败' })
      }
    } catch (error) {
      console.error('Error:', error)
      setMessage({ type: 'error', text: '操作失败：' + error })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 返回按钮 */}
        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回首页
        </Link>

        <h1 className="text-3xl font-bold text-gray-800 mb-8">数据上传与计算</h1>

        {/* 消息提示 */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.text}
          </div>
        )}

        {/* 文件上传区域 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">上传Excel文件并自动计算</h2>
          <p className="text-gray-600 mb-6">上传文件后将自动执行计算，无需手动选择城市</p>

          <div className="space-y-4">
            {/* Cities文件 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                城市社保标准文件 (cities.xlsx)
              </label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setCitiesFile(e.target.files?.[0] || null)}
                disabled={loading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
              {citiesFile && !loading && (
                <p className="mt-1 text-sm text-green-600">已选择: {citiesFile.name}</p>
              )}
            </div>

            {/* Salaries文件 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                员工工资文件 (salaries.xlsx)
              </label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setSalariesFile(e.target.files?.[0] || null)}
                disabled={loading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
              {salariesFile && !loading && (
                <p className="mt-1 text-sm text-green-600">已选择: {salariesFile.name}</p>
              )}
            </div>

            <button
              onClick={handleUploadAndCalculate}
              disabled={loading || !citiesFile || !salariesFile}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '处理中...' : '上传并计算'}
            </button>
          </div>
        </div>

        {/* 说明提示 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>说明：</strong>
            <br />• 系统将自动使用 cities.xlsx 中的第一个城市标准进行计算
            <br />• 请确保Excel文件格式正确
            <br />• cities表列名：id, city_name, year, rate, base_min, base_max
            <br />• salaries表列名：id, employee_id, employee_name, month, salary_amount
          </p>
        </div>
      </div>
    </div>
  )
}
