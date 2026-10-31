import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Poppins } from "next/font/google";
import { SiteFrame } from "@/components/SiteFrame";
import { usuarioActual } from "@/lib/sesion";
import "./globals.css";
import "./website.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Guardian — Participá en ciclos ganaderos",
  description:
    "Plataforma que conecta colaboradores con productores ganaderos para participar en ciclos de engorde, con la documentación del lote a la vista.",
};

/** La barra del navegador en el teléfono acompaña el fondo de la página. */
export const viewport: Viewport = {
  themeColor: "#f5f5f3",
  colorScheme: "only light",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const usuario = await usuarioActual();
  const conSesion = usuario !== null;
  return (
    <html
      lang="es-AR"
      className={`${poppins.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SiteFrame
          conSesion={conSesion}
          nombre={usuario?.nombre ?? null}
          lado={usuario?.lado ?? null}
        >
          {children}
        </SiteFrame>
      </body>
    </html>
  );
}
