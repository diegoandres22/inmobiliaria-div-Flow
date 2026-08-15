"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { customAlphabet } from "nanoid";
import { createClient } from "@/lib/supabase/server";
import { propertyFormSchema } from "@/lib/validation/property-form";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8);

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// El agent_id sale de la sesión, nunca del formulario — evita que alguien
// cree propiedades a nombre de otro agente manipulando el POST.
export async function createProperty(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: agent } = await supabase
    .from("agents")
    .select("id, agency_id")
    .eq("auth_user_id", user.id)
    .single();

  if (!agent) {
    throw new Error(
      "Tu usuario no está vinculado a un perfil de agente todavía.",
    );
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = propertyFormSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const values = parsed.data;
  const slug = `${slugify(values.city)}-${values.operationType}-${values.propertyType}-${slugify(values.title)}-${nanoid()}`;

  const { error } = await supabase.from("properties").insert({
    slug,
    operation_type: values.operationType,
    property_type: values.propertyType,
    status: "borrador",
    title: values.title,
    description: values.description,
    price_amount: values.priceAmount,
    price_currency: "USD",
    price_period: values.pricePeriod ?? null,
    bedrooms: values.bedrooms,
    bathrooms: values.bathrooms,
    parking_spots: values.parkingSpots,
    area_built_m2: values.areaBuiltM2,
    address_line: values.addressLine,
    city: values.city,
    state_region: values.stateRegion,
    country_code: values.countryCode,
    location: `SRID=4326;POINT(${values.lng} ${values.lat})`,
    agent_id: agent.id,
    agency_id: agent.agency_id,
    published_at: null,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/propiedades");
  redirect("/admin/propiedades");
}

export async function deleteProperty(propertyId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("properties")
    .delete()
    .eq("id", propertyId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/propiedades");
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  borrador: ["publicada"],
  publicada: ["pausada", "archivada"],
  pausada: ["publicada", "archivada"],
  archivada: [],
};

// No confía en que el cliente mande cualquier status — solo permite las
// transiciones definidas arriba (ver checklist de autorrevisión: el flujo
// tiene que ser borrador→publicada→pausada/archivada, no cualquier salto).
export async function updatePropertyStatus(
  propertyId: string,
  currentStatus: string,
  nextStatus: string,
) {
  if (!STATUS_TRANSITIONS[currentStatus]?.includes(nextStatus)) {
    throw new Error(`Transición inválida: ${currentStatus} → ${nextStatus}`);
  }

  const supabase = await createClient();
  const patch: Record<string, unknown> = { status: nextStatus };
  if (nextStatus === "publicada" && currentStatus === "borrador") {
    patch.published_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("properties")
    .update(patch)
    .eq("id", propertyId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/propiedades");
}

// El agent_id/agency_id nunca vienen del form acá tampoco — se resuelven de
// la sesión, igual que en createProperty. RLS (agents_manage_own_properties)
// es la segunda barrera: si alguien intenta editar una propiedad que no es
// suya, el UPDATE afecta 0 filas.
export async function updateProperty(propertyId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const raw = Object.fromEntries(formData.entries());
  const parsed = propertyFormSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }
  const values = parsed.data;

  const { error } = await supabase
    .from("properties")
    .update({
      operation_type: values.operationType,
      property_type: values.propertyType,
      title: values.title,
      description: values.description,
      price_amount: values.priceAmount,
      price_period: values.pricePeriod ?? null,
      bedrooms: values.bedrooms,
      bathrooms: values.bathrooms,
      parking_spots: values.parkingSpots,
      area_built_m2: values.areaBuiltM2,
      address_line: values.addressLine,
      city: values.city,
      state_region: values.stateRegion,
      country_code: values.countryCode,
      location: `SRID=4326;POINT(${values.lng} ${values.lat})`,
    })
    .eq("id", propertyId);

  if (error) throw new Error(error.message);

  const selectedAmenities = formData.getAll("amenities") as string[];
  await supabase.from("property_amenities").delete().eq("property_id", propertyId);
  if (selectedAmenities.length > 0) {
    await supabase.from("property_amenities").insert(
      selectedAmenities.map((amenityId) => ({
        property_id: propertyId,
        amenity_id: amenityId,
      })),
    );
  }

  revalidatePath("/admin/propiedades");
  revalidatePath(`/admin/propiedades/${propertyId}`);
  redirect("/admin/propiedades");
}

// Sube a Storage (bucket "property-images", creado en FASE 2) y crea las
// filas en property_images. Primera imagen que tenga la propiedad queda
// como portada automáticamente si todavía no había ninguna.
export async function uploadPropertyImages(propertyId: string, formData: FormData) {
  const supabase = await createClient();
  const files = formData.getAll("images").filter((f) => f instanceof File && f.size > 0) as File[];
  if (files.length === 0) return;

  const { count: existingCount } = await supabase
    .from("property_images")
    .select("id", { count: "exact", head: true })
    .eq("property_id", propertyId);

  let hasCover = (existingCount ?? 0) > 0;

  for (const file of files) {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${propertyId}/${nanoid()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("property-images")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error("upload error:", uploadError.message);
      continue;
    }

    const { data: publicUrl } = supabase.storage
      .from("property-images")
      .getPublicUrl(path);

    await supabase.from("property_images").insert({
      property_id: propertyId,
      storage_path: publicUrl.publicUrl,
      alt_text: file.name.replace(/\.[^.]+$/, ""),
      is_cover: !hasCover,
      sort_order: 0,
    });
    hasCover = true;
  }

  revalidatePath(`/admin/propiedades/${propertyId}`);
}

export async function deletePropertyImage(propertyId: string, imageId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("property_images")
    .delete()
    .eq("id", imageId)
    .eq("property_id", propertyId);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/propiedades/${propertyId}`);
}

export async function setCoverImage(propertyId: string, imageId: string) {
  const supabase = await createClient();
  await supabase
    .from("property_images")
    .update({ is_cover: false })
    .eq("property_id", propertyId);
  const { error } = await supabase
    .from("property_images")
    .update({ is_cover: true })
    .eq("id", imageId)
    .eq("property_id", propertyId);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/propiedades/${propertyId}`);
}
