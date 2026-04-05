import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useProducts, useBrands } from "@/hooks/useSupabaseData";
import { availabilityLabels, availabilityColors } from "@/lib/affiliate-utils";
import { CsvImportDialog } from "@/components/CsvImportDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

type ProductForm = {
  title: string; sku: string; brand_id: string; price: string; category: string;
  description: string; merchant_id: string; availability_status: string; affiliate_url_template: string;
};

const emptyProduct: ProductForm = { title: "", sku: "", brand_id: "", price: "", category: "", description: "", merchant_id: "", availability_status: "unknown", affiliate_url_template: "" };

export default function Products() {
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [newProduct, setNewProduct] = useState<ProductForm>({ ...emptyProduct });
  const [editingProduct, setEditingProduct] = useState<(ProductForm & { id: string }) | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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
      title: newProduct.title, sku: newProduct.sku, brand_id: newProduct.brand_id || null,
      network_id: brand?.network_id || null, price: parseFloat(newProduct.price) || null,
      category: newProduct.category || null, description: newProduct.description || null,
      merchant_id: newProduct.merchant_id || null,
      availability_status: (newProduct.availability_status as "in_stock" | "out_of_stock" | "unknown") || "unknown",
      affiliate_url_template: newProduct.affiliate_url_template || null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Product added!");
      setAddOpen(false);
      setNewProduct({ ...emptyProduct });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    }
  };

  const handleEditProduct = async () => {
    if (!editingProduct) return;
    const brand = brands?.find((b) => b.id === editingProduct.brand_id);
    const { error } = await supabase.from("products").update({
      title: editingProduct.title, sku: editingProduct.sku, brand_id: editingProduct.brand_id || null,
      network_id: brand?.network_id || null, price: parseFloat(editingProduct.price) || null,
      category: editingProduct.category || null, description: editingProduct.description || null,
      merchant_id: editingProduct.merchant_id || null,
      availability_status: (editingProduct.availability_status as "in_stock" | "out_of_stock" | "unknown") || "unknown",
      affiliate_url_template: editingProduct.affiliate_url_template || null,
    }).eq("id", editingProduct.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Product updated!");
      setEditingProduct(null);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Product deleted!");
      setDeleteConfirmId(null);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    }
  };

  const ProductFormFields = ({ product, onChange }: { product: ProductForm; onChange: (p: ProductForm) => void }) => (
    <div className="space-y-4">
      <div><Label>Product Name</Label><Input placeholder="e.g. Sony WH-1000XM5" value={product.title} onChange={(e) => onChange({ ...product, title: e.target.value })} /></div>
      <div><Label>SKU</Label><Input placeholder="e.g. B09XS7JWHH" value={product.sku} onChange={(e) => onChange({ ...product, sku: e.target.value })} /></div>
      <div><Label>Brand</Label>
        <Select value={product.brand_id} onValueChange={(v) => onChange({ ...product, brand_id: v })}>
          <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
          <SelectContent>{(brands || []).map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Price</Label><Input type="number" placeholder="0.00" value={product.price} onChange={(e) => onChange({ ...product, price: e.target.value })} /></div>
        <div><Label>Category</Label><Input placeholder="Electronics" value={product.category} onChange={(e) => onChange({ ...product, category: e.target.value })} /></div>
      </div>
      <div><Label>Availability</Label>
        <Select value={product.availability_status} onValueChange={(v) => onChange({ ...product, availability_status: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{Object.entries(availabilityLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label>Description</Label><Textarea placeholder="Product description..." value={product.description} onChange={(e) => onChange({ ...product, description: e.target.value })} /></div>
    </div>
  );

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
              <ProductFormFields product={newProduct} onChange={setNewProduct} />
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button onClick={handleAddProduct} disabled={!newProduct.title || !newProduct.sku}>Add Product</Button>
              </DialogFooter>
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
                  <TableHead></TableHead>
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
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditingProduct({
                          id: p.id, title: p.title, sku: p.sku, brand_id: p.brand_id || "",
                          price: p.price?.toString() || "", category: p.category || "",
                          description: p.description || "", merchant_id: p.merchant_id || "",
                          availability_status: p.availability_status, affiliate_url_template: p.affiliate_url_template || "",
                        })}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteConfirmId(p.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
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
      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Product</DialogTitle></DialogHeader>
          {editingProduct && (
            <ProductFormFields product={editingProduct} onChange={(p) => setEditingProduct({ ...editingProduct, ...p })} />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProduct(null)}>Cancel</Button>
            <Button onClick={handleEditProduct}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Product</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure? This will permanently remove this product and any associated affiliate links.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && handleDeleteProduct(deleteConfirmId)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
