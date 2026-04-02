import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Save } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const handleSave = () => toast.success("Settings saved!");

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure your affiliate IDs and default parameters.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Affiliate IDs</CardTitle>
          <CardDescription>Set your affiliate ID for each network. These are used when generating links.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Amazon Associates Tag</Label><Input placeholder="mystore-20" /></div>
          <div><Label>ShareASale Affiliate ID</Label><Input placeholder="123456" /></div>
          <div><Label>CJ Affiliate ID</Label><Input placeholder="cj-12345" /></div>
          <div><Label>Rakuten Affiliate ID</Label><Input placeholder="rak-12345" /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default UTM Parameters</CardTitle>
          <CardDescription>Applied automatically to all generated affiliate links.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div><Label>UTM Source</Label><Input placeholder="affiliatehub" /></div>
          <div><Label>UTM Medium</Label><Input placeholder="affiliate" /></div>
          <div><Label>UTM Campaign</Label><Input placeholder="default" /></div>
        </CardContent>
      </Card>

      <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save Settings</Button>
    </div>
  );
}
