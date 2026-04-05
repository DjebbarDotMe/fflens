import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, AlertTriangle, ArrowRight, Globe, Tag, Package, DollarSign, Loader2, Wrench } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLinkRepairs } from "@/hooks/useSupabaseData";

interface LinkVerificationDialogProps {
  linkId: string | null;
  onClose: () => void;
}

interface Verification {
  id: string;
  checked_at: string;
  redirect_chain: { url: string; status_code: number }[];
  final_url: string | null;
  params_intact: boolean;
  missing_params: string[];
  page_title: string | null;
  product_available: boolean | null;
  price_found: number | null;
  overall_status: string;
  issues: string[];
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  healthy: { label: "Healthy", color: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
  warning: { label: "Warning", color: "bg-amber-100 text-amber-800", icon: AlertTriangle },
  broken: { label: "Broken", color: "bg-red-100 text-red-800", icon: XCircle },
  unknown: { label: "Unknown", color: "bg-muted text-muted-foreground", icon: AlertTriangle },
};

export default function LinkVerificationDialog({ linkId, onClose }: LinkVerificationDialogProps) {
  const { data: verification, isLoading } = useQuery({
    queryKey: ["link_verification", linkId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("link_verifications")
        .select("*")
        .eq("link_id", linkId!)
        .order("checked_at", { ascending: false })
        .limit(1)
        .single();
      if (error) throw error;
      return data as unknown as Verification;
    },
    enabled: !!linkId,
  });

  const { data: repairs } = useLinkRepairs(linkId);

  const config = statusConfig[verification?.overall_status || "unknown"];
  const StatusIcon = config.icon;

  return (
    <Dialog open={!!linkId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" /> Link Verification Details
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading verification data...</p>
          </div>
        ) : !verification ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No verification data yet. Click "Refresh Health" to run a check.</p>
          </div>
        ) : (
          <Tabs defaultValue="verification">
            <TabsList className="w-full">
              <TabsTrigger value="verification" className="flex-1">Verification</TabsTrigger>
              <TabsTrigger value="repairs" className="flex-1">
                Repairs
                {repairs && repairs.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">
                    {repairs.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="verification" className="space-y-5 mt-4">
              {/* Overall Status */}
              <div className="flex items-center justify-between">
                <Badge className={`${config.color} text-sm px-3 py-1`}>
                  <StatusIcon className="h-4 w-4 mr-1.5" />
                  {config.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(verification.checked_at).toLocaleString()}
                </span>
              </div>

              {/* Issues */}
              {verification.issues.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-destructive">Issues Found</p>
                  <ul className="space-y-1">
                    {verification.issues.map((issue, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <XCircle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Separator />

              {/* Redirect Chain */}
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <ArrowRight className="h-4 w-4" /> Redirect Chain
                </p>
                <div className="space-y-1.5">
                  {(verification.redirect_chain || []).map((hop, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <Badge
                        variant="outline"
                        className={
                          hop.status_code < 400
                            ? "text-emerald-700 border-emerald-300"
                            : "text-red-700 border-red-300"
                        }
                      >
                        {hop.status_code || "ERR"}
                      </Badge>
                      <span className="font-mono truncate max-w-[340px]" title={hop.url}>
                        {hop.url}
                      </span>
                      {i < (verification.redirect_chain || []).length - 1 && (
                        <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
                {verification.final_url && (
                  <p className="text-xs text-muted-foreground">
                    Final: <span className="font-mono">{verification.final_url}</span>
                  </p>
                )}
              </div>

              <Separator />

              {/* Parameter Check */}
              <div className="space-y-1.5">
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <Tag className="h-4 w-4" /> Tracking Parameters
                </p>
                <div className="flex items-center gap-2">
                  {verification.params_intact ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm">
                    {verification.params_intact
                      ? "All tracking parameters intact"
                      : `Missing: ${verification.missing_params.join(", ")}`}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Page Info */}
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <Package className="h-4 w-4" /> Page Content
                </p>
                <div className="space-y-1.5 text-sm">
                  {verification.page_title && (
                    <p>
                      <span className="text-muted-foreground">Title:</span>{" "}
                      {verification.page_title.substring(0, 100)}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Product:</span>
                    {verification.product_available === true && (
                      <Badge className="bg-emerald-100 text-emerald-800">Available</Badge>
                    )}
                    {verification.product_available === false && (
                      <Badge className="bg-red-100 text-red-800">Unavailable</Badge>
                    )}
                    {verification.product_available === null && (
                      <Badge variant="outline">Unknown</Badge>
                    )}
                  </div>
                  {verification.price_found !== null && (
                    <p className="flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Price found: ${verification.price_found.toFixed(2)}</span>
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="repairs" className="mt-4">
              {!repairs || repairs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Wrench className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No auto-repairs have been made for this link.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {repairs.map((repair: any) => (
                    <div key={repair.id} className="rounded-md border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          <Wrench className="h-3 w-3 mr-1" />
                          {repair.reason || "auto-repair"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(repair.repaired_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs space-y-1">
                        <p>
                          <span className="text-muted-foreground">Old:</span>{" "}
                          <span className="font-mono truncate">{repair.old_url}</span>
                        </p>
                        <p>
                          <span className="text-muted-foreground">New:</span>{" "}
                          <span className="font-mono truncate">{repair.new_url}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
