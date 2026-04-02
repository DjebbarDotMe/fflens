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
import { mockNetworks, mockUserCredentials } from "@/lib/mock-data";

export default function SettingsPage() {
  const [credentials, setCredentials] = useState(mockUserCredentials);
  const handleSave = () => toast.success("Settings saved!");

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
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add Credential</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Network Credential</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Network</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select network" /></SelectTrigger>
                    <SelectContent>
                      {mockNetworks.map((n) => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Affiliate ID</Label><Input placeholder="e.g. mystore-20" /></div>
                <div>
                  <Label>API Token (optional)</Label>
                  <Input type="password" placeholder="Enter API token..." />
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Shield className="h-3 w-3" /> Encrypted with AES-256 before storage
                  </p>
                </div>
                <Button className="w-full">Save Credential</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
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
              {credentials.map((cred) => (
                <TableRow key={cred.id}>
                  <TableCell className="font-medium">{cred.network_name}</TableCell>
                  <TableCell><code className="text-sm bg-muted px-2 py-0.5 rounded">{cred.affiliate_id}</code></TableCell>
                  <TableCell>
                    {cred.has_api_token ? (
                      <Badge className="bg-emerald-100 text-emerald-800">
                        <Shield className="mr-1 h-3 w-3" /> Stored
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Not set</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {credentials.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No credentials configured. Add your first network credential to start generating affiliate links.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
