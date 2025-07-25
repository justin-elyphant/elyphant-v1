import { Product } from "@/types/product";

export const allProducts: Product[] = [
  // Apple Products
  {
    id: "apple-airpods-pro",
    product_id: "apple-airpods-pro",
    title: "Apple AirPods Pro (2nd Generation)",
    name: "Apple AirPods Pro (2nd Generation)",
    description: "Active Noise Cancellation, Transparency mode, Spatial audio, and up to 6 hours of listening time",
    price: 249.00,
    category: "Electronics",
    brand: "Apple",
    image: "https://images.unsplash.com/photo-1603351154351-5e2d0600bb77?auto=format&fit=crop&q=80&w=600",
    rating: 4.8,
    reviewCount: 15420,
    vendor: "Amazon",
    tags: ["wireless", "earbuds", "noise cancellation", "apple", "bluetooth"],
    isBestSeller: true
  },
  {
    id: "apple-airpods-3",
    product_id: "apple-airpods-3",
    title: "Apple AirPods (3rd Generation)",
    name: "Apple AirPods (3rd Generation)",
    description: "Spatial audio, sweat and water resistant, up to 6 hours of listening time",
    price: 179.00,
    category: "Electronics",
    brand: "Apple",
    image: "https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?auto=format&fit=crop&q=80&w=600",
    rating: 4.6,
    reviewCount: 8934,
    vendor: "Amazon",
    tags: ["wireless", "earbuds", "apple", "bluetooth", "spatial audio"]
  },
  {
    id: "apple-airpods-max",
    product_id: "apple-airpods-max",
    title: "Apple AirPods Max",
    name: "Apple AirPods Max",
    description: "High-fidelity audio, Adaptive EQ, Active Noise Cancellation, and spatial audio",
    price: 549.00,
    category: "Electronics",
    brand: "Apple",
    image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&q=80&w=600",
    rating: 4.7,
    reviewCount: 3456,
    vendor: "Amazon",
    tags: ["headphones", "wireless", "noise cancellation", "apple", "premium"]
  },
  {
    id: "wireless-headphones",
    product_id: "wireless-headphones",
    title: "Premium Wireless Headphones",
    name: "Premium Wireless Headphones",
    description: "High-quality sound with noise cancellation and 30-hour battery life",
    price: 199.99,
    category: "Electronics",
    brand: "SoundMaster",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600",
    rating: 4.5,
    reviewCount: 1245,
    vendor: "Amazon",
    tags: ["headphones", "wireless", "noise cancellation", "bluetooth"]
  },
  {
    id: "smartphone-flagship",
    product_id: "smartphone-flagship",
    title: "Flagship Smartphone 256GB",
    name: "Flagship Smartphone 256GB",
    description: "Latest processor, triple camera system, 6.7-inch display, 5G connectivity",
    price: 899.99,
    category: "Electronics",
    brand: "TechFlow",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=600",
    rating: 4.6,
    reviewCount: 2156,
    vendor: "Amazon",
    tags: ["smartphone", "5g", "camera", "mobile", "phone"]
  },
  {
    id: "fitness-tracker",
    product_id: "fitness-tracker",
    title: "Advanced Fitness Tracker",
    name: "Advanced Fitness Tracker",
    description: "Heart rate monitoring, GPS tracking, sleep analysis, 7-day battery life",
    price: 149.99,
    category: "Electronics",
    brand: "FitTech",
    image: "https://images.unsplash.com/photo-1557825835-70d97c4aa567?auto=format&fit=crop&q=80&w=600",
    rating: 4.4,
    reviewCount: 856,
    vendor: "Amazon",
    tags: ["fitness", "tracker", "health", "smartwatch", "wearable"]
  },
  {
    id: "bluetooth-speaker",
    product_id: "bluetooth-speaker",
    title: "Portable Bluetooth Speaker",
    name: "Portable Bluetooth Speaker",
    description: "360-degree sound, waterproof design, 12-hour battery, voice assistant",
    price: 79.99,
    category: "Electronics",
    brand: "SoundWave",
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&q=80&w=600",
    rating: 4.3,
    reviewCount: 642,
    vendor: "Amazon",
    tags: ["speaker", "bluetooth", "portable", "waterproof", "wireless"]
  },
  {
    id: "gaming-mouse",
    product_id: "gaming-mouse",
    title: "RGB Gaming Mouse",
    name: "RGB Gaming Mouse",
    description: "High precision sensor, customizable RGB lighting, ergonomic design",
    price: 59.99,
    category: "Electronics",
    brand: "GamePro",
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&q=80&w=600",
    rating: 4.5,
    reviewCount: 423,
    vendor: "Amazon",
    tags: ["gaming", "mouse", "rgb", "precision", "computer"]
  },
  {
    id: "wireless-charger",
    product_id: "wireless-charger",
    title: "Fast Wireless Charging Pad",
    name: "Fast Wireless Charging Pad",
    description: "15W fast charging, compatible with iPhone and Android, LED indicator",
    price: 34.99,
    category: "Electronics",
    brand: "ChargeFast",
    image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&q=80&w=600",
    rating: 4.2,
    reviewCount: 734,
    vendor: "Amazon",
    tags: ["charger", "wireless", "fast charging", "phone", "pad"]
  },
  {
    id: "coffee-maker",
    product_id: "coffee-maker",
    title: "Smart Coffee Maker",
    name: "Smart Coffee Maker",
    description: "Programmable brewing, built-in grinder, app control, thermal carafe",
    price: 199.99,
    category: "Home & Kitchen",
    brand: "BrewMaster",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=600",
    rating: 4.6,
    reviewCount: 1023,
    vendor: "Amazon",
    tags: ["coffee", "maker", "smart", "programmable", "kitchen"]
  },
  {
    id: "yoga-mat",
    product_id: "yoga-mat",
    title: "Eco-Friendly Yoga Mat",
    name: "Eco-Friendly Yoga Mat",
    description: "Non-slip surface, extra thick cushioning, made from natural rubber",
    price: 48.99,
    category: "Sports & Outdoors",
    brand: "ZenFit",
    image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&q=80&w=600",
    rating: 4.4,
    reviewCount: 567,
    vendor: "Amazon",
    tags: ["yoga", "mat", "fitness", "exercise", "eco-friendly"]
  },
  {
    id: "desk-lamp",
    product_id: "desk-lamp",
    title: "LED Desk Lamp with USB Charging",
    name: "LED Desk Lamp with USB Charging",
    description: "Adjustable brightness, color temperature control, USB charging port",
    price: 42.99,
    category: "Home & Kitchen",
    brand: "BrightDesk",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600",
    rating: 4.3,
    reviewCount: 892,
    vendor: "Amazon",
    tags: ["lamp", "led", "desk", "usb", "adjustable"]
  }
];
