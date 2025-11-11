
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MapPin, Phone } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="font-headline text-3xl font-bold">Τρόποι Επικοινωνίας</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Είμαστε εδώ για να σας βοηθήσουμε.
      </p>

      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-2">
        
        <Card>
          <CardHeader>
            <CardTitle>Στείλτε Μας Μήνυμα</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Όνομα</Label>
                <Input id="name" placeholder="Το όνομά σας" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Το μήνυμά σας</Label>
                <Textarea id="message" placeholder="Γράψτε το μήνυμά σας εδώ..." />
              </div>
              <Button type="submit" size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                Αποστολή
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-8">
            <h2 className="text-2xl font-bold">Στοιχεία Επιχείρησης</h2>
            <div className="space-y-6 text-muted-foreground">
                <p className="font-semibold text-lg text-foreground">Επωνυμία: Ανδρέας Γιωργαράς</p>
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 rounded-full bg-primary/10 p-3">
                        <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground">Διεύθυνση</h3>
                        <p>Καναδά 11, 851 00 Ρόδος, Ελλάδα</p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 rounded-full bg-primary/10 p-3">
                        <Phone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground">Τηλέφωνο</h3>
                        <p><a href="tel:2241021087" className="hover:text-foreground">22410 21087</a></p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 rounded-full bg-primary/10 p-3">
                        <Mail className="h-6 w-6 text-primary" />
                    </div>
                     <div>
                        <h3 className="font-semibold text-foreground">Email</h3>
                        <p><a href="mailto:salesepiplagrafeiou@gmail.com" className="hover:text-foreground">salesepiplagrafeiou@gmail.com</a></p>
                    </div>
                </div>
                 <p className="text-sm">ΑΦΜ: EL047290419</p>
            </div>
        </div>

      </div>
    </div>
  );
}
