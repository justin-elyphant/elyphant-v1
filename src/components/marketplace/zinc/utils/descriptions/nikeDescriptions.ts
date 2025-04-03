
/**
 * Nike-specific descriptions for athletic shoes
 */
export const nikeTemplates = [
  "Experience the legendary comfort and style of these Nike athletic shoes. Featuring Nike's iconic design with responsive cushioning technology, breathable materials, and enhanced support for superior performance. The durable rubber outsole provides excellent traction on various surfaces.",
  
  "Elevate your performance with these premium Nike shoes. Designed with Nike's innovative cushioning system that delivers responsive energy return with every step. The lightweight construction and breathable upper ensure comfort during intense activities.",
  
  "Step into greatness with these Nike athletic shoes. Featuring Nike's signature style combined with cutting-edge performance technology including responsive foam midsole, breathable mesh panels, and strategic support features for exceptional comfort.",
  
  "Train with confidence in these Nike performance shoes. Built with Nike's advanced dynamic support system, responsive cushioning, and breathable materials that adapt to your movements. The durable rubber outsole provides multi-surface traction.",
  
  "The perfect blend of style and performance, these Nike shoes feature innovative cushioning technology for responsive comfort, breathable mesh panels to keep feet cool, and durable construction for lasting support through every workout."
];

/**
 * Details for specific Nike shoe lines
 */
export const nikeShoeLineDetails: Record<string, string> = {
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

/**
 * Generates Nike-specific shoe description with additional detail for specific lines
 */
export const getNikeDescription = (productName: string): string => {
  // Select random template
  const description = nikeTemplates[Math.floor(Math.random() * nikeTemplates.length)];
  
  // Extract shoe line if present (Air Max, Jordan, etc.)
  let shoeLine = "";
  const shoeLines = Object.keys(nikeShoeLineDetails);
  
  for (const line of shoeLines) {
    if (productName.includes(line)) {
      shoeLine = line;
      break;
    }
  }
  
  // Add shoe line specific details if detected
  if (shoeLine) {
    return `${description} ${nikeShoeLineDetails[shoeLine]}`;
  }
  
  return description;
};
