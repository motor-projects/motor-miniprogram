import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MagnifyingGlassIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { useDispatch, useSelector } from 'react-redux'
import { uiSlice } from '../store/slices/uiSlice'
import { RootState } from '../store'

export const Header: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { isSidebarOpen } = useSelector((state: RootState) => state.ui)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/motorcycles?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const toggleSidebar = () => {
    dispatch(uiSlice.actions.toggleSidebar())
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {isSidebarOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
            <Link to="/" className="ml-2 flex items-center">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">
                摩托车数据
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link
              to="/"
              className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              首页
            </Link>
            <Link
              to="/motorcycles"
              className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              摩托车列表
            </Link>
            <Link
              to="/compare"
              className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              对比
            </Link>
            <Link
              to="/brands"
              className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              品牌
            </Link>
          </nav>

          {/* Search */}
          <div className="flex items-center space-x-4">
            <form onSubmit={handleSearch} className="hidden sm:block">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索摩托车..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </form>
            
            {/* Mobile search button */}
            <button
              onClick={() => navigate('/search')}
              className="sm:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <MagnifyingGlassIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isSidebarOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
            <Link
              to="/"
              className="text-gray-500 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => dispatch(uiSlice.actions.setSidebarOpen(false))}
            >
              首页
            </Link>
            <Link
              to="/motorcycles"
              className="text-gray-500 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => dispatch(uiSlice.actions.setSidebarOpen(false))}
            >
              摩托车列表
            </Link>
            <Link
              to="/compare"
              className="text-gray-500 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => dispatch(uiSlice.actions.setSidebarOpen(false))}
            >
              对比
            </Link>
            <Link
              to="/brands"
              className="text-gray-500 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => dispatch(uiSlice.actions.setSidebarOpen(false))}
            >
              品牌
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}