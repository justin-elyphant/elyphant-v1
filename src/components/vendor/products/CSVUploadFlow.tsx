import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Upload, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { CSV_COLUMNS, vendorProductSchema } from "./vendorProductSchema";
import { supabase } from "@/integrations/supabase/client";
import { useVendorAccount } from "@/hooks/vendor/useVendorAccount";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface CSVUploadFlowProps {
  onClose: () => void;
}

interface ParsedRow {
  data: Record<string, string>;
  errors: string[];
  rowNumber: number;
}

export const CSVUploadFlow = ({ onClose }: CSVUploadFlowProps) => {
  const { data: vendorAccount } = useVendorAccount();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [step, setStep] = useState<"upload" | "preview">("upload");

  const downloadTemplate = () => {
    const header = CSV_COLUMNS.join(",");
    const example = [
      "Fresh Rose Bouquet",
      "Beautiful hand-arranged roses perfect for any occasion",
      "49.99",
      "Flowers & Plants",
      "My Flower Shop",
      "SKU-001",
      "https://example.com/roses.jpg",
      "physical",
      "draft",
    ].join(",");
    const csv = `${header}\n${example}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "elyphant_product_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): ParsedRow[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    
    return lines.slice(1).map((line, idx) => {
      const values = line.split(",").map((v) => v.trim());
      const data: Record<string, string> = {};
      headers.forEach((h, i) => { data[h] = values[i] || ""; });

      const errors: string[] = [];
      const result = vendorProductSchema.safeParse({
        ...data,
        price: data.price ? Number(data.price) : undefined,
      });
      if (!result.success) {
        result.error.errors.forEach((e) => errors.push(`${e.path.join(".")}: ${e.message}`));
      }

      return { data, errors, rowNumber: idx + 2 };
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a .csv file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length === 0) {
        toast.error("No data rows found in CSV");
        return;
      }
      setParsedRows(rows);
      setStep("preview");
    };
    reader.readAsText(file);
  };

  const validRows = parsedRows.filter((r) => r.errors.length === 0);
  const invalidRows = parsedRows.filter((r) => r.errors.length > 0);

  const handleImport = async () => {
    if (!vendorAccount?.id || validRows.length === 0) return;

    setIsUploading(true);
    try {
      const inserts = validRows.map((row) => ({
        product_id: `vendor_${vendorAccount.id}_${Date.now()}_${row.rowNumber}`,
        title: row.data.title,
        price: Number(row.data.price),
        image_url: row.data.image_url || null,
        category: row.data.category,
        brand: row.data.brand,
        retailer: vendorAccount.company_name || "Vendor",
        vendor_account_id: vendorAccount.id,
        source_query: "vendor_csv",
        metadata: {
          description: row.data.description,
          sku: row.data.sku,
          fulfillment_type: row.data.fulfillment_type || "physical",
          status: row.data.status || "draft",
          product_source: "vendor_portal",
        },
      }));

      const { error } = await supabase.from("products").insert(inserts as any);
      if (error) throw error;

      toast.success(`${validRows.length} product(s) imported successfully`);
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to import products");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={step === "preview" ? () => setStep("upload") : onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle>Import Products via CSV</CardTitle>
            <CardDescription>
              {step === "upload" ? "Download the template, fill it out, and upload" : `${parsedRows.length} rows parsed`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {step === "upload" && (
          <div className="space-y-6">
            <div className="p-6 border-2 border-dashed rounded-lg text-center space-y-4">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
              <div>
                <p className="font-medium">Upload your CSV file</p>
                <p className="text-sm text-muted-foreground">
                  Columns: title, description, price, category, brand, sku, image_url, fulfillment_type, status
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
              </div>
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileSelect} />
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" /> {validRows.length} valid
              </span>
              {invalidRows.length > 0 && (
                <span className="flex items-center gap-1 text-destructive">
                  <AlertCircle className="h-4 w-4" /> {invalidRows.length} with errors
                </span>
              )}
            </div>

            <div className="max-h-64 overflow-auto border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Row</th>
                    <th className="px-3 py-2 text-left">Title</th>
                    <th className="px-3 py-2 text-left">Price</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((row) => (
                    <tr key={row.rowNumber} className={row.errors.length > 0 ? "bg-red-50" : ""}>
                      <td className="px-3 py-2">{row.rowNumber}</td>
                      <td className="px-3 py-2">{row.data.title || "—"}</td>
                      <td className="px-3 py-2">${row.data.price || "—"}</td>
                      <td className="px-3 py-2">
                        {row.errors.length > 0 ? (
                          <span className="text-destructive text-xs">{row.errors[0]}</span>
                        ) : (
                          <span className="text-green-600 text-xs">Valid</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleImport} disabled={isUploading || validRows.length === 0}>
                {isUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Import {validRows.length} Product{validRows.length !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
