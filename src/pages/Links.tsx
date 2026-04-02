import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Copy, Link2, ExternalLink, RefreshCw, CheckCircle2, XCircle, HelpCircle, Plus, Pencil, Trash2 } from "lucide-react";
import { useProducts, useAffiliateLinks, useUserCredentials } from "@/hooks/useSupabaseData";
import { generateAffiliateUrl, generateShortCode, healthStatusLabels, healthStatusColors } from "@/lib/affiliate-utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Links() {
  const [selectedProduct, setSelectedProduct] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const [manualShortCode, setManualShortCode] = useState("");
  const [manualProductId, setManualProductId] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<{ id: string; affiliate_url: string; short_code: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: products } = useProducts();
  const { data: links, isLoading } = useAffiliateLinks();
  const { data: credentials } = useUserCredentials();

  const handleGenerate = async () => {
    const product = products?.find((p) => p.id === selectedProduct);
    if (!product || !user) return;

    const networkId = product.network_id;
    const cred = credentials?.find((c) => c.network_id === networkId);
    const affiliateId = cred?.affiliate_id || "my-affiliate-id";

    const template = product.affiliate_url_template || product.networks?.slug
      ? `{original_url}?tag={affiliate_id}` : "{original_url}?aff={affiliate_id}";

    const url = generateAffiliateUrl(template, `https://example.com/product/${product.sku}`, {
      affiliate_id: affiliateId,
      sub_id: "campaign-1",
    });
    setGeneratedUrl(url);

    const shortCode = generateShortCode(product.title);
    const { error } = await supabase.from("affiliate_links").insert({
      user_id: user.id,
      product_id: product.id,
      affiliate_url: url,
      short_code: `${shortCode}-${Date.now().toString(36)}`,
    });
    if (error) {
      if (!error.message.includes("duplicate")) toast.error(error.message);
    } else {
      toast.success("Affiliate link created!");
      queryClient.invalidateQueries({ queryKey: ["affiliate_links"] });
    }
  };

  const handleManualAdd = async () => {
    if (!user || !manualUrl.trim() || !manualProductId) return;

    const product = products?.find((p) => p.id === manualProductId);
    const shortCode = manualShortCode.trim() || generateShortCode(product?.title || "link") + `-${Date.now().toString(36)}`;

    const { error } = await supabase.from("affiliate_links").insert({
      user_id: user.id,
      product_id: manualProductId,
      affiliate_url: manualUrl.trim(),
      short_code: shortCode,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Link added successfully!");
      setManualUrl("");
      setManualShortCode("");
      setManualProductId("");
      setAddDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["affiliate_links"] });
    }
  };

  const handleEdit = async () => {
    if (!editingLink) return;
    const { error } = await supabase
      .from("affiliate_links")
      .update({
        affiliate_url: editingLink.affiliate_url,
        short_code: editingLink.short_code,
      })
      .eq("id", editingLink.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Link updated!");
      setEditingLink(null);
      queryClient.invalidateQueries({ queryKey: ["affiliate_links"] });
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("affiliate_links").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Link deleted!");
      setDeleteConfirmId(null);
      queryClient.invalidateQueries({ queryKey: ["affiliate_links"] });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const brokenCount = links?.filter((l) => l.health_status === "broken").length || 0;

  const HealthIcon = ({ status }: { status: string }) => {
    if (status === "healthy") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    if (status === "broken") return <XCircle className="h-4 w-4 text-red-600" />;
    return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Affiliate Links</h1>
          <p className="text-muted-foreground">Generate, add, and manage your affiliate links.</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Link</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Affiliate Link</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Product</Label>
                <Select value={manualProductId} onValueChange={setManualProductId}>
                  <SelectTrigger><SelectValue placeholder="Select a product..." /></SelectTrigger>
                  <SelectContent>
                    {(products || []).filter((p) => p.status === "active").map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.title} ({p.brands?.name || "Unknown"})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Affiliate URL</Label>
                <Input
                  placeholder="https://www.amazon.com/dp/B09V3K...?tag=mystore-20"
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">Paste your full affiliate link from any platform</p>
              </div>
              <div>
                <Label>Short Code (optional)</Label>
                <Input
                  placeholder="Auto-generated if empty"
                  value={manualShortCode}
                  onChange={(e) => setManualShortCode(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleManualAdd} disabled={!manualUrl.trim() || !manualProductId}>Save Link</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {brokenCount > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="flex items-center gap-3 py-3">
            <XCircle className="h-5 w-5 text-destructive" />
            <span className="text-sm font-medium">{brokenCount} broken link{brokenCount > 1 ? "s" : ""} detected</span>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5" /> Quick Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Select Product</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger><SelectValue placeholder="Choose a product..." /></SelectTrigger>
                <SelectContent>
                  {(products || []).filter((p) => p.status === "active").map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.title} ({p.brands?.name || "Unknown"})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerate} disabled={!selectedProduct}>Generate Affiliate Link</Button>
            {generatedUrl && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Generated URL</Label>
                  <div className="flex gap-2">
                    <Input value={generatedUrl} readOnly className="font-mono text-sm" />
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(generatedUrl)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>QR Code</Label>
                  <div className="inline-block p-4 bg-white rounded-lg border">
                    <QRCodeSVG value={generatedUrl} size={160} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Your Links</CardTitle>
          <Button variant="outline" size="sm"><RefreshCw className="mr-2 h-3 w-3" /> Refresh Health</Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (links || []).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium">No links yet</p>
              <p className="text-sm">Generate a link above or click "Add Link" to paste your own</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Short Code</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Conv.</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(links || []).map((link) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">{link.products?.title}</TableCell>
                    <TableCell><Badge variant="secondary">{link.short_code}</Badge></TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs font-mono">{link.affiliate_url}</TableCell>
                    <TableCell className="text-right">{(link.click_count || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right">{link.conversions || 0}</TableCell>
                    <TableCell className="text-right">${Number(link.revenue || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <HealthIcon status={link.health_status || "unknown"} />
                        <Badge className={healthStatusColors[link.health_status || "unknown"]}>
                          {healthStatusLabels[link.health_status || "unknown"]}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(link.affiliate_url)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setEditingLink({ id: link.id, affiliate_url: link.affiliate_url, short_code: link.short_code })}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteConfirmId(link.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <a href={link.affiliate_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingLink} onOpenChange={(open) => !open && setEditingLink(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Link</DialogTitle></DialogHeader>
          {editingLink && (
            <div className="space-y-4">
              <div>
                <Label>Affiliate URL</Label>
                <Input
                  value={editingLink.affiliate_url}
                  onChange={(e) => setEditingLink({ ...editingLink, affiliate_url: e.target.value })}
                />
              </div>
              <div>
                <Label>Short Code</Label>
                <Input
                  value={editingLink.short_code}
                  onChange={(e) => setEditingLink({ ...editingLink, short_code: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLink(null)}>Cancel</Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Link</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure? This will permanently remove this affiliate link and its tracking data.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
