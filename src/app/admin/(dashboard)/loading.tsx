import { Skeleton } from "@/components/ui/skeleton";

// Suspense boundary para todo /admin/(dashboard)/* — cubre propiedades,
// nueva, leads, dashboard, etc. sin necesitar un loading.tsx por subruta.
export default function AdminLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
