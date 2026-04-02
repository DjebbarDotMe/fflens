import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Package, Globe, Network, Pencil, Trash2 } from "lucide-react";
import { useNetworks, useBrands } from "@/hooks/useSupabaseData";
import { networkTypeColors } from "@/lib/affiliate-utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export default function Brands() {
  const { data: brands, isLoading: loadingBrands } = useBrands();
  const { data: networks } = useNetworks();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [newBrand, setNewBrand] = useState({ name: "", website_url: "", network_id: "" });
  const [editingBrand, setEditingBrand] = useState<{ id: string; name: string; website_url: string; network_id: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleAdd = async () => {
    const { error } = await supabase.from("brands").insert({
      name: newBrand.name,
      website_url: newBrand.website_url || null,
      network_id: newBrand.network_id || null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Brand added!");
      setAddOpen(false);
      setNewBrand({ name: "", website_url: "", network_id: "" });
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    }
  };

  const handleEdit = async () => {
    if (!editingBrand) return;
    const { error } = await supabase.from("brands").update({
      name: editingBrand.name,
      website_url: editingBrand.website_url || null,
      network_id: editingBrand.network_id || null,
    }).eq("id", editingBrand.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Brand updated!");
      setEditingBrand(null);
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("brands").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Brand deleted!");
      setDeleteConfirmId(null);
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brands</h1>
          <p className="text-muted-foreground">Manage affiliate networks and brand configurations.</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add Brand</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Brand</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Brand Name</Label><Input placeholder="e.g. Amazon" value={newBrand.name} onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })} /></div>
              <div><Label>Website URL</Label><Input placeholder="https://amazon.com" value={newBrand.website_url} onChange={(e) => setNewBrand({ ...newBrand, website_url: e.target.value })} /></div>
              <div><Label>Network</Label>
                <Select value={newBrand.network_id} onValueChange={(v) => setNewBrand({ ...newBrand, network_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select network" /></SelectTrigger>
                  <SelectContent>{(networks || []).map((n) => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleAdd} disabled={!newBrand.name}>Add Brand</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loadingBrands ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : (brands || []).length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium">No brands yet</p>
            <p className="text-sm">Add your first brand to start organizing products</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(brands || []).map((brand) => {
            const network = brand.networks;
            const slug = network?.slug || "custom";
            return (
              <Card key={brand.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{brand.name}</CardTitle>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingBrand({ id: brand.id, name: brand.name, website_url: brand.website_url || "", network_id: brand.network_id || "" })}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteConfirmId(brand.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <Badge className={networkTypeColors[slug] || networkTypeColors.custom}>
                    {network?.name || "No Network"}
                  </Badge>
                  {brand.website_url && (
                    <CardDescription className="flex items-center gap-1">
                      <Globe className="h-3 w-3" /> {brand.website_url}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Package className="h-4 w-4" />
                      <span>{brand.product_count} products</span>
                    </div>
                    {network && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Network className="h-4 w-4" />
                        <span>{network.name}</span>
                        <Badge variant="outline" className="text-xs">{network.auth_type}</Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingBrand} onOpenChange={(open) => !open && setEditingBrand(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Brand</DialogTitle></DialogHeader>
          {editingBrand && (
            <div className="space-y-4">
              <div><Label>Brand Name</Label><Input value={editingBrand.name} onChange={(e) => setEditingBrand({ ...editingBrand, name: e.target.value })} /></div>
              <div><Label>Website URL</Label><Input value={editingBrand.website_url} onChange={(e) => setEditingBrand({ ...editingBrand, website_url: e.target.value })} /></div>
              <div><Label>Network</Label>
                <Select value={editingBrand.network_id} onValueChange={(v) => setEditingBrand({ ...editingBrand, network_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select network" /></SelectTrigger>
                  <SelectContent>{(networks || []).map((n) => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingBrand(null)}>Cancel</Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Brand</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure? This will permanently remove this brand. Products linked to it will lose their brand association.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
