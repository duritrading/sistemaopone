// src/app/financeiro/components/InfiniteScrollLoader.tsx
'use client'

import { useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'

interface InfiniteScrollLoaderProps {
  hasMore: boolean
  isLoading: boolean
  onLoadMore: () => void
  className?: string
}

export default function InfiniteScrollLoader({
  hasMore,
  isLoading,
  onLoadMore,
  className = ''
}: InfiniteScrollLoaderProps) {
  const loaderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loader = loaderRef.current
    if (!loader || !hasMore || isLoading) return

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0]
        if (target.isIntersecting) {
          onLoadMore()
        }
      },
      {
        root: null,
        rootMargin: '100px', // Start loading 100px before the element comes into view
        threshold: 0.1
      }
    )

    observer.observe(loader)

    return () => {
      observer.unobserve(loader)
    }
  }, [hasMore, isLoading, onLoadMore])

  if (!hasMore) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-sm text-gray-500 italic">
          ✅ Todas as transações foram carregadas
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={loaderRef}
      className={`flex items-center justify-center py-8 ${className}`}
    >
      {isLoading ? (
        <div className="flex items-center space-x-2 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Carregando mais transações...</span>
        </div>
      ) : (
        <div className="text-sm text-gray-400">
          Role para baixo para carregar mais
        </div>
      )}
    </div>
  )
}