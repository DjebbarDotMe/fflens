import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Package, Globe, Network } from "lucide-react";
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
                    <Badge className={networkTypeColors[slug] || networkTypeColors.custom}>
                      {network?.name || "No Network"}
                    </Badge>
                  </div>
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
                    {network?.url_template && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Template:</p>
                        <code className="text-xs bg-muted p-2 rounded block break-all">{network.url_template}</code>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
