import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, ChevronDown, ChevronUp, Download, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface AffiliateProduct {
  name: string;
  brand: string;
  barcode: string | null;
  asin: string | null;
  sku: string;
  mpn: string | null;
  regular_price: number;
  sale_price: number | null;
  commission_rate: number | null;
  commission_url: string;
  merchant_id: string;
  merchant_name: string;
  network_name: string;
  in_stock: boolean;
  on_sale: boolean;
  image_url: string | null;
  category: string | null;
  currency: string;
}

export function AffiliateSearchPanel() {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [brand, setBrand] = useState("");
  const [barcode, setBarcode] = useState("");
  const [asin, setAsin] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [inStock, setInStock] = useState(false);
  const [onSale, setOnSale] = useState(false);
  const [results, setResults] = useState<AffiliateProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();

  const handleSearch = async () => {
    setSearching(true);
    setSearched(true);
    setSelected(new Set());
    try {
      const body: Record<string, unknown> = {};
      if (keyword) body.keyword = keyword;
      if (brand) body.brand = brand;
      if (barcode) body.barcode = barcode;
      if (asin) body.asin = asin;
      if (priceMin) body.price_min = parseFloat(priceMin);
      if (priceMax) body.price_max = parseFloat(priceMax);
      if (inStock) body.in_stock = true;
      if (onSale) body.on_sale = true;
      body.limit = 50;

      const { data, error } = await supabase.functions.invoke("affiliate-search", { body });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        setResults([]);
        return;
      }
      setResults(data.products || []);
      if ((data.products || []).length === 0) {
        toast.info("No products found matching your search.");
      }
    } catch (err: any) {
      toast.error(err.message || "Search failed");
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const importProduct = async (product: AffiliateProduct, index: number) => {
    setImporting((prev) => new Set(prev).add(index));
    try {
      // Look up or create brand
      let brandId: string | null = null;
      if (product.brand) {
        const { data: existing } = await supabase
          .from("brands")
          .select("id")
          .ilike("name", product.brand)
          .maybeSingle();
        if (existing) {
          brandId = existing.id;
        } else {
          const { data: newBrand } = await supabase
            .from("brands")
            .insert({ name: product.brand })
            .select("id")
            .single();
          brandId = newBrand?.id || null;
        }
      }

      // Look up the affiliate.com network
      const { data: network } = await supabase
        .from("networks")
        .select("id")
        .eq("slug", "affiliate_com")
        .maybeSingle();

      const { error } = await supabase.from("products").upsert(
        {
          title: product.name,
          sku: product.sku || `aff-${Date.now()}`,
          brand_id: brandId,
          network_id: network?.id || null,
          price: product.regular_price || null,
          sale_price: product.sale_price,
          asin: product.asin,
          barcode: product.barcode,
          mpn: product.mpn,
          commission_rate: product.commission_rate,
          commissionable: true,
          merchant_id: product.merchant_id || null,
          affiliate_url_template: product.commission_url || null,
          availability_status: product.in_stock ? "in_stock" : "out_of_stock",
          category: product.category,
          image_url: product.image_url,
          currency: product.currency || "USD",
          feed_source: "affiliate.com",
          feed_synced_at: new Date().toISOString(),
        },
        { onConflict: "network_id,merchant_id,sku" }
      );

      if (error) throw error;
      toast.success(`Imported "${product.name}"`);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (err: any) {
      toast.error(`Import failed: ${err.message}`);
    } finally {
      setImporting((prev) => {
        const n = new Set(prev);
        n.delete(index);
        return n;
      });
    }
  };

  const importSelected = async () => {
    for (const idx of selected) {
      await importProduct(results[idx], idx);
    }
    setSelected(new Set());
  };

  const toggleSelect = (idx: number) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(idx)) n.delete(idx);
      else n.add(idx);
      return n;
    });
  };

  const toggleAll = () => {
    if (selected.size === results.length) setSelected(new Set());
    else setSelected(new Set(results.map((_, i) => i)));
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between px-6 py-4 hover:bg-accent/50 transition-colors rounded-t-lg text-left">
            <div className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-primary" />
              <span className="font-semibold">Search Affiliate.com Catalog</span>
            </div>
            {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Search fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs">Keyword</Label>
                <Input placeholder="e.g. wireless headphones" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Brand</Label>
                <Input placeholder="e.g. Sony" value={brand} onChange={(e) => setBrand(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Barcode / EAN</Label>
                <Input placeholder="e.g. 4548736099814" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">ASIN</Label>
                <Input placeholder="e.g. B09XS7JWHH" value={asin} onChange={(e) => setAsin(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex items-center gap-2">
                <Input type="number" placeholder="Min $" className="w-[100px]" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />
                <span className="text-muted-foreground text-sm">–</span>
                <Input type="number" placeholder="Max $" className="w-[100px]" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <Switch id="inStock" checked={inStock} onCheckedChange={setInStock} />
                <Label htmlFor="inStock" className="text-sm">In Stock Only</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="onSale" checked={onSale} onCheckedChange={setOnSale} />
                <Label htmlFor="onSale" className="text-sm">On Sale</Label>
              </div>
              <Button onClick={handleSearch} disabled={searching}>
                {searching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Search
              </Button>
            </div>

            {/* Results */}
            {searched && (
              <div className="space-y-2">
                {results.length > 0 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{results.length} result{results.length !== 1 ? "s" : ""}</p>
                    {selected.size > 0 && (
                      <Button size="sm" onClick={importSelected}>
                        <Download className="mr-2 h-3.5 w-3.5" />
                        Import {selected.size} selected
                      </Button>
                    )}
                  </div>
                )}
                {results.length > 0 && (
                  <div className="border rounded-md overflow-auto max-h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">
                            <Checkbox checked={selected.size === results.length && results.length > 0} onCheckedChange={toggleAll} />
                          </TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Brand</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Sale</TableHead>
                          <TableHead>Merchant</TableHead>
                          <TableHead>Availability</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.map((p, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <Checkbox checked={selected.has(i)} onCheckedChange={() => toggleSelect(i)} />
                            </TableCell>
                            <TableCell className="font-medium max-w-[250px] truncate">{p.name}</TableCell>
                            <TableCell>{p.brand || "—"}</TableCell>
                            <TableCell className="text-right">{p.regular_price ? `$${p.regular_price.toFixed(2)}` : "—"}</TableCell>
                            <TableCell className="text-right">
                              {p.sale_price ? (
                                <span className="text-green-600 font-medium">${p.sale_price.toFixed(2)}</span>
                              ) : "—"}
                            </TableCell>
                            <TableCell>{p.merchant_name || "—"}</TableCell>
                            <TableCell>
                              <Badge variant={p.in_stock ? "default" : "secondary"}>
                                {p.in_stock ? "In Stock" : "Out of Stock"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={importing.has(i)}
                                onClick={() => importProduct(p, i)}
                              >
                                {importing.has(i) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                {searched && !searching && results.length === 0 && (
                  <p className="text-center py-6 text-muted-foreground text-sm">No results found. Try a different search.</p>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
