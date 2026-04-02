import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Copy, Link2, ExternalLink, RefreshCw, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { mockProducts, mockAffiliateLinks, mockBrands } from "@/lib/mock-data";
import { generateAffiliateUrl, generateShortCode, healthStatusLabels, healthStatusColors } from "@/lib/affiliate-utils";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

export default function Links() {
  const [selectedProduct, setSelectedProduct] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState("");

  const handleGenerate = () => {
    const product = mockProducts.find((p) => p.id === selectedProduct);
    if (!product) return;
    const brand = mockBrands.find((b) => b.id === product.brand_id);
    if (!brand) return;
    const url = generateAffiliateUrl(brand.affiliate_param_template, product.original_url, {
      affiliate_id: "my-affiliate-id",
      sub_id: "campaign-1",
    });
    setGeneratedUrl(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const brokenCount = mockAffiliateLinks.filter((l) => l.health_status === "broken").length;

  const HealthIcon = ({ status }: { status: string }) => {
    if (status === "healthy") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    if (status === "broken") return <XCircle className="h-4 w-4 text-red-600" />;
    return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Affiliate Links</h1>
        <p className="text-muted-foreground">Generate and manage affiliate links for your products.</p>
      </div>

      {brokenCount > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="flex items-center gap-3 py-3">
            <XCircle className="h-5 w-5 text-destructive" />
            <span className="text-sm font-medium">{brokenCount} broken link{brokenCount > 1 ? "s" : ""} detected — products may be unavailable or returning errors.</span>
            <Button variant="outline" size="sm" className="ml-auto">
              <RefreshCw className="mr-2 h-3 w-3" /> Recheck All
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5" /> Link Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Select Product</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger><SelectValue placeholder="Choose a product..." /></SelectTrigger>
                <SelectContent>
                  {mockProducts.filter((p) => p.is_active).map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.brand_name})</SelectItem>
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
                  <p className="text-xs text-muted-foreground">
                    Short code: <Badge variant="secondary">{generateShortCode(mockProducts.find((p) => p.id === selectedProduct)?.name || "")}</Badge>
                  </p>
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
          <CardTitle>Existing Links</CardTitle>
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-3 w-3" /> Refresh Health
          </Button>
        </CardHeader>
        <CardContent>
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
              {mockAffiliateLinks.map((link) => (
                <TableRow key={link.id}>
                  <TableCell className="font-medium">{link.product_name}</TableCell>
                  <TableCell><Badge variant="secondary">{link.short_code}</Badge></TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs font-mono">{link.affiliate_url}</TableCell>
                  <TableCell className="text-right">{link.clicks.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{link.conversions}</TableCell>
                  <TableCell className="text-right">${link.revenue.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <HealthIcon status={link.health_status} />
                      <Badge className={healthStatusColors[link.health_status]}>
                        {healthStatusLabels[link.health_status]}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(link.affiliate_url)}>
                        <Copy className="h-3 w-3" />
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
        </CardContent>
      </Card>
    </div>
  );
}
