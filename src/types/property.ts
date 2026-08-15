// Modelo de datos — ver ARCHITECTURE.md sección 4. Estos tipos son el contrato
// entre la UI (FASE 2/3, contra datos mock) y la capa real (FASE 4, Drizzle +
// Supabase) — cuando se conecte la base real, estos tipos no deberían cambiar.

export type OperationType = "venta" | "alquiler" | "alquiler_temporal";

export type PropertyType =
  | "casa"
  | "apartamento"
  | "local_comercial"
  | "oficina"
  | "terreno"
  | "edificio"
  | "finca";

export type PropertyStatus = "borrador" | "publicada" | "pausada" | "archivada";

export type PricePeriod = "unico" | "mensual";

export interface AmenityCategory {
  id: string;
  name: string;
  sortOrder: number;
}

export interface Amenity {
  id: string;
  categoryId: string;
  name: string;
  iconKey: string; // referencia a un ícono coherente — nunca un emoji suelto
}

export interface Agency {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  photoUrl?: string;
  agencyId: string;
}

export interface PropertyImage {
  id: string;
  url: string;
  alt: string;
  sortOrder: number;
  isCover: boolean;
}

export interface Property {
  id: string;
  slug: string; // {ciudad}-{operacion}-{tipo}-{titulo}-{nanoid8} — no secuencial
  operationType: OperationType;
  propertyType: PropertyType;
  status: PropertyStatus;
  title: string;
  description: string;
  priceAmount: number;
  priceCurrency: string; // ISO 4217, ej. "USD"
  pricePeriod: PricePeriod | null;
  bedrooms: number;
  bathrooms: number;
  parkingSpots: number;
  areaBuiltM2: number;
  areaLandM2: number | null;
  yearBuilt: number | null;
  addressLine: string;
  city: string;
  stateRegion: string;
  countryCode: string;
  lat: number;
  lng: number;
  agentId: string;
  agencyId: string;
  amenityIds: string[];
  images: PropertyImage[];
  viewCount: number;
  publishedAt: string; // ISO date
}

// Forma liviana para tarjetas de listado — lo que devuelve el RPC
// search_properties (no trae galería completa ni descripción).
export interface PropertyListItem {
  id: string;
  slug: string;
  operationType: OperationType;
  propertyType: PropertyType;
  title: string;
  priceAmount: number;
  priceCurrency: string;
  pricePeriod: PricePeriod | null;
  bedrooms: number;
  bathrooms: number;
  parkingSpots: number;
  areaBuiltM2: number;
  city: string;
  stateRegion: string;
  viewCount: number;
  publishedAt: string;
  coverImageUrl: string | null;
  coverImageAlt: string;
}

// Lo que devuelve el RPC get_property_by_slug — ficha completa + agente embebido.
export interface PropertyDetail
  extends Omit<Property, "agentId" | "agencyId" | "status"> {
  agent: Pick<Agent, "id" | "name" | "email" | "phone" | "whatsapp"> | null;
}
