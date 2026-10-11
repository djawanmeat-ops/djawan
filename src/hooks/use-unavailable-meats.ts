import { useQuery } from "@tanstack/react-query";
import { listUnavailableMeats } from "@/lib/availability.functions";

export const UNAVAILABLE_KEY = ["unavailable-meats"];

/** Viandes momentanément indisponibles (rafraîchi chaque minute). */
export function useUnavailableMeats() {
  const q = useQuery({ queryKey: UNAVAILABLE_KEY, queryFn: () => listUnavailableMeats(), staleTime: 60_000, refetchInterval: 60_000 });
  return new Set(q.data ?? []);
}
