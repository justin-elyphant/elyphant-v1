
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

type Collection = {
  id: number;
  name: string;
  image: string;
};

type CollectionProps = {
  collections: Collection[];
};

const FeaturedCollections = ({ collections = [] }: CollectionProps) => {
  if (!collections || collections.length === 0) {
    return (
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Featured Collections</h2>
        <div className="flex items-center justify-center p-8 bg-gray-50 rounded-md">
          <p className="text-muted-foreground">No collections available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Featured Collections</h2>
        <Link to="/gifting" className="text-purple-600 hover:text-purple-800 text-sm font-medium">
          View all collections
        </Link>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {collections.map((collection) => (
          <Link key={collection.id} to={`/gifting?collection=${collection.id}`}>
            <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
              <div className="aspect-video relative">
                <img 
                  src={collection.image} 
                  alt={collection.name}
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <h3 className="text-white font-medium text-lg">{collection.name}</h3>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default FeaturedCollections;
