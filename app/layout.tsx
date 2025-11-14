
import type { Metadata } from 'next';
import './globals.css';
import AppLayout from './AppLayout';
import { CartProvider } from "@/lib/cart-context";
import { SuppliersProvider } from "@/lib/suppliers-context";
import { ProductsProvider } from "@/lib/products-context";
import { FirebaseClientProvider } from "@/firebase/client-provider";

export const metadata: Metadata = {
  metadataBase: new URL('https://epiplagrafeiou.gr'),
  title: 'Epipla Graphiou AI eShop',
  description: 'Modern furniture for your home and office.',
  alternates: {
    canonical: '/',
  },
};

const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'Epipla Graphiou AI eShop',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Καναδά 11',
    addressLocality: 'Ρόδος',
    postalCode: '851 00',
    addressCountry: 'GR',
  },
  email: 'salesepiplagrafeiou@gmail.com',
  telephone: '+302241021087',
  url: 'https://epiplagrafeiou.gr',
  logo: 'https://i.postimg.cc/59LDxYRr/EpiplaGRAFEIOU.GR-removebg-preview2.png',
  image: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxsaXZpbmclMjByb29tfGVufDB8fHx8MTc2MjQ2MDM4N3ww&ixlib=rb-4.1.0&q=80&w=1080'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <SuppliersProvider>
            <ProductsProvider>
              <CartProvider>
                <AppLayout>{children}</AppLayout>
              </CartProvider>
            </ProductsProvider>
          </SuppliersProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
