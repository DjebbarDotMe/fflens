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
  description: string | null;
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
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const queryClient = useQueryClient();

  const buildSearchBody = (page: number): Record<string, unknown> => {
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
    body.page = page;
    return body;
  };

  const handleSearch = async () => {
    setSearching(true);
    setSearched(true);
    setSelected(new Set());
    setCurrentPage(1);
    try {
      const { data, error } = await supabase.functions.invoke("affiliate-search", {
        body: buildSearchBody(1),
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        setResults([]);
        setTotalCount(0);
        return;
      }
      setResults(data.products || []);
      setTotalCount(data.total || 0);
      if ((data.products || []).length === 0) {
        toast.info("No products found matching your search.");
      }
    } catch (err: any) {
      toast.error(err.message || "Search failed");
      setResults([]);
      setTotalCount(0);
    } finally {
      setSearching(false);
    }
  };

  const handleLoadMore = async () => {
    const nextPage = currentPage + 1;
    setLoadingMore(true);
    try {
      const { data, error } = await supabase.functions.invoke("affiliate-search", {
        body: buildSearchBody(nextPage),
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      const newProducts = data.products || [];
      if (newProducts.length === 0) {
        toast.info("No more results.");
        return;
      }
      setResults((prev) => [...prev, ...newProducts]);
      setCurrentPage(nextPage);
    } catch (err: any) {
      toast.error(err.message || "Failed to load more");
    } finally {
      setLoadingMore(false);
    }
  };

  const importProducts = async (productsToImport: AffiliateProduct[]) => {
    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("import-affiliate-products", {
        body: { products: productsToImport },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      const inserted = data.inserted ?? 0;
      const failed = data.failed ?? 0;
      toast.success(`Imported ${inserted} product${inserted !== 1 ? "s" : ""}${failed > 0 ? ` (${failed} failed)` : ""}`);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setSelected(new Set());
    } catch (err: any) {
      toast.error(`Import failed: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const importSingle = (product: AffiliateProduct) => importProducts([product]);

  const importSelected = () => {
    const products = Array.from(selected).map((i) => results[i]);
    importProducts(products);
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

  const hasMore = results.length < totalCount;

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
                    <p className="text-sm text-muted-foreground">
                      Showing {results.length} of {totalCount} result{totalCount !== 1 ? "s" : ""}
                    </p>
                    {selected.size > 0 && (
                      <Button size="sm" onClick={importSelected} disabled={importing}>
                        {importing ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-2 h-3.5 w-3.5" />}
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
                                disabled={importing}
                                onClick={() => importSingle(p)}
                              >
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Load More */}
                {hasMore && results.length > 0 && (
                  <div className="flex justify-center pt-2">
                    <Button variant="outline" onClick={handleLoadMore} disabled={loadingMore}>
                      {loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Load More
                    </Button>
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
