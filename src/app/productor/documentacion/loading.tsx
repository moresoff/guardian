import { EsqueletoLista, EsqueletoTitulo } from "@/components/ui/primitivos";

export default function Cargando() {
  return (
    <div>
      <EsqueletoTitulo />
      <EsqueletoLista filas={4} />
    </div>
  );
}
