
/**
 * Maps category URL parameters to display names
 */
export const getCategoryName = (categoryUrl: string | null) => {
  const categoryList = [
    { url: "electronics", name: "Electronics" },
    { url: "clothing", name: "Clothing" },
    { url: "home", name: "Home & Kitchen" },
    { url: "books", name: "Books" },
    { url: "toys", name: "Toys & Games" },
    { url: "beauty", name: "Beauty & Personal Care" },
    { url: "sports", name: "Sports & Outdoors" },
    { url: "automotive", name: "Automotive" },
    { url: "baby", name: "Baby" },
    { url: "health", name: "Health & Household" },
  ];
  
  const category = categoryList.find(c => c.url === categoryUrl);
  return category ? category.name : "All Products";
};
