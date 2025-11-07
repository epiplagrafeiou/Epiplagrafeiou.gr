import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

export default function SettingsPage() {
  return (
    <div className="p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Settings</h2>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Store Settings</CardTitle>
          <CardDescription>
            Manage your store's general settings and preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-2">
            <Label htmlFor="storeName">Store Name</Label>
            <Input id="storeName" defaultValue="Epipla Graphiou AI eShop" />
          </div>

          <Separator />

          <div className="space-y-4">
             <h3 className="text-lg font-medium">Localization</h3>
              <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label htmlFor="lang-en">English Language</Label>
                    <p className="text-sm text-muted-foreground">Enable English language support for products and UI.</p>
                  </div>
                  <Switch id="lang-en" defaultChecked />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label htmlFor="lang-gr">Greek Language</Label>
                    <p className="text-sm text-muted-foreground">Enable Greek language support for products and UI.</p>
                  </div>
                  <Switch id="lang-gr" defaultChecked />
              </div>
          </div>
          
           <Separator />

           <div className="space-y-4">
             <h3 className="text-lg font-medium">Currency</h3>
              <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label htmlFor="curr-eur">Euro (EUR)</Label>
                    <p className="text-sm text-muted-foreground">Set Euro as the primary currency.</p>
                  </div>
                  <Switch id="curr-eur" defaultChecked />
              </div>
          </div>

          <div className="flex justify-end">
            <Button>Save Changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
