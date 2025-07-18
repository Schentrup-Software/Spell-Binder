interface SkeletonLoaderProps {
  variant?: 'card' | 'list' | 'dashboard' | 'text' | 'image'
  count?: number
  className?: string
}

export default function SkeletonLoader({ 
  variant = 'text', 
  count = 1, 
  className = '' 
}: SkeletonLoaderProps) {
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <div className={`bg-white rounded-lg shadow-md overflow-hidden animate-pulse ${className}`}>
            <div className="flex flex-col sm:flex-row">
              {/* Card image skeleton */}
              <div className="sm:w-36 flex-shrink-0">
                <div className="w-full h-48 sm:h-48 bg-gray-300"></div>
              </div>
              
              {/* Card details skeleton */}
              <div className="p-3 md:p-4 flex-grow">
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded mb-2 w-1/2"></div>
                
                {/* Collection details skeleton */}
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
                
                {/* Action buttons skeleton */}
                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <div className="h-8 bg-gray-200 rounded flex-1 sm:flex-none sm:w-16"></div>
                  <div className="h-8 bg-gray-200 rounded flex-1 sm:flex-none sm:w-20"></div>
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'list':
        return (
          <div className={`bg-white rounded-lg shadow p-4 animate-pulse ${className}`}>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-300 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        )
      
      case 'dashboard':
        return (
          <div className={`bg-white p-4 md:p-6 rounded-lg shadow animate-pulse ${className}`}>
            <div className="h-4 bg-gray-300 rounded mb-4 w-1/3"></div>
            <div className="h-8 bg-gray-200 rounded mb-2 w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        )
      
      case 'image':
        return (
          <div className={`bg-gray-300 animate-pulse ${className}`}></div>
        )
      
      case 'text':
      default:
        return (
          <div className={`h-4 bg-gray-300 rounded animate-pulse ${className}`}></div>
        )
    }
  }

  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="mb-4 last:mb-0">
          {renderSkeleton()}
        </div>
      ))}
    </>
  )
}