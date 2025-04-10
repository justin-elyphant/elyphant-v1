
export const experienceCategories = [
  { name: "Spa Day", emoji: "💆" },
  { name: "Concerts", emoji: "🎵" },
  { name: "Theater", emoji: "🎭" },
  { name: "Food Tours", emoji: "🍽️" },
  { name: "Cooking Classes", emoji: "👨‍🍳" },
  { name: "Golf", emoji: "⛳" },
  { name: "Adventure", emoji: "🧗" },
  { name: "Workshops", emoji: "🔨" },
  { name: "Wine Tasting", emoji: "🍷" },
  { name: "Experiences", emoji: "🎁" }
];

export const popularBrands = [
  "Apple", "Nike", "Adidas", "Samsung", "Sony", "Lego", "Nintendo", 
  "Amazon", "Sephora", "Nordstrom", "Target", "Ikea"
];

export const suggestedCategories = [
  "Books", "Technology", "Fashion", "Home Decor", "Cooking", "Fitness",
  "Travel", "Music", "Art", "Gaming", "Beauty", "Outdoors", "Sports",
  // Brand categories included in popularBrands
];

// Helper function to filter out categories already in experiences or brands
export const getOtherCategories = () => {
  return suggestedCategories.filter(category => 
    !experienceCategories.some(exp => exp.name === category) && 
    !popularBrands.includes(category)
  );
};
