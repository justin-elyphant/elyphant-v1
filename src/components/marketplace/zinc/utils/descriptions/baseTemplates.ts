
/**
 * Base templates for different product categories
 */
export const templates: Record<string, string[]> = {
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

// Default templates when no category matches
export const defaultTemplates = [
  "This premium {brand} {productType} combines quality craftsmanship with innovative design. Features include durable construction, premium materials, and thoughtful details that enhance your experience.",
  "Experience exceptional quality with this {brand} {productType}. Designed with attention to detail, advanced features, and reliable performance that exceeds expectations.",
  "The {brand} {productType} delivers outstanding performance and reliability. Crafted with premium materials and innovative technology to provide an exceptional user experience.",
  "Elevate your lifestyle with the {brand} {productType}. This premium product features thoughtful design, quality materials, and reliable performance for everyday excellence."
];
