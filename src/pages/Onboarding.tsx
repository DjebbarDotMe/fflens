import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, Plus, Trash2, SkipForward } from "lucide-react";
import { useNetworks } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface CredentialEntry {
  network_id: string;
  affiliate_id: string;
}

interface ChannelEntry {
  name: string;
  url: string;
}

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [credentials, setCredentials] = useState<CredentialEntry[]>([{ network_id: "", affiliate_id: "" }]);
  const [channels, setChannels] = useState<ChannelEntry[]>([{ name: "", url: "" }]);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { data: networks } = useNetworks();
  const navigate = useNavigate();

  const addCredential = () => setCredentials([...credentials, { network_id: "", affiliate_id: "" }]);
  const removeCredential = (i: number) => setCredentials(credentials.filter((_, idx) => idx !== i));
  const updateCredential = (i: number, field: keyof CredentialEntry, value: string) => {
    const updated = [...credentials];
    updated[i] = { ...updated[i], [field]: value };
    setCredentials(updated);
  };

  const addChannel = () => setChannels([...channels, { name: "", url: "" }]);
  const removeChannel = (i: number) => setChannels(channels.filter((_, idx) => idx !== i));
  const updateChannel = (i: number, field: keyof ChannelEntry, value: string) => {
    const updated = [...channels];
    updated[i] = { ...updated[i], [field]: value };
    setChannels(updated);
  };

  const handleSaveCredentials = async () => {
    if (!user) return;
    const valid = credentials.filter((c) => c.network_id && c.affiliate_id);
    if (valid.length === 0) {
      setStep(2);
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("user_credentials").insert(
      valid.map((c) => ({ user_id: user.id, network_id: c.network_id, affiliate_id: c.affiliate_id }))
    );
    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Credentials saved!");
      setStep(2);
    }
  };

  const handleSaveChannels = async () => {
    if (!user) return;
    const valid = channels.filter((c) => c.name.trim());
    if (valid.length === 0) {
      await completeOnboarding();
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("channels").insert(
      valid.map((c) => ({ user_id: user.id, name: c.name.trim(), url: c.url.trim() || null }))
    );
    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Channels created!");
      await completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;
    await supabase.from("profiles").update({ has_completed_onboarding: true }).eq("id", user.id);
    toast.success("Setup complete! Welcome to AffiliateHub 🎉");
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Welcome to AffiliateHub</h1>
          <p className="text-muted-foreground">Let's get you set up in just 2 quick steps.</p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
              {step > 1 ? <CheckCircle2 className="h-5 w-5" /> : <Badge variant={step === 1 ? "default" : "outline"}>1</Badge>}
              <span className="text-sm font-medium">Networks</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className={`flex items-center gap-2 ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>
              <Badge variant={step === 2 ? "default" : "outline"}>2</Badge>
              <span className="text-sm font-medium">Channels</span>
            </div>
          </div>
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Add Your Network Credentials</CardTitle>
              <CardDescription>Connect your affiliate networks by adding your IDs. You can always add more later in Settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {credentials.map((cred, i) => (
                <div key={i} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Label>Network</Label>
                    <Select value={cred.network_id} onValueChange={(v) => updateCredential(i, "network_id", v)}>
                      <SelectTrigger><SelectValue placeholder="Select network" /></SelectTrigger>
                      <SelectContent>
                        {(networks || []).map((n) => (
                          <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label>Affiliate ID</Label>
                    <Input placeholder="e.g. mystore-20" value={cred.affiliate_id} onChange={(e) => updateCredential(i, "affiliate_id", e.target.value)} />
                  </div>
                  {credentials.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeCredential(i)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addCredential}>
                <Plus className="mr-2 h-4 w-4" /> Add Another
              </Button>
              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  <SkipForward className="mr-2 h-4 w-4" /> Skip
                </Button>
                <Button onClick={handleSaveCredentials} disabled={saving}>
                  {saving ? "Saving..." : "Next"} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Create Your Channels</CardTitle>
              <CardDescription>Channels help you track where your links are shared — like "My Tech Blog" or "Instagram Bio".</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {channels.map((ch, i) => (
                <div key={i} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Label>Channel Name</Label>
                    <Input placeholder="e.g. My Tech Blog" value={ch.name} onChange={(e) => updateChannel(i, "name", e.target.value)} />
                  </div>
                  <div className="flex-1">
                    <Label>URL (optional)</Label>
                    <Input placeholder="https://myblog.com" value={ch.url} onChange={(e) => updateChannel(i, "url", e.target.value)} />
                  </div>
                  {channels.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeChannel(i)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addChannel}>
                <Plus className="mr-2 h-4 w-4" /> Add Another
              </Button>
              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={completeOnboarding}>
                  <SkipForward className="mr-2 h-4 w-4" /> Skip
                </Button>
                <Button onClick={handleSaveChannels} disabled={saving}>
                  {saving ? "Saving..." : "Complete Setup"} <CheckCircle2 className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground/50 text-center mt-4">v1.2.0</p>
    </div>
  );
}
