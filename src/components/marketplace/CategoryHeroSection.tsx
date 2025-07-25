import React from "react";

interface CategoryHeroSectionProps {
  categoryType: 'giftsForHer' | 'giftsForHim' | 'giftsUnder50' | 'luxuryCategories';
  productCount?: number;
}

const CategoryHeroSection: React.FC<CategoryHeroSectionProps> = ({ 
  categoryType, 
  productCount = 0 
}) => {
  const getCategoryDetails = (type: string) => {
    switch (type) {
      case 'giftsForHer':
        return {
          title: 'Gifts for Her',
          subtitle: 'Thoughtfully curated for the special women in your life'
        };
      case 'giftsForHim':
        return {
          title: 'Gifts for Him',
          subtitle: 'Discover the perfect gift for every guy'
        };
      case 'giftsUnder50':
        return {
          title: 'Gifts Under $50',
          subtitle: 'Great gifts that won\'t break the bank'
        };
      case 'luxuryCategories':
        return {
          title: 'Luxury Gifts',
          subtitle: 'Premium selections for extraordinary moments'
        };
      default:
        return {
          title: 'Gift Collection',
          subtitle: 'Discover something special'
        };
    }
  };

  const { title, subtitle } = getCategoryDetails(categoryType);

  return (
    <div className="relative w-full h-48 md:h-56 overflow-hidden rounded-lg mb-8">
      {/* Clean gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        {/* Subtle overlay pattern */}
        <div className="absolute inset-0 bg-black/20"></div>
      </div>
      
      {/* Hero Content */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="text-center text-white px-6 max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light mb-3 tracking-wide">
            {title}
          </h1>
          <p className="text-base md:text-lg opacity-90 font-light mb-4">
            {subtitle}
          </p>
          {productCount > 0 && (
            <div className="inline-flex items-center">
              <span className="bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/20 text-sm font-light">
                {productCount.toLocaleString()} {productCount === 1 ? 'item' : 'items'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryHeroSection;