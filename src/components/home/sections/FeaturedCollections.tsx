
import React from "react";
import { Link } from "react-router-dom";

type CollectionProps = {
  collections: {
    id: number;
    name: string;
    image: string;
    count: number;
  }[];
};

const FeaturedCollections = ({ collections }: CollectionProps) => {
  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold mb-6">Shop by Occasion</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {collections.map((collection) => (
          <Link to="/gifting" key={collection.id}>
            <div className="group relative overflow-hidden rounded-lg">
              <div className="aspect-[4/3]">
                <img 
                  src={collection.image} 
                  alt={collection.name}
                  className="object-cover w-full h-full transition-transform group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                <div>
                  <h3 className="text-white font-semibold">{collection.name}</h3>
                  <p className="text-white/80 text-sm">{collection.count} items</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default FeaturedCollections;
