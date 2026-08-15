"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Buscador del hero — a diferencia de FilterBar (que vive en /propiedades y
// lee/escribe la URL actual vía usePropertyFilters), este arma la primera
// navegación hacia /propiedades con los params iniciales. Deliberadamente
// simple: operación + tipo + ciudad, los filtros finos viven en el listado.
export function HeroSearch() {
  const router = useRouter();
  const [operacion, setOperacion] = useState("todas");
  const [tipo, setTipo] = useState("todos");
  const [ciudad, setCiudad] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (operacion !== "todas") params.set("operacion", operacion);
    if (tipo !== "todos") params.set("tipo", tipo);
    if (ciudad.trim()) params.set("ciudad", ciudad.trim());
    router.push(`/propiedades${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid w-full grid-cols-1 gap-3 rounded-[var(--radius)] border border-border bg-background p-4 shadow-lg sm:grid-cols-2 md:grid-cols-[1fr_1fr_1.4fr_auto] md:p-3"
    >
      <Select value={operacion} onValueChange={setOperacion}>
        <SelectTrigger>
          <SelectValue placeholder="Operación" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Comprar o alquilar</SelectItem>
          <SelectItem value="venta">Venta</SelectItem>
          <SelectItem value="alquiler">Alquiler</SelectItem>
          <SelectItem value="alquiler_temporal">Alquiler temporal</SelectItem>
        </SelectContent>
      </Select>

      <Select value={tipo} onValueChange={setTipo}>
        <SelectTrigger>
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Cualquier tipo</SelectItem>
          <SelectItem value="casa">Casa</SelectItem>
          <SelectItem value="apartamento">Apartamento</SelectItem>
          <SelectItem value="local_comercial">Local comercial</SelectItem>
          <SelectItem value="oficina">Oficina</SelectItem>
          <SelectItem value="terreno">Terreno</SelectItem>
          <SelectItem value="edificio">Edificio</SelectItem>
          <SelectItem value="finca">Finca</SelectItem>
        </SelectContent>
      </Select>

      <Input
        placeholder="Ciudad — ej. Ciudad de México"
        value={ciudad}
        onChange={(e) => setCiudad(e.target.value)}
      />

      <Button type="submit" className="md:px-6">
        <Search className="size-4" />
        Buscar
      </Button>
    </form>
  );
}
