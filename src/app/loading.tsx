import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Skeleton, PropertyGridSkeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <>
      <Header />
      <main>
        <section className="bg-brand-ink px-4 py-16 md:px-6 md:py-24">
          <div className="mx-auto max-w-6xl space-y-6">
            <Skeleton className="h-10 w-2/3 bg-white/10" />
            <Skeleton className="h-5 w-1/2 bg-white/10" />
            <Skeleton className="h-16 w-full bg-white/10" />
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-4 py-14 md:px-6">
          <Skeleton className="mb-6 h-6 w-56" />
          <PropertyGridSkeleton count={4} />
        </section>
      </main>
      <Footer />
    </>
  );
}
