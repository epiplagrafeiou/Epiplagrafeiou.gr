
import { Logo } from '@/components/icons/Logo';
import { Mail, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t bg-secondary">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          
          <div className="flex flex-col items-start gap-4">
            <Logo />
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Epipla Graphiou. All rights reserved.
            </p>
            <div className="flex flex-col space-y-2">
                <Link href="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground">
                    Πολιτική απορρήτου
                </Link>
                <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
                    Admin Panel
                </Link>
            </div>
          </div>

          <div className="md:col-span-2">
            <h3 className="mb-4 text-lg font-semibold">Στοιχεία Επιχείρησης</h3>
            <div className="space-y-4 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Επωνυμία: Ανδρέας Γιωργαράς</p>
                <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 flex-shrink-0 text-primary" />
                    <span>Διεύθυνση: Καναδά 11, 851 00 Ρόδος, Ελλάδα</span>
                </div>
                <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <span>Τηλέφωνο: <a href="tel:2241021087" className="hover:text-foreground">22410 21087</a></span>
                </div>
                <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                     <span>Email: <a href="mailto:salesepiplagrafeiou@gmail.com" className="hover:text-foreground">salesepiplagrafeiou@gmail.com</a></span>
                </div>
                 <p>ΑΦΜ: EL047290419</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
