import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Skeleton, PropertyGridSkeleton } from "@/components/ui/skeleton";

export default function PropertiesLoading() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <Skeleton className="mb-6 hidden h-32 w-full md:block" />
        <Skeleton className="mb-4 h-5 w-40" />
        <PropertyGridSkeleton count={6} />
      </main>
      <Footer />
    </>
  );
}
