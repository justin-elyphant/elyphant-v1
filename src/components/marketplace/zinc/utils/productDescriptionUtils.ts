
// This file contains utilities for generating product descriptions

/**
 * Generates a realistic product description based on product name and category
 */
export const generateDescription = (productName: string, category: string): string => {
  // Extract brand if possible
  const brand = productName.split(' ')[0];
  
  // Extract product type
  const productType = extractProductType(productName);
  
  // Base templates by category
  const templates: Record<string, string[]> = {
    "Footwear": [
      "Experience exceptional comfort and style with these {brand} {productType}. Designed with premium materials and advanced cushioning technology for all-day wear. Features a durable rubber outsole for excellent traction on various surfaces.",
      "Step into comfort with the {brand} {productType}. Engineered for performance and style, these shoes feature responsive cushioning, breathable materials, and a supportive fit that adapts to your movements.",
      "Elevate your athletic performance with the {brand} {productType}. Featuring innovative {brand} technology that provides stability, comfort, and breathability. Perfect for serious athletes and casual wearers alike.",
      "The {brand} {productType} combines sleek design with cutting-edge performance features. Enjoy premium cushioning, enhanced durability, and a responsive feel with every step. Breathable mesh upper keeps feet cool during intense activities."
    ],
    "Electronics": [
      "The {brand} {productType} delivers exceptional performance in a sleek design. Featuring the latest technology, this device offers lightning-fast processing speeds, stunning displays, and seamless connectivity options.",
      "Experience next-generation technology with the {brand} {productType}. Engineered for performance and reliability, this device includes advanced features like enhanced battery life, premium build quality, and intuitive user interface.",
      "Elevate your tech experience with the {brand} {productType}. This premium device comes with cutting-edge specifications, including faster processors, improved displays, and enhanced security features.",
      "The {brand} {productType} represents the perfect blend of innovation and design. Enjoy faster performance, improved efficiency, and a suite of smart features that adapt to your lifestyle."
    ],
    "Clothing": [
      "Made with premium materials, this {brand} {productType} offers exceptional comfort and style. Features a modern fit design, durable construction, and versatile styling options for everyday wear.",
      "Elevate your wardrobe with this {brand} {productType}. Crafted from high-quality fabrics that provide comfort, breathability, and lasting durability. Perfect for both casual outings and athletic activities.",
      "The {brand} {productType} combines fashion-forward design with premium comfort. Featuring moisture-wicking technology, stretchable fabric, and a contemporary fit that flatters your silhouette.",
      "Experience premium comfort with this {brand} {productType}. Made with sustainable materials and advanced fabric technology for enhanced breathability, flexibility, and all-day comfort."
    ],
    "Sports": [
      "Elevate your game with this premium {brand} {productType}. Designed for serious athletes, it features advanced materials, ergonomic design, and professional-grade construction for optimal performance.",
      "This {brand} {productType} is engineered for peak athletic performance. Features include durable construction, responsive materials, and innovative design elements that help you reach your potential.",
      "Take your sport to the next level with the {brand} {productType}. Crafted with premium materials and cutting-edge technology to provide enhanced control, comfort, and durability during intense activities.",
      "The {brand} {productType} combines innovative design with high-performance materials. Trusted by professionals worldwide, this equipment delivers reliable performance, enhanced control, and lasting durability."
    ],
    "Gaming": [
      "Immerse yourself in next-level gaming with the {brand} {productType}. Featuring cutting-edge technology, responsive controls, and stunning graphics capabilities that transform your gaming experience.",
      "The {brand} {productType} delivers exceptional performance for serious gamers. With advanced processing power, premium build quality, and immersive features, this device takes your gaming to new heights.",
      "Experience gaming like never before with the {brand} {productType}. Engineered with high-performance components, low-latency response, and customizable features designed for competitive gameplay.",
      "Level up your gaming setup with the {brand} {productType}. This premium device features advanced cooling systems, customizable lighting, and lightning-fast response times for a competitive edge."
    ],
    "Home": [
      "Transform your home with the {brand} {productType}. This premium appliance combines sleek design with powerful performance to effortlessly handle everyday tasks while adding style to your living space.",
      "The {brand} {productType} brings innovation to your home. Featuring intelligent controls, energy-efficient operation, and premium build quality that enhances your living environment.",
      "Elevate your home experience with the {brand} {productType}. Designed with advanced technology, intuitive controls, and thoughtful features that simplify daily tasks and enhance your lifestyle.",
      "Experience next-generation home convenience with the {brand} {productType}. This smart appliance combines elegant design with powerful performance and user-friendly features for modern living."
    ],
    "Beauty": [
      "Achieve professional-quality results with the {brand} {productType}. Formulated with premium ingredients that nourish, enhance, and protect while delivering stunning, long-lasting results.",
      "The {brand} {productType} is your secret to radiant beauty. This premium formula contains advanced ingredients that work in harmony with your natural features for flawless results.",
      "Experience transformative beauty with the {brand} {productType}. Created with innovative formulations and high-quality ingredients that deliver exceptional results and enhance your natural beauty.",
      "Reveal your best self with the {brand} {productType}. This luxury beauty essential features carefully selected ingredients that provide exceptional performance, comfort, and lasting results."
    ]
  };
  
  // Nike-specific descriptions for athletic shoes
  if (brand.toLowerCase() === "nike" && category === "Footwear") {
    return getNikeDescription(productName);
  }
  
  // Default to generic description if category not found
  const categoryTemplates = templates[category] || [
    "This premium {brand} {productType} combines quality craftsmanship with innovative design. Features include durable construction, premium materials, and thoughtful details that enhance your experience.",
    "Experience exceptional quality with this {brand} {productType}. Designed with attention to detail, advanced features, and reliable performance that exceeds expectations.",
    "The {brand} {productType} delivers outstanding performance and reliability. Crafted with premium materials and innovative technology to provide an exceptional user experience.",
    "Elevate your lifestyle with the {brand} {productType}. This premium product features thoughtful design, quality materials, and reliable performance for everyday excellence."
  ];
  
  // Select a random template from the category
  const template = categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)];
  
  // Replace placeholders
  return template
    .replace(/{brand}/g, brand)
    .replace(/{productType}/g, productType)
    .trim();
};

