// ============================================================================
// FACET GENERATOR - Generate facets (filters) from search results
// ============================================================================

export interface BrandFacet {
  name: string;
  count: number;
}

export interface PriceRangeFacet {
  label: string;
  min: number;
  max: number;
  count: number;
}

export interface CategoryFacet {
  name: string;
  count: number;
}

export interface Facets {
  brands: BrandFacet[];
  priceRanges: PriceRangeFacet[];
  categories: CategoryFacet[];
}

/**
 * Generate facets from search results for filter UI
 */
export const generateFacetsFromResults = (products: any[]): Facets | null => {
  if (!products || products.length === 0) {
    return null;
  }

  // Brand facets
  const brandCounts: Record<string, number> = {};
  products.forEach(p => {
    const brand = p.brand?.trim();
    if (brand) {
      brandCounts[brand] = (brandCounts[brand] || 0) + 1;
    }
  });

  const brands = Object.entries(brandCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Price range facets
  const priceRanges: PriceRangeFacet[] = [
    { label: 'Under $25', min: 0, max: 25, count: 0 },
    { label: '$25 - $50', min: 25, max: 50, count: 0 },
    { label: '$50 - $100', min: 50, max: 100, count: 0 },
    { label: '$100 - $200', min: 100, max: 200, count: 0 },
    { label: 'Over $200', min: 200, max: Infinity, count: 0 }
  ];

  products.forEach(p => {
    const price = p.price || 0;
    for (const range of priceRanges) {
      if (price >= range.min && price < range.max) {
        range.count++;
        break;
      }
    }
  });

  // Category facets
  const categoryCounts: Record<string, number> = {};
  products.forEach(p => {
    const category = p.category?.trim() || p.categories?.[0]?.trim();
    if (category) {
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    }
  });

  const categories = Object.entries(categoryCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    brands,
    priceRanges: priceRanges.filter(r => r.count > 0),
    categories
  };
};
