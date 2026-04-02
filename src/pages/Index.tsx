import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Store, MousePointerClick, DollarSign, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useProducts, useBrands, useAffiliateLinks } from "@/hooks/useSupabaseData";
import { healthStatusColors, healthStatusLabels } from "@/lib/affiliate-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { mockClicksOverTime } from "@/lib/mock-data";

export default function Dashboard() {
  const { data: products, isLoading: loadingProducts } = useProducts();
  const { data: brands, isLoading: loadingBrands } = useBrands();
  const { data: links, isLoading: loadingLinks } = useAffiliateLinks();

  const totalProducts = products?.length || 0;
  const totalBrands = brands?.length || 0;
  const totalClicks = links?.reduce((s, l) => s + (l.click_count || 0), 0) || 0;
  const totalRevenue = links?.reduce((s, l) => s + Number(l.revenue || 0), 0) || 0;
  const brokenLinks = links?.filter((l) => l.health_status === "broken") || [];
  const topLinks = [...(links || [])].sort((a, b) => (b.click_count || 0) - (a.click_count || 0)).slice(0, 5);

  const stats = [
    { label: "Total Products", value: totalProducts, icon: Package, change: "+12%" },
    { label: "Active Brands", value: totalBrands, icon: Store, change: "+2" },
    { label: "Total Clicks", value: totalClicks.toLocaleString(), icon: MousePointerClick, change: "+18%" },
    { label: "Est. Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, change: "+24%" },
  ];

  const isLoading = loadingProducts || loadingBrands || loadingLinks;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your affiliate product database.</p>
      </div>

      {brokenLinks.length > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="flex items-center gap-3 py-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div className="text-sm">
              <span className="font-medium">{brokenLinks.length} broken link{brokenLinks.length > 1 ? "s" : ""}</span>
              <span className="text-muted-foreground"> — {brokenLinks.map((l) => l.products?.title).join(", ")}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-20" /> : (
                <>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <p className="text-xs text-muted-foreground">{s.change} from last month</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clicks & Conversions (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockClicksOverTime}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Line type="monotone" dataKey="clicks" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="conversions" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {topLinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Links</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Short Code</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Conversions</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead>Health</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topLinks.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">{link.products?.title}</TableCell>
                    <TableCell><Badge variant="secondary">{link.short_code}</Badge></TableCell>
                    <TableCell className="text-right">{(link.click_count || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right">{link.conversions || 0}</TableCell>
                    <TableCell className="text-right">${Number(link.revenue || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={healthStatusColors[link.health_status || "unknown"]}>
                        {healthStatusLabels[link.health_status || "unknown"]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
