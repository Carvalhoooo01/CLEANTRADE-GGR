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
      <body className="font-sans bg-[#f7faf7] text-gray-900 leading-normal">
        <AppProvider>
          <ClientLayout>{children}</ClientLayout>
        </AppProvider>
      </body>
    </html>
  );
}
