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
    logo: "https://placehold.co/200x100/e2e8f0/64748b?text=Apple",
    searchTerm: "apple",
    heroTagline: "Innovation at Your Fingertips",
    description: "Discover Apple's latest collection of innovative products designed to enhance your digital lifestyle.",
    primaryColor: "hsl(0, 0%, 0%)",
    secondaryColor: "hsl(0, 0%, 95%)",
    backgroundGradient: "linear-gradient(135deg, hsl(0, 0%, 98%) 0%, hsl(0, 0%, 92%) 100%)",
    ctaText: "Explore Apple Products"
  },
  samsung: {
    id: "samsung",
    name: "Samsung",
    logo: "https://placehold.co/200x100/e2e8f0/64748b?text=Samsung",
    searchTerm: "samsung",
    heroTagline: "Do What You Can't",
    description: "Experience cutting-edge technology with Samsung's innovative lineup of smartphones, tablets, and home appliances.",
    primaryColor: "hsl(217, 91%, 60%)",
    secondaryColor: "hsl(217, 91%, 95%)",
    backgroundGradient: "linear-gradient(135deg, hsl(217, 91%, 98%) 0%, hsl(217, 91%, 92%) 100%)",
    ctaText: "Shop Samsung"
  },
  nike: {
    id: "nike",
    name: "Nike",
    logo: "https://placehold.co/200x100/e2e8f0/64748b?text=Nike",
    searchTerm: "nike",
    heroTagline: "Just Do It",
    description: "Elevate your performance with Nike's premium athletic wear, footwear, and equipment designed for champions.",
    primaryColor: "hsl(0, 0%, 0%)",
    secondaryColor: "hsl(39, 100%, 50%)",
    backgroundGradient: "linear-gradient(135deg, hsl(0, 0%, 5%) 0%, hsl(0, 0%, 15%) 100%)",
    ctaText: "Shop Nike"
  },
  adidas: {
    id: "adidas",
    name: "Adidas",
    logo: "https://placehold.co/200x100/e2e8f0/64748b?text=Adidas",
    searchTerm: "adidas",
    heroTagline: "Impossible is Nothing",
    description: "Discover Adidas' iconic three stripes collection featuring premium sportswear and lifestyle products.",
    primaryColor: "hsl(0, 0%, 0%)",
    secondaryColor: "hsl(0, 0%, 100%)",
    backgroundGradient: "linear-gradient(135deg, hsl(0, 0%, 10%) 0%, hsl(0, 0%, 25%) 100%)",
    ctaText: "Explore Adidas"
  },
  sony: {
    id: "sony",
    name: "Sony",
    logo: "https://placehold.co/200x100/e2e8f0/64748b?text=Sony",
    searchTerm: "sony",
    heroTagline: "Be Moved",
    description: "Immerse yourself in Sony's world of entertainment with cutting-edge audio, gaming, and electronics.",
    primaryColor: "hsl(0, 0%, 0%)",
    secondaryColor: "hsl(210, 100%, 60%)",
    backgroundGradient: "linear-gradient(135deg, hsl(210, 100%, 98%) 0%, hsl(210, 100%, 92%) 100%)",
    ctaText: "Discover Sony"
  },
  madein: {
    id: "madein",
    name: "Made In",
    logo: "https://placehold.co/200x100/e2e8f0/64748b?text=Made+In",
    searchTerm: "made in cookware",
    heroTagline: "Crafted for Chefs",
    description: "Professional-grade cookware made in the USA. Trusted by world-class chefs and cooking enthusiasts.",
    primaryColor: "hsl(25, 95%, 53%)",
    secondaryColor: "hsl(25, 95%, 95%)",
    backgroundGradient: "linear-gradient(135deg, hsl(25, 95%, 98%) 0%, hsl(25, 95%, 92%) 100%)",
    ctaText: "Shop Made In"
  },
  lego: {
    id: "lego",
    name: "Lego",
    logo: "https://placehold.co/200x100/e2e8f0/64748b?text=Lego",
    searchTerm: "lego",
    heroTagline: "Play Well",
    description: "Build, create, and explore with LEGO's endless possibilities for builders of all ages.",
    primaryColor: "hsl(348, 100%, 50%)",
    secondaryColor: "hsl(45, 100%, 50%)",
    backgroundGradient: "linear-gradient(135deg, hsl(348, 100%, 98%) 0%, hsl(45, 100%, 95%) 100%)",
    ctaText: "Build with LEGO"
  }
};

export const getBrandData = (brandId: string): BrandData | null => {
  return brandData[brandId.toLowerCase()] || null;
};