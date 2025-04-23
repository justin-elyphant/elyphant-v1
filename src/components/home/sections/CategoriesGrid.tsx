
import React from "react";
import { Link } from "react-router-dom";

interface Category {
  id: string;
  name: string;
  image: string;
  url: string;
}

const CategoriesGrid = () => {
  const categories: Category[] = [
    {
      id: "birthdays",
      name: "Birthdays",
      image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80",
      url: "/gifting?category=birthday"
    },
    {
      id: "anniversaries",
      name: "Anniversaries",
      image: "https://images.unsplash.com/photo-1522057384400-681b421cfebc?w=800&auto=format&fit=crop&q=80",
      url: "/gifting?category=anniversary"
    },
    {
      id: "holidays",
      name: "Holidays",
      image: "https://images.unsplash.com/photo-1513297887119-d46091b24bfa?w=800&auto=format&fit=crop&q=80",
      url: "/gifting?category=holiday"
    },
    {
      id: "corporate",
      name: "Corporate",
      image: "https://images.unsplash.com/photo-1513530534585-c7b1394c6d51?w=800&auto=format&fit=crop&q=80",
      url: "/gifting?category=corporate"
    }
  ];
  
  return (
    <div className="py-16 bg-gray-50">
      <div className="container px-4">
        <h2 className="text-3xl font-bold mb-3 text-center">Curated for Every Type of Person</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Discover thoughtfully selected gifts for every occasion and every type of recipient
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Link 
              key={category.id}
              to={category.url}
              className="group relative overflow-hidden rounded-lg aspect-square"
            >
              <img 
                src={category.image}
                alt={category.name}
                className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                <h3 className="text-white font-semibold text-xl">{category.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoriesGrid;
