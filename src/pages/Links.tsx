import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Copy, Link2, ExternalLink } from "lucide-react";
import { mockProducts, mockAffiliateLinks, mockBrands } from "@/lib/mock-data";
import { generateAffiliateUrl, generateShortCode } from "@/lib/affiliate-utils";
import { toast } from "sonner";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Affiliate Links</h1>
        <p className="text-muted-foreground">Generate and manage affiliate links for your products.</p>
      </div>

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
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Links</CardTitle>
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
