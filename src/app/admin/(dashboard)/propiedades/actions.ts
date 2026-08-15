"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { customAlphabet } from "nanoid";
import { createClient } from "@/lib/supabase/server";
import { propertyFormSchema } from "@/lib/validation/property-form";
import { validateImageFile } from "@/lib/security/validate-image";

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
//
// Antes esto redirigía él mismo al terminar. Ahora devuelve el id de la
// fila creada — el formulario de creación (new-property-form.tsx) necesita
// ese id para subir las imágenes bufferizadas ANTES de navegar a ningún
// lado (Storage cuelga cada imagen bajo `${propertyId}/...`, no existe
// hasta que este insert corre). El caller decide cuándo y adónde redirigir.
export async function createProperty(
  formData: FormData,
): Promise<{ id: string }> {
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

  const { data: created, error } = await supabase
    .from("properties")
    .insert({
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
    })
    .select("id")
    .single();

  if (error || !created) {
    throw new Error(error?.message ?? "No se pudo crear la propiedad.");
  }

  const selectedAmenities = formData.getAll("amenities") as string[];
  if (selectedAmenities.length > 0) {
    await supabase.from("property_amenities").insert(
      selectedAmenities.map((amenityId) => ({
        property_id: created.id,
        amenity_id: amenityId,
      })),
    );
  }

  revalidatePath("/admin/propiedades");
  return { id: created.id };
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
//
// Hardening (auditoría AppSec): antes se confiaba en file.type (lo manda el
// navegador, se falsifica con un simple fetch/curl) y en la extensión del
// nombre del archivo para armar el path de Storage. Ahora:
//   - validateImageFile lee los magic bytes reales — solo JPEG/PNG/WEBP.
//   - tamaño máximo 8 MB por archivo, ya replicado también a nivel bucket
//     (file_size_limit / allowed_mime_types) como defensa en profundidad.
//   - la extensión del path sale del tipo detectado, nunca de file.name —
//     el nombre original solo se usa (sanitizado) como alt_text.
//   - devuelve errores en vez de tragárselos en un console.error silencioso,
//     para que la UI pueda mostrarle al agente qué archivo rechazó y por qué.
export async function uploadPropertyImages(
  propertyId: string,
  formData: FormData,
): Promise<{ uploaded: number; errors: string[] }> {
  const supabase = await createClient();
  const files = formData.getAll("images").filter((f) => f instanceof File && f.size > 0) as File[];
  if (files.length === 0) return { uploaded: 0, errors: [] };

  const { count: existingCount } = await supabase
    .from("property_images")
    .select("id", { count: "exact", head: true })
    .eq("property_id", propertyId);

  let hasCover = (existingCount ?? 0) > 0;
  let sortOrder = existingCount ?? 0;
  let uploaded = 0;
  const errors: string[] = [];

  // Antes TODAS las imágenes se insertaban con sort_order: 0 — el "orden"
  // que se veía en la galería era casualidad (orden de inserción física en
  // la tabla), no un valor real, a pesar de que tanto el admin como el RPC
  // público ya ordenan explícitamente por esta columna. Ahora es secuencial,
  // continuando después de lo que ya hubiera.
  //
  // coverIndex (opcional): el formulario de creación deja elegir portada
  // ANTES de subir — si viene, manda por sobre el criterio viejo de
  // "la primera que entra es portada si no había ninguna" (que se mantiene
  // sin cambios para el flujo de edición, que nunca manda este campo).
  const coverIndexRaw = formData.get("coverIndex");
  const coverIndex =
    typeof coverIndexRaw === "string" && coverIndexRaw !== ""
      ? Number(coverIndexRaw)
      : null;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    // noUncheckedIndexedAccess: files[i] tipa como File | undefined aunque
    // el filter de arriba ya garantiza que no hay huecos — guard explícito.
    if (!file) continue;
    const validation = await validateImageFile(file);
    if (!validation.ok) {
      errors.push(validation.reason);
      continue;
    }

    const path = `${propertyId}/${nanoid()}.${validation.ext}`;
    const { error: uploadError } = await supabase.storage
      .from("property-images")
      .upload(path, file, { contentType: validation.mime, upsert: false });

    if (uploadError) {
      errors.push(`"${file.name}": no se pudo subir (${uploadError.message}).`);
      continue;
    }

    const { data: publicUrl } = supabase.storage
      .from("property-images")
      .getPublicUrl(path);

    const safeAlt = file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[^\w\s-]/g, "")
      .slice(0, 120);

    const isCover = coverIndex !== null ? i === coverIndex : !hasCover;

    await supabase.from("property_images").insert({
      property_id: propertyId,
      storage_path: publicUrl.publicUrl,
      alt_text: safeAlt || "Imagen de la propiedad",
      is_cover: isCover,
      sort_order: sortOrder,
    });
    if (isCover) hasCover = true;
    sortOrder += 1;
    uploaded += 1;
  }

  revalidatePath(`/admin/propiedades/${propertyId}`);
  return { uploaded, errors };
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
