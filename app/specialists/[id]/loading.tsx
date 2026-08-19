import Skeleton from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <Skeleton className="h-4 w-40" />

      <div className="mt-4 overflow-hidden rounded-2xl border border-card-border bg-card">
        <Skeleton className="h-28 w-full rounded-none sm:h-36" />
        <div className="px-6 pb-6 sm:px-8">
          <div className="-mt-12 flex items-end gap-4 sm:-mt-14">
            <Skeleton className="h-26 w-26 shrink-0 rounded-full" />
            <div className="flex-1 pb-1">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="mt-2 h-4 w-56" />
            </div>
          </div>
          <div className="mt-5 flex gap-2 border-t border-card-border pt-5">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <div className="rounded-2xl border border-card-border bg-card p-6 sm:p-8">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="mt-4 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-5/6" />
          <Skeleton className="mt-2 h-4 w-2/3" />
        </div>
        <div className="rounded-2xl border border-card-border bg-card p-5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-4 h-28 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
