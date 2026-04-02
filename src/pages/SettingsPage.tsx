import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Save, Plus, Trash2, Shield, KeyRound } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useNetworks, useUserCredentials, useProfile } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  const { data: networks } = useNetworks();
  const { data: credentials, isLoading } = useUserCredentials();
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [newCred, setNewCred] = useState({ network_id: "", affiliate_id: "", api_token: "" });
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [utmLoaded, setUtmLoaded] = useState(false);

  // Load UTM values from profile
  if (profile && !utmLoaded) {
    setUtmSource(profile.utm_source || "");
    setUtmMedium(profile.utm_medium || "");
    setUtmCampaign(profile.utm_campaign || "");
    setUtmLoaded(true);
  }

  const handleAdd = async () => {
    if (!user) return;
    const { error } = await supabase.from("user_credentials").insert({
      user_id: user.id,
      network_id: newCred.network_id,
      affiliate_id: newCred.affiliate_id,
      api_token_encrypted: newCred.api_token || null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Credential saved!");
      setAddOpen(false);
      setNewCred({ network_id: "", affiliate_id: "", api_token: "" });
      queryClient.invalidateQueries({ queryKey: ["user_credentials"] });
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("user_credentials").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Credential removed!");
      queryClient.invalidateQueries({ queryKey: ["user_credentials"] });
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({
      utm_source: utmSource || null,
      utm_medium: utmMedium || null,
      utm_campaign: utmCampaign || null,
    }).eq("id", user.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Settings saved!");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure your network credentials and default parameters.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> Network Credentials</CardTitle>
            <CardDescription>Your affiliate IDs and API tokens for each network. Tokens are encrypted at rest.</CardDescription>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add Credential</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Network Credential</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Network</Label>
                  <Select value={newCred.network_id} onValueChange={(v) => setNewCred({ ...newCred, network_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select network" /></SelectTrigger>
                    <SelectContent>{(networks || []).map((n) => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Affiliate ID</Label><Input placeholder="e.g. mystore-20" value={newCred.affiliate_id} onChange={(e) => setNewCred({ ...newCred, affiliate_id: e.target.value })} /></div>
                <div>
                  <Label>API Token (optional)</Label>
                  <Input type="password" placeholder="Enter API token..." value={newCred.api_token} onChange={(e) => setNewCred({ ...newCred, api_token: e.target.value })} />
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Shield className="h-3 w-3" /> Encrypted before storage
                  </p>
                </div>
                <Button className="w-full" onClick={handleAdd} disabled={!newCred.network_id || !newCred.affiliate_id}>Save Credential</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Network</TableHead>
                  <TableHead>Affiliate ID</TableHead>
                  <TableHead>API Token</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(credentials || []).map((cred) => (
                  <TableRow key={cred.id}>
                    <TableCell className="font-medium">{cred.networks?.name}</TableCell>
                    <TableCell><code className="text-sm bg-muted px-2 py-0.5 rounded">{cred.affiliate_id}</code></TableCell>
                    <TableCell>
                      {cred.api_token_encrypted ? (
                        <Badge className="bg-emerald-100 text-emerald-800">
                          <Shield className="mr-1 h-3 w-3" /> Stored
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Not set</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(cred.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(credentials || []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No credentials configured. Add your first network credential to start generating affiliate links.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default UTM Parameters</CardTitle>
          <CardDescription>Applied automatically to all generated affiliate links.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div><Label>UTM Source</Label><Input placeholder="affiliatehub" value={utmSource} onChange={(e) => setUtmSource(e.target.value)} /></div>
          <div><Label>UTM Medium</Label><Input placeholder="affiliate" value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)} /></div>
          <div><Label>UTM Campaign</Label><Input placeholder="default" value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} /></div>
        </CardContent>
      </Card>

      <Button onClick={handleSaveSettings}><Save className="mr-2 h-4 w-4" /> Save Settings</Button>
    </div>
  );
}
