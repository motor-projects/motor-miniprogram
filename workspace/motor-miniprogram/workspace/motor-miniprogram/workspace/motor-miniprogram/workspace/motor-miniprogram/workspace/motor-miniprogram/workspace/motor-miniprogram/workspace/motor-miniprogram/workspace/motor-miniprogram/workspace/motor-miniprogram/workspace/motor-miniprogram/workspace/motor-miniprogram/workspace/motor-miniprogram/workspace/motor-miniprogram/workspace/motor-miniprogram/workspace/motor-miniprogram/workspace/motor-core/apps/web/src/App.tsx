import React from 'react'
import { Routes, Route } from 'react-router-dom'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">摩托车性能数据系统</h1>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                欢迎使用摩托车性能数据系统
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                浏览和比较各种摩托车的性能数据
              </p>
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">迁移完成状态</h2>
                <div className="space-y-2 text-left">
                  <div className="text-green-600">✅ 前端应用已成功迁移到独立仓库</div>
                  <div className="text-green-600">✅ 环境变量配置完成</div>
                  <div className="text-green-600">✅ API配置更新完成</div>
                  <div className="text-green-600">✅ 构建系统正常运行</div>
                  <div className="text-green-600">✅ Docker配置已更新</div>
                  <div className="text-green-600">✅ Nginx配置已更新</div>
                </div>
              </div>
            </div>
          } />
          <Route path="*" element={
            <div className="text-center">
              <h1 className="text-2xl font-bold">页面未找到</h1>
              <p className="mt-2">请检查URL是否正确</p>
            </div>
          } />
        </Routes>
      </main>
    </div>
  )
}

export default App