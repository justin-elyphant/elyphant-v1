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
    ctaText: "Explore Apple Products"
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
    ctaText: "Shop Samsung"
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
    ctaText: "Shop Nike"
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
    ctaText: "Explore Adidas"
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
    ctaText: "Discover Sony"
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
    ctaText: "Shop Made In"
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
    ctaText: "Build with LEGO"
  },
  yeti: {
    id: "yeti",
    name: "Yeti",
    logo: "https://logo.clearbit.com/yeti.com",
    searchTerm: "yeti",
    heroTagline: "Wildly Stronger. Keep Ice Longer.",
    description: "Premium coolers, drinkware, and outdoor gear built for the wild. Engineered to be virtually indestructible.",
    primaryColor: "hsl(209, 61%, 16%)",
    secondaryColor: "hsl(209, 61%, 95%)",
    backgroundGradient: "linear-gradient(135deg, hsl(209, 61%, 98%) 0%, hsl(209, 61%, 92%) 100%)",
    ctaText: "Shop Yeti"
  },
  playstation: {
    id: "playstation",
    name: "PlayStation",
    logo: "https://logo.clearbit.com/playstation.com",
    searchTerm: "playstation",
    heroTagline: "Play Has No Limits",
    description: "Explore the ultimate gaming experience with PlayStation's cutting-edge consoles, games, and accessories.",
    primaryColor: "hsl(218, 100%, 50%)",
    secondaryColor: "hsl(218, 100%, 95%)",
    backgroundGradient: "linear-gradient(135deg, hsl(218, 100%, 98%) 0%, hsl(218, 100%, 92%) 100%)",
    ctaText: "Explore PlayStation"
  }
};

export const getBrandData = (brandId: string): BrandData | null => {
  const normalizedId = brandId.toLowerCase().replace(/\s+/g, '');
  
  // Handle special brand name mappings
  const brandMappings: Record<string, string> = {
    'madein': 'madein',
    'made in': 'madein'
  };
  
  const mappedId = brandMappings[normalizedId] || normalizedId;
  return brandData[mappedId] || null;
};