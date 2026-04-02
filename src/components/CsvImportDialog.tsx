import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, FileUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ParsedProduct {
  sku: string;
  title: string;
  description?: string;
  image_url?: string;
  price?: number;
  currency?: string;
  category?: string;
  availability_status?: string;
  merchant_id?: string;
  affiliate_url_template?: string;
}

interface CsvImportDialogProps {
  brands: { id: string; name: string; network_id: string | null }[];
  onImportComplete: () => void;
}

export function CsvImportDialog({ brands, onImportComplete }: CsvImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedProduct[]>([]);
  const [brandId, setBrandId] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): ParsedProduct[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
    
    return lines.slice(1).map((line) => {
      const values: string[] = [];
      let current = "";
      let inQuotes = false;
      for (const char of line) {
        if (char === '"') { inQuotes = !inQuotes; }
        else if (char === "," && !inQuotes) { values.push(current.trim()); current = ""; }
        else { current += char; }
      }
      values.push(current.trim());

      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = values[i] || ""; });

      return {
        sku: row.sku || row.id || row.product_id || "",
        title: row.title || row.name || row.product_name || "",
        description: row.description || row.desc || "",
        image_url: row.image_url || row.image || "",
        price: parseFloat(row.price || "0") || undefined,
        currency: row.currency || "USD",
        category: row.category || "",
        availability_status: row.availability_status || row.availability || "unknown",
        merchant_id: row.merchant_id || row.merchant || "",
        affiliate_url_template: row.affiliate_url_template || row.url_template || "",
      };
    }).filter((p) => p.sku && p.title);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const products = parseCSV(ev.target?.result as string);
        if (products.length === 0) {
          setError("No valid products found. Ensure CSV has 'sku' and 'title' columns.");
        }
        setParsed(products);
      } catch {
        setError("Failed to parse CSV file.");
      }
    };
    reader.readAsText(f);
  };

  const handleImport = async () => {
    if (!brandId || parsed.length === 0) return;
    setImporting(true);

    const brand = brands.find((b) => b.id === brandId);
    const rows = parsed.map((p) => ({
      sku: p.sku,
      title: p.title,
      description: p.description || null,
      image_url: p.image_url || null,
      price: p.price || null,
      currency: p.currency || "USD",
      category: p.category || null,
      availability_status: (["in_stock", "out_of_stock", "unknown"].includes(p.availability_status || "") ? p.availability_status : "unknown") as "in_stock" | "out_of_stock" | "unknown",
      merchant_id: p.merchant_id || null,
      affiliate_url_template: p.affiliate_url_template || null,
      brand_id: brandId,
      network_id: brand?.network_id || null,
    }));

    const { error } = await supabase.from("products").upsert(rows, { onConflict: "sku,network_id" });

    if (error) {
      toast.error(`Import failed: ${error.message}`);
    } else {
      toast.success(`Imported ${rows.length} products!`);
      setOpen(false);
      setParsed([]);
      setFile(null);
      setBrandId("");
      onImportComplete();
    }
    setImporting(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" /> Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Products from CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Brand</Label>
            <Select value={brandId} onValueChange={setBrandId}>
              <SelectTrigger><SelectValue placeholder="Select brand for imported products" /></SelectTrigger>
              <SelectContent>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>CSV File</Label>
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <FileUp className="h-5 w-5 text-primary" />
                  <span className="font-medium">{file.name}</span>
                  <Badge variant="secondary">{parsed.length} products</Badge>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload CSV file</p>
                  <p className="text-xs text-muted-foreground">Required columns: sku, title</p>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          )}

          {parsed.length > 0 && (
            <>
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <CheckCircle2 className="h-4 w-4" /> {parsed.length} products ready to import
              </div>
              <div className="max-h-[200px] overflow-auto border rounded">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsed.slice(0, 10).map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                        <TableCell className="text-sm">{p.title}</TableCell>
                        <TableCell className="text-sm">{p.price ? `$${p.price}` : "—"}</TableCell>
                        <TableCell className="text-sm">{p.category || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {parsed.length > 10 && (
                  <p className="text-xs text-muted-foreground p-2 text-center">
                    ...and {parsed.length - 10} more
                  </p>
                )}
              </div>
              <Button onClick={handleImport} disabled={importing || !brandId} className="w-full">
                {importing ? "Importing..." : `Import ${parsed.length} Products`}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
