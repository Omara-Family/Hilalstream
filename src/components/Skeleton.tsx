const SkeletonCard = () => (
  <div className="animate-pulse">
    <div className="aspect-[2/3] rounded-lg bg-muted" />
    <div className="mt-2 h-4 bg-muted rounded w-3/4" />
    <div className="mt-1 h-3 bg-muted rounded w-1/2" />
  </div>
);

export const SkeletonRow = () => (
  <div className="py-8">
    <div className="container mx-auto px-4">
      <div className="h-7 bg-muted rounded w-40 mb-5" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-[160px] md:w-[200px]">
            <SkeletonCard />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const SkeletonHero = () => (
  <div className="animate-pulse h-[70vh] md:h-[85vh] bg-muted relative">
    <div className="absolute bottom-16 start-4 md:start-8 space-y-4">
      <div className="h-10 bg-surface-elevated rounded w-64" />
      <div className="h-4 bg-surface-elevated rounded w-96 max-w-full" />
      <div className="h-12 bg-surface-elevated rounded w-40" />
    </div>
  </div>
);

export default SkeletonCard;
