import React, { useState, useEffect } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { LazyImage } from '../ui/LazyImage'
import type { Motorcycle } from '../../types'
import { cn } from '../../utils/cn'

interface ImageGalleryProps {
  motorcycle: Motorcycle
  className?: string
}

interface ImageModalProps {
  images: Array<{ url: string; alt?: string }>
  currentIndex: number
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
}

const ImageModal: React.FC<ImageModalProps> = ({ 
  images, 
  currentIndex, 
  onClose, 
  onPrevious, 
  onNext 
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          onPrevious()
          break
        case 'ArrowRight':
          onNext()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, onPrevious, onNext])

  useEffect(() => {
    // 防止背景滚动
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const currentImage = images[currentIndex]
  if (!currentImage) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors z-10"
        aria-label="关闭图片"
      >
        <XMarkIcon className="h-6 w-6" />
      </button>

      {/* 上一张按钮 */}
      {images.length > 1 && currentIndex > 0 && (
        <button
          onClick={onPrevious}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors z-10"
          aria-label="上一张图片"
        >
          <ChevronLeftIcon className="h-8 w-8" />
        </button>
      )}

      {/* 下一张按钮 */}
      {images.length > 1 && currentIndex < images.length - 1 && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors z-10"
          aria-label="下一张图片"
        >
          <ChevronRightIcon className="h-8 w-8" />
        </button>
      )}

      {/* 图片容器 */}
      <div 
        className="max-w-7xl max-h-full mx-4 flex items-center justify-center"
        onClick={onClose}
      >
        <img
          src={currentImage.url}
          alt={currentImage.alt || `图片 ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* 图片计数器 */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-black bg-opacity-60 text-white text-sm rounded-full">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* 缩略图 */}
      {images.length > 1 && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex space-x-2 max-w-md overflow-x-auto px-4">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => {
                // 这里需要传递一个回调来改变当前索引
              }}
              className={cn(
                'flex-shrink-0 w-16 h-12 rounded border-2 overflow-hidden transition-all',
                index === currentIndex 
                  ? 'border-white opacity-100' 
                  : 'border-gray-400 opacity-60 hover:opacity-80'
              )}
            >
              <img
                src={image.url}
                alt={image.alt || `缩略图 ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ motorcycle, className }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [imageError, setImageError] = useState<number[]>([])

  const images = motorcycle.images || []
  const hasImages = images.length > 0

  // 默认占位图片
  const placeholderImage = {
    url: '/placeholder-motorcycle.jpg',
    alt: `${motorcycle.brand} ${motorcycle.model} 默认图片`
  }

  const displayImages = hasImages ? images : [placeholderImage]
  const currentImage = displayImages[currentImageIndex]

  const goToPrevious = () => {
    setCurrentImageIndex(prev => 
      prev === 0 ? displayImages.length - 1 : prev - 1
    )
  }

  const goToNext = () => {
    setCurrentImageIndex(prev => 
      prev === displayImages.length - 1 ? 0 : prev + 1
    )
  }

  const openModal = (index: number = currentImageIndex) => {
    if (!hasImages) return // 防止在没有真实图片时打开模态框
    setCurrentImageIndex(index)
    setShowModal(true)
  }

  const handleImageError = (index: number) => {
    setImageError(prev => [...prev, index])
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* 主图片 */}
      <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video group">
        <LazyImage
          src={currentImage.url}
          alt={currentImage.alt || `${motorcycle.brand} ${motorcycle.model}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => handleImageError(currentImageIndex)}
        />
        
        {/* 放大按钮蒙版 */}
        {hasImages && (
          <button
            onClick={() => openModal()}
            className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center group"
            aria-label="查看大图"
          >
            <div className="bg-white bg-opacity-90 px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-sm font-medium text-gray-900">点击放大</span>
            </div>
          </button>
        )}

        {/* 切换按钮 */}
        {displayImages.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all opacity-0 group-hover:opacity-100"
              aria-label="上一张图片"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all opacity-0 group-hover:opacity-100"
              aria-label="下一张图片"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </>
        )}

        {/* 图片计数器 */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-4 right-4 px-2 py-1 bg-black bg-opacity-60 text-white text-sm rounded">
            {currentImageIndex + 1} / {displayImages.length}
          </div>
        )}
      </div>

      {/* 缩略图列表 */}
      {displayImages.length > 1 && (
        <div className="flex space-x-3 overflow-x-auto pb-2">
          {displayImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              onDoubleClick={() => openModal(index)}
              className={cn(
                'flex-shrink-0 w-20 h-16 rounded-lg border-2 overflow-hidden transition-all',
                index === currentImageIndex
                  ? 'border-primary-500 opacity-100 ring-2 ring-primary-200'
                  : 'border-gray-200 opacity-70 hover:opacity-100 hover:border-gray-300'
              )}
              aria-label={`选择图片 ${index + 1}`}
            >
              <LazyImage
                src={image.url}
                alt={image.alt || `缩略图 ${index + 1}`}
                className="w-full h-full object-cover"
                onError={() => handleImageError(index)}
              />
            </button>
          ))}
        </div>
      )}

      {/* 图片信息 */}
      <div className="text-sm text-gray-500 text-center">
        {hasImages ? (
          <span>共 {images.length} 张图片</span>
        ) : (
          <span>暂无图片，显示默认占位图</span>
        )}
        {hasImages && (
          <span className="ml-2">点击缩略图切换，双击放大查看</span>
        )}
      </div>

      {/* 图片模态框 */}
      {showModal && hasImages && (
        <ImageModal
          images={images}
          currentIndex={currentImageIndex}
          onClose={() => setShowModal(false)}
          onPrevious={goToPrevious}
          onNext={goToNext}
        />
      )}
    </div>
  )
}