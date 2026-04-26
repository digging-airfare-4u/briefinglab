import { DetailModal } from "@/components/site/detail-modal"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <DetailModal title="加载中">
      <div className="flex flex-col gap-6 px-6 pt-8 pb-8">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-3 w-44" />
        <div className="space-y-3">
          <Skeleton className="h-7 w-11/12" />
          <Skeleton className="h-7 w-3/5" />
        </div>
        <div className="space-y-2 pt-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <div className="space-y-3 pt-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <div className="space-y-2 pt-6">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
    </DetailModal>
  )
}
