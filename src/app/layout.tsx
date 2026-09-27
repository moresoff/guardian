import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Poppins } from "next/font/google";
import { Nav } from "@/components/nav";
import "./globals.css";

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
  title: "Guardian — Financiamiento de ciclos ganaderos",
  description:
    "Plataforma que conecta colaboradores con productores ganaderos que necesitan capital de trabajo para el ciclo de engorde.",
};

/** La barra del navegador en el teléfono acompaña el fondo de la página. */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f3" },
    { media: "(prefers-color-scheme: dark)", color: "#10130f" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-AR"
      className={`${poppins.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/*
          Con teclado, sin esto hay que pasar por los seis enlaces del encabezado
          en cada página antes de llegar a lo que se vino a leer. Está oculto
          hasta que recibe el foco.
        */}
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-lg focus:border focus:border-borde-fuerte focus:bg-superficie focus:px-4 focus:font-medium"
        >
          Saltar al contenido
        </a>
        <Nav />
        <main id="contenido" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
          {children}
        </main>
        <footer className="border-t border-borde px-4 py-6">
          <p className="mx-auto max-w-6xl text-sm text-tinta-suave">
            <span className="font-medium">Guardian</span> — prototipo de la
            plataforma. Los datos son de prueba. Cada proyecto es una serie de un
            fideicomiso ordinario y se suma por contrato de adhesión: nada de lo que
            se muestra acá constituye oferta pública.
          </p>
        </footer>
      </body>
    </html>
  );
}
