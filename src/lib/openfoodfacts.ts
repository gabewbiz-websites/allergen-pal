export interface ProductLookup {
  found: boolean;
  name: string;
  brand: string;
  ingredients: string;
  barcode: string;
}

/**
 * Look up a product by barcode using the free Open Food Facts database.
 * No API key required. Returns found:false when the product isn't in the DB
 * (or the network is unavailable) so the caller can fall back to manual entry.
 */
export async function lookupBarcode(barcode: string): Promise<ProductLookup> {
  const clean = barcode.replace(/\D/g, "");
  const base: ProductLookup = {
    found: false,
    name: "",
    brand: "",
    ingredients: "",
    barcode: clean,
  };
  if (!clean) return base;
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${clean}.json?fields=product_name,brands,ingredients_text`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return base;
    const json = (await res.json()) as {
      status: number;
      product?: {
        product_name?: string;
        brands?: string;
        ingredients_text?: string;
      };
    };
    if (json.status !== 1 || !json.product) return base;
    return {
      found: true,
      name: json.product.product_name?.trim() ?? "",
      brand: json.product.brands?.split(",")[0]?.trim() ?? "",
      ingredients: json.product.ingredients_text?.trim() ?? "",
      barcode: clean,
    };
  } catch {
    return base;
  }
}

/** Whether this browser can scan barcodes from the camera natively. */
export function canScanCamera(): boolean {
  return (
    typeof window !== "undefined" &&
    "BarcodeDetector" in window &&
    !!navigator.mediaDevices?.getUserMedia
  );
}
