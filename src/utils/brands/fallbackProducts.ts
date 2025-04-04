
import { Product } from "@/contexts/ProductContext";

/**
 * Provides fallback Apple products when the API fails
 * @param minCount Minimum number of products to generate
 */
export const getAppleFallbackProducts = (minCount: number = 75): Product[] => {
  // Base products with real data
  const baseProducts = [
    {
      id: Date.now() + 1,
      name: "Apple iPhone 15 Pro, 256GB, Space Black",
      price: 999.99,
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=500&h=500&fit=crop",
      vendor: "Amazon via Zinc",
      description: "The latest iPhone with A16 chip, amazing camera system, and all-day battery life.",
      rating: 4.8,
      reviewCount: 1245,
      images: ["https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=500&h=500&fit=crop"],
      features: ["A16 Bionic chip", "Pro camera system", "Always-On display", "5G capable"],
      specifications: {
        "Storage": "256GB",
        "Display": "6.1-inch Super Retina XDR",
        "Camera": "48MP main camera" 
      },
      isBestSeller: true,
      brand: "Apple"
    },
    {
      id: Date.now() + 2,
      name: "Apple MacBook Air 13.6\" Laptop with M2 chip",
      price: 1199.99,
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop",
      vendor: "Amazon via Zinc",
      description: "The remarkably thin MacBook Air with M2 chip for incredible performance and battery life.",
      rating: 4.9,
      reviewCount: 895,
      images: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop"],
      features: ["M2 chip", "Up to 18 hours battery life", "Fanless design", "13.6-inch Liquid Retina display"],
      specifications: {
        "Processor": "Apple M2",
        "Memory": "8GB unified memory",
        "Storage": "256GB SSD"
      },
      isBestSeller: true,
      brand: "Apple"
    },
    {
      id: Date.now() + 3,
      name: "Apple iPad Pro 12.9\" with M2 chip and XDR display",
      price: 1099.99,
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop",
      vendor: "Amazon via Zinc",
      description: "The ultimate iPad experience with the powerful M2 chip and stunning Liquid Retina XDR display.",
      rating: 4.7,
      reviewCount: 732,
      images: ["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop"],
      features: ["M2 chip", "Liquid Retina XDR display", "Thunderbolt port", "Works with Apple Pencil"],
      specifications: {
        "Display": "12.9-inch Liquid Retina XDR",
        "Storage": "256GB",
        "Connectivity": "Wi-Fi 6E"
      },
      isBestSeller: true,
      brand: "Apple"
    },
    {
      id: Date.now() + 4,
      name: "Apple Watch Series 9 GPS + Cellular 45mm",
      price: 499.99,
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&h=500&fit=crop",
      vendor: "Amazon via Zinc",
      description: "Advanced health monitoring and connectivity features in a sleek, durable design.",
      rating: 4.6,
      reviewCount: 526,
      images: ["https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&h=500&fit=crop"],
      features: ["S9 chip", "Always-On Retina display", "Cellular connectivity", "ECG app"],
      specifications: {
        "Case size": "45mm",
        "Water resistance": "50 meters",
        "Battery": "Up to 18 hours"
      },
      isBestSeller: false,
      brand: "Apple"
    }
  ];

  // If we already have enough products, return them
  if (baseProducts.length >= minCount) {
    return baseProducts;
  }

  // Product templates to generate variations
  const productTemplates = [
    {
      type: "iPhone",
      namePattern: "Apple iPhone {{version}} {{variant}}, {{storage}}GB, {{color}}",
      versions: ["15", "15 Pro", "15 Pro Max", "14", "14 Pro", "14 Pro Max", "13", "13 Pro", "13 mini", "SE"],
      variants: ["", "Max", "Plus", "mini", "5G"],
      storages: [64, 128, 256, 512, 1024],
      colors: ["Space Black", "Silver", "Gold", "Pacific Blue", "Graphite", "Sierra Blue", "Alpine Green", "Deep Purple", "Midnight", "Starlight", "Blue", "Pink", "Red", "Green", "Yellow"],
      priceRange: [499.99, 1599.99],
      imageUrls: [
        "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1603891128711-11b4b03bb138?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1573148195900-7845dcb9b127?w=500&h=500&fit=crop"
      ]
    },
    {
      type: "MacBook",
      namePattern: "Apple MacBook {{variant}} {{size}}\" with {{chip}} chip, {{storage}}GB SSD, {{color}}",
      versions: ["", ""],
      variants: ["Air", "Pro", "Pro with Retina Display"],
      storages: [256, 512, 1024, 2048],
      colors: ["Space Gray", "Silver", "Gold", "Midnight"],
      priceRange: [899.99, 2999.99],
      imageUrls: [
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500&h=500&fit=crop"
      ],
      sizes: ["13", "14", "16"],
      chips: ["M1", "M2", "M3", "M3 Pro", "M3 Max"]
    },
    {
      type: "iPad",
      namePattern: "Apple iPad {{variant}} {{size}}\" {{generation}}, {{storage}}GB, {{connectivity}}, {{color}}",
      versions: ["", ""],
      variants: ["Pro", "Air", "mini", ""],
      storages: [64, 128, 256, 512, 1024],
      colors: ["Space Gray", "Silver", "Starlight", "Pink", "Blue", "Purple"],
      priceRange: [329.99, 1299.99],
      imageUrls: [
        "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1589739900266-43b2e399fa1e?w=500&h=500&fit=crop"
      ],
      sizes: ["8.3", "10.2", "10.9", "11", "12.9"],
      generations: ["5th Generation", "6th Generation", "10th Generation", ""],
      connectivities: ["Wi-Fi", "Wi-Fi + Cellular"]
    },
    {
      type: "Watch",
      namePattern: "Apple Watch {{series}} {{size}}mm {{material}} Case, {{band}} Band, {{connectivity}}",
      versions: ["", ""],
      variants: ["", ""],
      series: ["Series 9", "Series 8", "Series 7", "SE", "Ultra", "Ultra 2"],
      sizes: ["40", "41", "42", "44", "45", "49"],
      materials: ["Aluminum", "Stainless Steel", "Titanium"],
      bands: ["Sport", "Solo Loop", "Braided Solo Loop", "Sport Loop", "Leather Link", "Milanese Loop", "Ocean"],
      colors: ["Silver", "Space Gray", "Gold", "Starlight", "Midnight", "Blue", "Red", "Green", "Pink", "Titanium"],
      priceRange: [249.99, 799.99],
      connectivities: ["GPS", "GPS + Cellular"],
      imageUrls: [
        "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=500&h=500&fit=crop"
      ]
    },
    {
      type: "AirPods",
      namePattern: "Apple AirPods {{variant}}{{generation}}, {{feature}}",
      versions: ["", ""],
      variants: ["", "Pro", "Max", "Pro"],
      generations: [" 2nd Generation", " 3rd Generation", "", "2"],
      features: ["with Charging Case", "with MagSafe Charging Case", "with Wireless Charging Case", "with Active Noise Cancellation", "with Spatial Audio"],
      priceRange: [129.99, 549.99],
      imageUrls: [
        "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1603351154351-5e2d0600bb77?w=500&h=500&fit=crop"
      ]
    }
  ];

  // Generate products
  const generatedProducts: Product[] = [];
  let id = Date.now() + baseProducts.length;

  // How many more products we need
  const remainingNeeded = minCount - baseProducts.length;
  
  // Add variations of each product type
  for (let i = 0; i < remainingNeeded; i++) {
    // Cycle through product templates
    const template = productTemplates[i % productTemplates.length];
    
    let name = template.namePattern;
    
    // Random rating between 3.5 and 5.0
    const rating = Math.floor(Math.random() * 15 + 35) / 10;
    
    // Random number of reviews between 50 and 3000
    const reviewCount = Math.floor(Math.random() * 2950 + 50);
    
    // Random price within the range
    const price = Math.floor(Math.random() * (template.priceRange[1] - template.priceRange[0]) + template.priceRange[0] * 100) / 100;
    
    // Random image from the template's image URLs
    const imageUrl = template.imageUrls[Math.floor(Math.random() * template.imageUrls.length)];
    
    // Replace placeholders in the name pattern
    if (template.versions && template.versions.length > 0) {
      name = name.replace("{{version}}", template.versions[Math.floor(Math.random() * template.versions.length)]);
    }
    
    if (template.variants && template.variants.length > 0) {
      name = name.replace("{{variant}}", template.variants[Math.floor(Math.random() * template.variants.length)]);
    }
    
    if (template.storages && template.storages.length > 0) {
      name = name.replace("{{storage}}", template.storages[Math.floor(Math.random() * template.storages.length)].toString());
    }
    
    if (template.colors && template.colors.length > 0) {
      name = name.replace("{{color}}", template.colors[Math.floor(Math.random() * template.colors.length)]);
    }
    
    if (template.sizes && template.sizes.length > 0) {
      name = name.replace("{{size}}", template.sizes[Math.floor(Math.random() * template.sizes.length)]);
    }
    
    if (template.chips && template.chips.length > 0) {
      name = name.replace("{{chip}}", template.chips[Math.floor(Math.random() * template.chips.length)]);
    }
    
    if (template.series && template.series.length > 0) {
      name = name.replace("{{series}}", template.series[Math.floor(Math.random() * template.series.length)]);
    }
    
    if (template.materials && template.materials.length > 0) {
      name = name.replace("{{material}}", template.materials[Math.floor(Math.random() * template.materials.length)]);
    }
    
    if (template.bands && template.bands.length > 0) {
      name = name.replace("{{band}}", template.bands[Math.floor(Math.random() * template.bands.length)]);
    }
    
    if (template.connectivities && template.connectivities.length > 0) {
      name = name.replace("{{connectivity}}", template.connectivities[Math.floor(Math.random() * template.connectivities.length)]);
    }
    
    if (template.generations && template.generations.length > 0) {
      name = name.replace("{{generation}}", template.generations[Math.floor(Math.random() * template.generations.length)]);
    }
    
    if (template.features && template.features.length > 0) {
      name = name.replace("{{feature}}", template.features[Math.floor(Math.random() * template.features.length)]);
    }
    
    // Clean up any remaining placeholders
    name = name.replace(/{{[^}]+}}/g, "").replace(/\s+/g, " ").trim();
    
    // Create product description based on name
    const description = `Experience the amazing features of the ${name}. This premium Apple product delivers exceptional performance and the quality you expect from Apple.`;
    
    // Create features based on product type
    let features: string[] = [];
    switch (template.type) {
      case "iPhone":
        features = ["iOS", "Face ID", "5G connectivity", "Advanced camera system", "All-day battery life"];
        break;
      case "MacBook":
        features = ["macOS", "Retina display", "Touch ID", "All-day battery life", "Wi-Fi 6"];
        break;
      case "iPad":
        features = ["iPadOS", "Liquid Retina display", "Apple Pencil support", "Center Stage camera", "All-day battery life"];
        break;
      case "Watch":
        features = ["watchOS", "Always-On display", "Heart rate monitoring", "Blood oxygen sensor", "Water resistant"];
        break;
      case "AirPods":
        features = ["Adaptive EQ", "Spatial Audio", "Active Noise Cancellation", "Sweat and water resistant", "Fast charging"];
        break;
    }
    
    // Specifications
    const specifications: Record<string, string> = {};
    switch (template.type) {
      case "iPhone":
        specifications["Processor"] = "Apple A-series chip";
        specifications["Camera"] = "12MP Ultra Wide";
        specifications["Display"] = "Super Retina XDR";
        break;
      case "MacBook":
        specifications["Memory"] = "8GB/16GB unified memory";
        specifications["Processor"] = "Apple Silicon";
        specifications["Graphics"] = "Integrated";
        break;
      case "iPad":
        specifications["Processor"] = "Apple A-series chip";
        specifications["Camera"] = "12MP Ultra Wide";
        specifications["Display"] = "Liquid Retina";
        break;
      default:
        specifications["Brand"] = "Apple";
        specifications["Warranty"] = "1 year limited warranty";
    }
    
    generatedProducts.push({
      id: id++,
      name,
      price,
      category: "Electronics",
      image: imageUrl,
      vendor: "Amazon via Zinc",
      description,
      rating,
      reviewCount,
      images: [imageUrl],
      features,
      specifications,
      isBestSeller: Math.random() > 0.8, // 20% chance of being a best seller
      brand: "Apple"
    });
  }

  // Return all products
  return [...baseProducts, ...generatedProducts];
};
