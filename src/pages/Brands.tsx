import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Package, Globe, Network } from "lucide-react";
import { mockBrands, mockNetworks } from "@/lib/mock-data";
import { networkTypeLabels, networkTypeColors } from "@/lib/affiliate-utils";

export default function Brands() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brands</h1>
          <p className="text-muted-foreground">Manage affiliate networks and brand configurations.</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add Brand</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Brand</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>Brand Name</Label><Input placeholder="e.g. Amazon" /></div>
              <div><Label>Base URL</Label><Input placeholder="https://amazon.com" /></div>
              <div><Label>Network</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select network" /></SelectTrigger>
                  <SelectContent>
                    {mockNetworks.map((n) => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Affiliate Parameter Template</Label>
                <Textarea placeholder="{original_url}?tag={affiliate_id}&linkCode=ll1" className="font-mono text-sm" />
                <p className="text-xs text-muted-foreground mt-1">
                  Use placeholders: {'{original_url}'}, {'{affiliate_id}'}, {'{sub_id}'}
                </p>
              </div>
              <Button className="w-full">Add Brand</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockBrands.map((brand) => {
          const network = mockNetworks.find((n) => n.id === brand.network_id);
          return (
            <Card key={brand.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{brand.name}</CardTitle>
                  <Badge className={networkTypeColors[brand.network_type]}>
                    {networkTypeLabels[brand.network_type]}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-1">
                  <Globe className="h-3 w-3" /> {brand.base_url}
                </CardDescription>
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
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Template:</p>
                    <code className="text-xs bg-muted p-2 rounded block break-all">
                      {brand.affiliate_param_template}
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
