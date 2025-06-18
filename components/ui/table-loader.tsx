import React from 'react'
import { Loader2 } from 'lucide-react'

interface TableLoaderProps {
  isLoading: boolean
  children: React.ReactNode
}

export function TableLoader({ isLoading, children }: TableLoaderProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="text-sm text-gray-600">Calculating...</span>
          </div>
        </div>
      )}
    </div>
  )
} 