import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search } from "lucide-react";
import { useProducts, useBrands } from "@/hooks/useSupabaseData";
import { availabilityLabels, availabilityColors } from "@/lib/affiliate-utils";
import { CsvImportDialog } from "@/components/CsvImportDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export default function Products() {
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ title: "", sku: "", brand_id: "", price: "", category: "", description: "", merchant_id: "", availability_status: "unknown", affiliate_url_template: "" });

  const { data: products, isLoading: loadingProducts } = useProducts();
  const { data: brands, isLoading: loadingBrands } = useBrands();
  const queryClient = useQueryClient();

  const categories = [...new Set((products || []).map((p) => p.category).filter(Boolean))];

  const filtered = (products || []).filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesBrand = brandFilter === "all" || p.brand_id === brandFilter;
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    const matchesAvailability = availabilityFilter === "all" || p.availability_status === availabilityFilter;
    return matchesSearch && matchesBrand && matchesCategory && matchesAvailability;
  });

  const handleAddProduct = async () => {
    const brand = brands?.find((b) => b.id === newProduct.brand_id);
    const { error } = await supabase.from("products").insert({
      title: newProduct.title,
      sku: newProduct.sku,
      brand_id: newProduct.brand_id || null,
      network_id: brand?.network_id || null,
      price: parseFloat(newProduct.price) || null,
      category: newProduct.category || null,
      description: newProduct.description || null,
      merchant_id: newProduct.merchant_id || null,
      availability_status: (newProduct.availability_status as "in_stock" | "out_of_stock" | "unknown") || "unknown",
      affiliate_url_template: newProduct.affiliate_url_template || null,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Product added!");
      setAddOpen(false);
      setNewProduct({ title: "", sku: "", brand_id: "", price: "", category: "", description: "", merchant_id: "", availability_status: "unknown", affiliate_url_template: "" });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your affiliate product catalog.</p>
        </div>
        <div className="flex gap-2">
          <CsvImportDialog
            brands={(brands || []).map((b) => ({ id: b.id, name: b.name, network_id: b.network_id }))}
            onImportComplete={() => queryClient.invalidateQueries({ queryKey: ["products"] })}
          />
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add Product</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add New Product</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Product Name</Label><Input placeholder="e.g. Sony WH-1000XM5" value={newProduct.title} onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })} /></div>
                <div><Label>SKU</Label><Input placeholder="e.g. B09XS7JWHH" value={newProduct.sku} onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })} /></div>
                <div><Label>Brand</Label>
                  <Select value={newProduct.brand_id} onValueChange={(v) => setNewProduct({ ...newProduct, brand_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                    <SelectContent>{(brands || []).map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Price</Label><Input type="number" placeholder="0.00" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} /></div>
                  <div><Label>Category</Label><Input placeholder="Electronics" value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} /></div>
                </div>
                <div><Label>Availability</Label>
                  <Select value={newProduct.availability_status} onValueChange={(v) => setNewProduct({ ...newProduct, availability_status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(availabilityLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Description</Label><Textarea placeholder="Product description..." value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} /></div>
                <Button className="w-full" onClick={handleAddProduct} disabled={!newProduct.title || !newProduct.sku}>Add Product</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name or SKU..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Brands" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {(brands || []).map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => <SelectItem key={c} value={c!}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Availability" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {Object.entries(availabilityLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loadingProducts || loadingBrands ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium">No products yet</p>
              <p className="text-sm">Add products manually or import from CSV</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{p.sku}</code></TableCell>
                    <TableCell>{p.brands?.name || "—"}</TableCell>
                    <TableCell>{p.category ? <Badge variant="outline">{p.category}</Badge> : "—"}</TableCell>
                    <TableCell className="text-right">{p.price ? `$${Number(p.price).toFixed(2)}` : "—"}</TableCell>
                    <TableCell>
                      <Badge className={availabilityColors[p.availability_status]}>
                        {availabilityLabels[p.availability_status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.status === "active" ? "default" : "secondary"}>
                        {p.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
