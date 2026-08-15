import { Check } from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { getAmenities } from "@/lib/queries/get-amenities";

// Server Component — trae el catálogo real de Supabase (antes usaba un mock
// hardcodeado que coincidía por casualidad con los IDs de la base).
export async function PropertyAmenities({
  amenityIds,
}: {
  amenityIds: string[];
}) {
  const { categories: amenityCategories, amenities } = await getAmenities();
  const groups = amenityCategories
    .map((category) => ({
      category,
      items: amenities.filter(
        (a) => a.categoryId === category.id && amenityIds.includes(a.id),
      ),
    }))
    .filter((g) => g.items.length > 0);

  if (groups.length === 0) return null;

  return (
    <Accordion type="multiple" defaultValue={groups.map((g) => g.category.id)}>
      {groups.map(({ category, items }) => (
        <AccordionItem key={category.id} value={category.id}>
          <AccordionTrigger>
            <span className="flex items-center gap-2">
              {category.name}
              <span className="text-xs font-normal text-muted-foreground">
                {items.length}
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {items.map((amenity) => (
                <li
                  key={amenity.id}
                  className="flex items-center gap-2 text-sm text-foreground"
                >
                  <Check className="size-4 shrink-0 text-brand-accent-dark" />
                  {amenity.name}
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
