export interface BrandSubCollection {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  searchTerm: string;
}

export interface BrandData {
  id: string;
  name: string;
  logo: string;
  searchTerm: string;
  heroTagline: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundGradient: string;
  ctaText: string;
  heroImage: string;
  collections: BrandSubCollection[];
}

export const brandData: Record<string, BrandData> = {
  apple: {
    id: "apple",
    name: "Apple",
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
    searchTerm: "apple",
    heroTagline: "Innovation at Your Fingertips",
    description: "Discover Apple's latest collection of innovative products designed to enhance your digital lifestyle.",
    primaryColor: "hsl(0, 0%, 17%)",
    secondaryColor: "hsl(0, 0%, 95%)",
    backgroundGradient: "linear-gradient(135deg, hsl(0, 0%, 98%) 0%, hsl(0, 0%, 92%) 100%)",
    ctaText: "Shop All Apple Products",
    heroImage: "https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=1600&q=80",
    collections: [
      { id: "all-apple", title: "All Items", subtitle: "Browse everything", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80", searchTerm: "apple" },
      { id: "apple-iphone", title: "iPhone", subtitle: "The latest smartphones", image: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80", searchTerm: "apple iphone" },
      { id: "apple-macbook", title: "MacBook", subtitle: "Pro-level laptops", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80", searchTerm: "apple macbook" },
      { id: "apple-ipad", title: "iPad", subtitle: "Versatile tablets", image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80", searchTerm: "apple ipad" },
      { id: "apple-watch", title: "Apple Watch", subtitle: "Wearable tech", image: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800&q=80", searchTerm: "apple watch" },
      { id: "apple-accessories", title: "Accessories", subtitle: "Cases, cables & more", image: "https://images.unsplash.com/photo-1589492477829-5e65395b66cc?w=800&q=80", searchTerm: "apple accessories" },
    ],
  },
  samsung: {
    id: "samsung",
    name: "Samsung",
    logo: "https://upload.wikimedia.org/wikipedia/commons/b/b4/Samsung_wordmark.svg",
    searchTerm: "samsung",
    heroTagline: "Do What You Can't",
    description: "Experience cutting-edge technology with Samsung's innovative lineup of smartphones, tablets, and home appliances.",
    primaryColor: "hsl(217, 91%, 35%)",
    secondaryColor: "hsl(217, 91%, 95%)",
    backgroundGradient: "linear-gradient(135deg, hsl(217, 91%, 98%) 0%, hsl(217, 91%, 92%) 100%)",
    ctaText: "Shop All Samsung Products",
    heroImage: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=1600&q=80",
    collections: [
      { id: "all-samsung", title: "All Items", subtitle: "Browse everything", image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80", searchTerm: "samsung" },
      { id: "samsung-galaxy", title: "Galaxy Phones", subtitle: "Flagship smartphones", image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=80", searchTerm: "samsung galaxy phone" },
      { id: "samsung-tablets", title: "Tablets", subtitle: "Galaxy Tab lineup", image: "https://images.unsplash.com/photo-1632882765546-1ee75f53becb?w=800&q=80", searchTerm: "samsung tablet" },
      { id: "samsung-tv", title: "TVs", subtitle: "Smart displays", image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=80", searchTerm: "samsung tv" },
      { id: "samsung-audio", title: "Audio", subtitle: "Earbuds & speakers", image: "https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=800&q=80", searchTerm: "samsung earbuds" },
    ],
  },
  nike: {
    id: "nike",
    name: "Nike",
    logo: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg",
    searchTerm: "nike",
    heroTagline: "Just Do It",
    description: "Elevate your performance with Nike's premium athletic wear, footwear, and equipment designed for champions.",
    primaryColor: "hsl(0, 0%, 100%)",
    secondaryColor: "hsl(39, 100%, 50%)",
    backgroundGradient: "linear-gradient(135deg, hsl(0, 0%, 5%) 0%, hsl(0, 0%, 15%) 100%)",
    ctaText: "Shop All Nike Products",
    heroImage: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1600&q=80",
    collections: [
      { id: "all-nike", title: "All Items", subtitle: "Browse everything", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80", searchTerm: "nike" },
      { id: "nike-shoes", title: "Footwear", subtitle: "Sneakers & running shoes", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80", searchTerm: "nike shoes" },
      { id: "nike-apparel", title: "Apparel", subtitle: "Performance clothing", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80", searchTerm: "nike apparel clothing" },
      { id: "nike-accessories", title: "Accessories", subtitle: "Bags, hats & gear", image: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&q=80", searchTerm: "nike accessories" },
      { id: "nike-training", title: "Training", subtitle: "Workout essentials", image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80", searchTerm: "nike training gear" },
      { id: "nike-kids", title: "Kids", subtitle: "Youth collection", image: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&q=80", searchTerm: "nike kids" },
    ],
  },
  adidas: {
    id: "adidas",
    name: "Adidas",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Adidas_Logo.svg/2560px-Adidas_Logo.svg.png",
    searchTerm: "adidas",
    heroTagline: "Impossible is Nothing",
    description: "Discover Adidas' iconic three stripes collection featuring premium sportswear and lifestyle products.",
    primaryColor: "hsl(0, 0%, 100%)",
    secondaryColor: "hsl(0, 0%, 100%)",
    backgroundGradient: "linear-gradient(135deg, hsl(0, 0%, 10%) 0%, hsl(0, 0%, 25%) 100%)",
    ctaText: "Shop All Adidas Products",
    heroImage: "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=1600&q=80",
    collections: [
      { id: "all-adidas", title: "All Items", subtitle: "Browse everything", image: "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=800&q=80", searchTerm: "adidas" },
      { id: "adidas-shoes", title: "Footwear", subtitle: "Iconic sneakers", image: "https://images.unsplash.com/photo-1520256862855-398228c41684?w=800&q=80", searchTerm: "adidas shoes" },
      { id: "adidas-apparel", title: "Apparel", subtitle: "Three stripe style", image: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&q=80", searchTerm: "adidas clothing" },
      { id: "adidas-originals", title: "Originals", subtitle: "Classic streetwear", image: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=80", searchTerm: "adidas originals" },
    ],
  },
  sony: {
    id: "sony",
    name: "Sony",
    logo: "https://upload.wikimedia.org/wikipedia/commons/c/ca/Sony_logo.svg",
    searchTerm: "sony",
    heroTagline: "Be Moved",
    description: "Immerse yourself in Sony's world of entertainment with cutting-edge audio, gaming, and electronics.",
    primaryColor: "hsl(0, 0%, 17%)",
    secondaryColor: "hsl(210, 100%, 60%)",
    backgroundGradient: "linear-gradient(135deg, hsl(210, 100%, 98%) 0%, hsl(210, 100%, 92%) 100%)",
    ctaText: "Shop All Sony Products",
    heroImage: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1600&q=80",
    collections: [
      { id: "all-sony", title: "All Items", subtitle: "Browse everything", image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80", searchTerm: "sony" },
      { id: "sony-headphones", title: "Headphones", subtitle: "Premium audio", image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80", searchTerm: "sony headphones" },
      { id: "sony-cameras", title: "Cameras", subtitle: "Mirrorless & more", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80", searchTerm: "sony camera" },
      { id: "sony-tv", title: "TVs", subtitle: "Bravia displays", image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=80", searchTerm: "sony tv" },
      { id: "sony-speakers", title: "Speakers", subtitle: "Portable & home", image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=80", searchTerm: "sony speakers" },
    ],
  },
  madein: {
    id: "madein",
    name: "Made In",
    logo: "/lovable-uploads/fafc0202-32b9-4ea2-8754-fba313037ea7.png",
    searchTerm: "made in cookware",
    heroTagline: "Crafted for Chefs",
    description: "Professional-grade cookware made in the USA. Trusted by world-class chefs and cooking enthusiasts.",
    primaryColor: "hsl(25, 95%, 35%)",
    secondaryColor: "hsl(25, 95%, 95%)",
    backgroundGradient: "linear-gradient(135deg, hsl(25, 95%, 98%) 0%, hsl(25, 95%, 92%) 100%)",
    ctaText: "Shop All Made In Products",
    heroImage: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&q=80",
    collections: [
      { id: "all-madein", title: "All Items", subtitle: "Browse everything", image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80", searchTerm: "made in cookware" },
      { id: "madein-pans", title: "Pans", subtitle: "Skillets & sauté pans", image: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&q=80", searchTerm: "made in frying pan" },
      { id: "madein-knives", title: "Knives", subtitle: "Chef's essentials", image: "https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800&q=80", searchTerm: "made in knives" },
      { id: "madein-pots", title: "Pots", subtitle: "Stock & sauce pots", image: "https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=800&q=80", searchTerm: "made in pots cookware" },
    ],
  },
  lego: {
    id: "lego",
    name: "Lego",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/24/LEGO_logo.svg",
    searchTerm: "lego",
    heroTagline: "Play Well",
    description: "Build, create, and explore with LEGO's endless possibilities for builders of all ages.",
    primaryColor: "hsl(348, 100%, 40%)",
    secondaryColor: "hsl(45, 100%, 50%)",
    backgroundGradient: "linear-gradient(135deg, hsl(348, 100%, 98%) 0%, hsl(45, 100%, 95%) 100%)",
    ctaText: "Shop All LEGO Products",
    heroImage: "https://images.unsplash.com/photo-1587654780291-39c9404d7dd0?w=1600&q=80",
    collections: [
      { id: "all-lego", title: "All Items", subtitle: "Browse everything", image: "https://images.unsplash.com/photo-1587654780291-39c9404d7dd0?w=800&q=80", searchTerm: "lego" },
      { id: "lego-city", title: "City", subtitle: "Urban adventures", image: "https://images.unsplash.com/photo-1560961911-ba7ef651a56c?w=800&q=80", searchTerm: "lego city" },
      { id: "lego-technic", title: "Technic", subtitle: "Advanced builds", image: "https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=800&q=80", searchTerm: "lego technic" },
      { id: "lego-starwars", title: "Star Wars", subtitle: "Galaxy far away", image: "https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=800&q=80", searchTerm: "lego star wars" },
      { id: "lego-creator", title: "Creator", subtitle: "Creative builds", image: "https://images.unsplash.com/photo-1566140967404-b8b3932483f5?w=800&q=80", searchTerm: "lego creator" },
    ],
  },
  yeti: {
    id: "yeti",
    name: "Yeti",
    logo: "/images/brands/yeti-logo.svg",
    searchTerm: "yeti",
    heroTagline: "Wildly Stronger. Keep Ice Longer.",
    description: "Premium coolers, drinkware, and outdoor gear built for the wild. Engineered to be virtually indestructible.",
    primaryColor: "hsl(209, 61%, 16%)",
    secondaryColor: "hsl(209, 61%, 95%)",
    backgroundGradient: "linear-gradient(135deg, hsl(209, 61%, 98%) 0%, hsl(209, 61%, 92%) 100%)",
    ctaText: "Shop All Yeti Products",
    heroImage: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1600&q=80",
    collections: [
      { id: "all-yeti", title: "All Items", subtitle: "Browse everything", image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80", searchTerm: "yeti" },
      { id: "yeti-tumblers", title: "Tumblers", subtitle: "Insulated drinkware", image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80", searchTerm: "yeti tumbler" },
      { id: "yeti-coolers", title: "Coolers", subtitle: "Hard & soft coolers", image: "https://images.unsplash.com/photo-1571168136613-46401b03904e?w=800&q=80", searchTerm: "yeti cooler" },
      { id: "yeti-bottles", title: "Bottles", subtitle: "Water bottles", image: "https://images.unsplash.com/photo-1523362628745-0c100fc609cf?w=800&q=80", searchTerm: "yeti water bottle" },
    ],
  },
  playstation: {
    id: "playstation",
    name: "PlayStation",
    logo: "/images/brands/playstation-logo.png",
    searchTerm: "playstation",
    heroTagline: "Play Has No Limits",
    description: "Explore the ultimate gaming experience with PlayStation's cutting-edge consoles, games, and accessories.",
    primaryColor: "hsl(218, 100%, 50%)",
    secondaryColor: "hsl(218, 100%, 95%)",
    backgroundGradient: "linear-gradient(135deg, hsl(218, 100%, 98%) 0%, hsl(218, 100%, 92%) 100%)",
    ctaText: "Shop All PlayStation Products",
    heroImage: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=1600&q=80",
    collections: [
      { id: "all-playstation", title: "All Items", subtitle: "Browse everything", image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&q=80", searchTerm: "playstation" },
      { id: "ps5-console", title: "PS5 Console", subtitle: "Next-gen gaming", image: "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=800&q=80", searchTerm: "playstation 5 console" },
      { id: "ps5-games", title: "Games", subtitle: "Latest titles", image: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800&q=80", searchTerm: "playstation 5 games" },
      { id: "ps-accessories", title: "Accessories", subtitle: "Controllers & more", image: "https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=800&q=80", searchTerm: "playstation accessories controller" },
    ],
  },
};

export const getBrandData = (brandId: string): BrandData | null => {
  const normalizedId = brandId.toLowerCase().replace(/\s+/g, '');
  
  // Handle special brand name mappings
  const brandMappings: Record<string, string> = {
    'madein': 'madein',
    'made in': 'madein',
  };
  
  const mappedId = brandMappings[normalizedId] || normalizedId;
  return brandData[mappedId] || null;
};
