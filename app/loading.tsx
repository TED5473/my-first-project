import { APP_COPY } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <div className="space-y-3 rounded-3xl border border-white/15 bg-black/35 p-8">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-10 w-full max-w-3xl" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="space-y-3 rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur"
            >
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>

        <div className="space-y-3 rounded-2xl border border-white/10 bg-black/35 p-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-18 w-full" />
        </div>
      </div>

      <p className="text-sm text-cyan-100/85">{APP_COPY.loading}</p>
    </div>
  );
}
