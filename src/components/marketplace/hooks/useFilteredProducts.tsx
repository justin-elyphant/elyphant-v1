
import { useMemo } from "react";
import { matchesSizeFilters } from '../utils/enhancedSizeDetection';
import { matchesEnhancedFilters } from '../utils/enhancedFilterDetection';

export const useFilteredProducts = (products: any[], activeFilters: any, sortOption: string) => {
  return useMemo(() => {
    if (!products || products.length === 0) {
      return [];
    }

    const f = activeFilters || {};
    const categories: string[] = f.categories || [];
    const priceRange: [number, number] | undefined = f.priceRange;
    const rating: number = f.rating || 0;
    const inStock: boolean | undefined = f.inStock;
    const onSale: boolean | undefined = f.onSale;
    const freeShipping: boolean | undefined = f.freeShipping;
    const brands: string[] = f.brands || [];
    const gender: string[] = f.gender || [];
    const sizes: string[] = f.size || [];
    const colors: string[] = f.color || [];
    const fits: string[] = f.fit || [];
    const smartBrands: string[] = f.brand || [];

    let filtered = [...products];

    // Category filter
    if (categories.length > 0) {
      filtered = filtered.filter(product => categories.includes(product.category));
    }

    // Price range filter
    if (priceRange && Array.isArray(priceRange) && priceRange.length === 2) {
      const [min, max] = priceRange;
      filtered = filtered.filter(product => {
        const price = Number(product.price ?? product.current_price ?? product.salePrice ?? product.listPrice);
        return !Number.isNaN(price) && price >= min && price <= max;
      });
    }

    // Rating filter
    if (rating > 0) {
      filtered = filtered.filter(product => (Number(product.rating || product.stars || 0) >= rating));
    }

    // Stock filter
    if (inStock) {
      filtered = filtered.filter(product => product.inStock !== false);
    }

    // Sale filter
    if (onSale) {
      filtered = filtered.filter(product => product.onSale === true || product.salePrice != null);
    }

    // Free shipping filter
    if (freeShipping) {
      filtered = filtered.filter(product => product.freeShipping === true);
    }

    // Brand list filter
    if (brands.length > 0) {
      filtered = filtered.filter(product => brands.includes(product.brand));
    }

    // Gender filter (robust)
    if (gender.length > 0) {
      filtered = filtered.filter(product => {
        const title = String(product.title || product.name || '').toLowerCase();
        const description = String(product.description || '').toLowerCase();
        const meta = String(product.gender || '').toLowerCase();
        const text = `${title} ${description} ${meta}`;

        const hasMen = /\bmen'?s\b|\bmens\b|\bmale\b/.test(text);
        const hasWomen = /\bwomen'?s\b|\bwomens\b|\bfemale\b/.test(text);

        return gender.some(g => {
          const gLower = String(g).toLowerCase();
          if (gLower === 'men' || gLower === 'mens' || gLower === "men's" || gLower === 'male') {
            return hasMen && !hasWomen;
          }
          if (gLower === 'women' || gLower === 'womens' || gLower === "women's" || gLower === 'female') {
            return hasWomen && !hasMen;
          }
          return false;
        });
      });
    }

    // Enhanced size filtering with separate waist, inseam, clothing, and shoe sizes
    const waistSizes = f.waist || [];
    const inseamSizes = f.inseam || [];
    const clothingSizes = f.size || [];
    const shoeSizes = f.shoeSize || [];
    
    if (waistSizes.length > 0 || inseamSizes.length > 0 || clothingSizes.length > 0 || shoeSizes.length > 0) {
      filtered = filtered.filter(product => {
        return matchesSizeFilters(product, {
          waist: waistSizes,
          inseam: inseamSizes,
          clothing: clothingSizes,
          shoes: shoeSizes
        });
      });
    }
    
    // Legacy size filter for backward compatibility
    if (sizes.length > 0) {
      filtered = filtered.filter(product => {
        const title = String(product.title || product.name || '').toLowerCase();
        return sizes.some(size => title.includes(String(size).toLowerCase()));
      });
    }

    // Color filter
    if (colors.length > 0) {
      filtered = filtered.filter(product => {
        const title = String(product.title || product.name || '').toLowerCase();
        const description = String(product.description || '').toLowerCase();
        return colors.some(color => title.includes(String(color).toLowerCase()) || description.includes(String(color).toLowerCase()));
      });
    }

    // Enhanced material, style, and feature filtering
    const materials = f.material || [];
    const styles = f.style || [];
    const features = f.features || [];
    const seasons = f.season || [];
    
    if (materials.length > 0 || styles.length > 0 || features.length > 0 || seasons.length > 0) {
      filtered = filtered.filter(product => {
        return matchesEnhancedFilters(product, {
          materials,
          styles,
          features,
          seasons,
          colors: f.color || []
        });
      });
    }
    
    // Fit filter
    if (fits.length > 0) {
      filtered = filtered.filter(product => {
        const title = String(product.title || product.name || '').toLowerCase();
        return fits.some(fit => title.includes(String(fit).toLowerCase()));
      });
    }

    // Smart brand filter
    if (smartBrands.length > 0) {
      filtered = filtered.filter(product => {
        const brand = String(product.brand || '').toLowerCase();
        const title = String(product.title || product.name || '').toLowerCase();
        return smartBrands.some(b => {
          const bLower = String(b).toLowerCase();
          return brand.includes(bLower) || title.includes(bLower);
        });
      });
    }

    // Sorting
    if (sortOption === 'price-low') {
      filtered.sort((a, b) => (Number(a.price ?? a.current_price ?? a.salePrice ?? a.listPrice) || 0) - (Number(b.price ?? b.current_price ?? b.salePrice ?? b.listPrice) || 0));
    } else if (sortOption === 'price-high') {
      filtered.sort((a, b) => (Number(b.price ?? b.current_price ?? b.salePrice ?? b.listPrice) || 0) - (Number(a.price ?? a.current_price ?? a.salePrice ?? a.listPrice) || 0));
    } else if (sortOption === 'rating') {
      filtered.sort((a, b) => (Number(b.rating || b.stars || 0)) - (Number(a.rating || a.stars || 0)));
    } else if (sortOption === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    return filtered;
  }, [products, activeFilters, sortOption]);
};
