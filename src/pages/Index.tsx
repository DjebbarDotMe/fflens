import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Store, MousePointerClick, DollarSign } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { mockProducts, mockAffiliateLinks, mockClicksOverTime, mockBrands } from "@/lib/mock-data";

const stats = [
  { label: "Total Products", value: mockProducts.length, icon: Package, change: "+12%" },
  { label: "Active Brands", value: mockBrands.length, icon: Store, change: "+2" },
  { label: "Total Clicks", value: mockAffiliateLinks.reduce((s, l) => s + l.clicks, 0).toLocaleString(), icon: MousePointerClick, change: "+18%" },
  { label: "Est. Revenue", value: `$${mockAffiliateLinks.reduce((s, l) => s + l.revenue, 0).toLocaleString()}`, icon: DollarSign, change: "+24%" },
];

const topLinks = [...mockAffiliateLinks].sort((a, b) => b.clicks - a.clicks).slice(0, 5);

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your affiliate product database.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
              <p className="text-xs text-muted-foreground">{s.change} from last month</p>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {topLinks.map((link) => (
                <TableRow key={link.id}>
                  <TableCell className="font-medium">{link.product_name}</TableCell>
                  <TableCell><Badge variant="secondary">{link.short_code}</Badge></TableCell>
                  <TableCell className="text-right">{link.clicks.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{link.conversions}</TableCell>
                  <TableCell className="text-right">${link.revenue.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