/**
 * Extracts the product type from a product name
 */
const extractProductType = (productName: string): string => {
  const words = productName.split(' ');
  
  // Skip the brand (first word) and try to find a good product type
  if (words.length > 2) {
    // For longer names, use the last 2-3 words as the product type
    return words.slice(-3).join(' ');
  } else if (words.length > 1) {
    // For shorter names, use all but the first word
    return words.slice(1).join(' ');
  }
  
  // Fallback to "product" if we can't extract a good type
  return "product";
};

/**
 * Generates Nike-specific descriptions
 */
const getNikeDescription = (productName: string): string => {
  const nikeTemplates = [
    "Experience the legendary comfort and style of these Nike athletic shoes. Featuring Nike's iconic design with responsive cushioning technology, breathable materials, and enhanced support for superior performance. The durable rubber outsole provides excellent traction on various surfaces.",
    
    "Elevate your performance with these premium Nike shoes. Designed with Nike's innovative cushioning system that delivers responsive energy return with every step. The lightweight construction and breathable upper ensure comfort during intense activities.",
    
    "Step into greatness with these Nike athletic shoes. Featuring Nike's signature style combined with cutting-edge performance technology including responsive foam midsole, breathable mesh panels, and strategic support features for exceptional comfort.",
    
    "Train with confidence in these Nike performance shoes. Built with Nike's advanced dynamic support system, responsive cushioning, and breathable materials that adapt to your movements. The durable rubber outsole provides multi-surface traction.",
    
    "The perfect blend of style and performance, these Nike shoes feature innovative cushioning technology for responsive comfort, breathable mesh panels to keep feet cool, and durable construction for lasting support through every workout."
  ];
  
  // Extract shoe line if present (Air Max, Jordan, etc.)
  let shoeLine = "";
  const shoeLines = ["Air Force", "Air Jordan", "Air Max", "Dunk", "Blazer", "React", "Free Run", "Metcon", "Pegasus", "Zoom"];
  
  for (const line of shoeLines) {
    if (productName.includes(line)) {
      shoeLine = line;
      break;
    }
  }
  
  // Select random template
  let description = nikeTemplates[Math.floor(Math.random() * nikeTemplates.length)];
  
  // Add shoe line specific details if detected
  if (shoeLine) {
    const lineDetails: Record<string, string> = {
      "Air Force": "The iconic Nike Air Force design delivers timeless style with premium materials and Air-Sole cushioning for all-day comfort.",
      "Air Jordan": "Part of the legendary Air Jordan collection, these shoes feature premium materials, iconic design elements, and responsive cushioning.",
      "Air Max": "Featuring Nike's visible Air Max cushioning for maximum impact protection and responsive comfort with every step.",
      "Dunk": "The classic Nike Dunk silhouette offers basketball-inspired performance with durable construction and iconic colorways.",
      "Blazer": "The vintage-inspired Nike Blazer design combines classic style with modern comfort features for everyday wear.",
      "React": "Equipped with Nike React foam technology that delivers an incredibly smooth ride and responsive energy return.",
      "Free Run": "Built with Nike Free technology that allows natural motion flexibility while providing cushioned support.",
      "Metcon": "Designed for training, the Nike Metcon features a stable heel, flexible forefoot, and durable construction for workout versatility.",
      "Pegasus": "The trusted Nike Pegasus features responsive cushioning and breathable support perfect for your daily runs.",
      "Zoom": "Powered by Nike Zoom Air technology that provides low-profile, responsive cushioning for speed and agility."
    };
    
    description += " " + (lineDetails[shoeLine] || "");
  }
  
  return description.trim();
};
