// app/layout.jsx — layout raiz com sidebar + header + providers
import "./globals.css";
import ClientLayout from "./ClientLayout";
import { AppProvider } from "@/context/AppContext";

export const metadata = {
  title: "CleanTrade | Marketplace de Créditos de Carbono",
  description: "Plataforma digital para compra e gestão de créditos de carbono certificados",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Playfair+Display:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AppProvider>
          <ClientLayout>{children}</ClientLayout>
        </AppProvider>
      </body>
    </html>
  );
}
