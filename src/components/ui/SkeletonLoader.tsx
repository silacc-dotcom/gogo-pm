import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  count?: number
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl p-4 border border-[#E2DDD5] space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </div>
  )
}

export function SkeletonList({ count = 3 }: SkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonStat() {
  return (
    <div className="bg-white rounded-xl p-4 border border-[#E2DDD5]">
      <Skeleton className="h-3 w-20 mb-2" />
      <Skeleton className="h-8 w-12 mb-1" />
      <Skeleton className="h-3 w-16" />
    </div>
  )
}
