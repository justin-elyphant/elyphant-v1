import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getProductDetail } from "@/api/product";
import VariationSelector from "./product-details/VariationSelector";

const VariationTestPage = () => {
  const [productId, setProductId] = useState("B07H8QMZPV"); // Amazon t-shirt with variations
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testProduct = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Testing product ID:", productId);
      const result = await getProductDetail(productId, "amazon");
      console.log("Product result:", result);
      
      if (result) {
        setProduct(result);
        console.log("Has variations:", Boolean(result.all_variants && result.all_variants.length > 0));
        console.log("All variants:", result.all_variants);
        console.log("Variant specifics:", result.variant_specifics);
      } else {
        setError("Product not found");
      }
    } catch (err) {
      console.error("Error fetching product:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleVariationChange = (selectedVariations: any, selectedProductId: string) => {
    console.log("Variation changed:", { selectedVariations, selectedProductId });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="border p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">🧪 Variation System Test</h2>
        
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Enter Amazon Product ID (ASIN)"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="flex-1"
          />
          <Button onClick={testProduct} disabled={loading}>
            {loading ? "Testing..." : "Test Product"}
          </Button>
        </div>

        {error && (
          <div className="text-red-600 bg-red-50 p-2 rounded mb-4">
            ❌ Error: {error}
          </div>
        )}

        {product && (
          <div className="space-y-4">
            <div className="bg-green-50 p-3 rounded">
              <h3 className="font-medium text-green-800">✅ Product Loaded Successfully</h3>
              <p className="text-sm text-green-700">
                <strong>Title:</strong> {product.title}<br/>
                <strong>Price:</strong> ${product.price}<br/>
                <strong>Has Variations:</strong> {Boolean(product.all_variants && product.all_variants.length > 0) ? "Yes" : "No"}<br/>
                <strong>Variation Count:</strong> {product.all_variants?.length || 0}
              </p>
            </div>

            {/* Show raw API data */}
            <details className="border p-2 rounded">
              <summary className="font-medium cursor-pointer">🔍 Raw API Response</summary>
              <pre className="text-xs bg-gray-50 p-2 rounded mt-2 overflow-x-auto">
                {JSON.stringify(product, null, 2)}
              </pre>
            </details>

            {/* Test variation selector if variations exist */}
            {product.all_variants && product.all_variants.length > 0 && (
              <div className="border p-4 rounded">
                <h4 className="font-medium mb-3">🎯 Variation Selector Test</h4>
                <VariationSelector
                  variants={product.all_variants}
                  currentVariantSpecs={product.variant_specifics || []}
                  onVariationChange={handleVariationChange}
                />
              </div>
            )}

            {/* Show if no variations */}
            {(!product.all_variants || product.all_variants.length === 0) && (
              <div className="bg-yellow-50 p-3 rounded">
                <p className="text-yellow-800">
                  ⚠️ This product doesn't have variations in the API response.
                  Try a different product ID or check if the Zinc API returns variation data.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Test suggestions */}
      <div className="bg-blue-50 p-4 rounded">
        <h3 className="font-medium text-blue-800 mb-2">🧪 Test Suggestions</h3>
        <p className="text-sm text-blue-700 mb-2">Try these Amazon ASINs that typically have variations:</p>
        <div className="flex flex-wrap gap-2">
          {["B07H8QMZPV", "B07NPQQ7D4", "B08N5WRWNW", "B01M4HL45P"].map(asin => (
            <Button
              key={asin}
              variant="outline"
              size="sm"
              onClick={() => setProductId(asin)}
              className="text-xs"
            >
              {asin}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VariationTestPage;