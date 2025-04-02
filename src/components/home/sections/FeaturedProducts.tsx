
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

type ProductProps = {
  products: {
    id: number;
    name: string;
    price: number;
    image: string;
    vendor: string;
  }[];
};

const FeaturedProducts = ({ products }: ProductProps) => {
  return (
    <div className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Featured Products</h2>
        <Link to="/gifting" className="text-purple-600 hover:text-purple-800 text-sm font-medium">
          View all products
        </Link>
      </div>
      
      <Carousel className="w-full">
        <CarouselContent>
          {products.map((product) => (
            <CarouselItem key={product.id} className="md:basis-1/2 lg:basis-1/4">
              <div className="p-1">
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-square relative">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-1 line-clamp-1">{product.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{product.vendor}</p>
                    <p className="font-semibold">${product.price.toFixed(2)}</p>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="hidden md:block">
          <CarouselPrevious />
          <CarouselNext />
        </div>
      </Carousel>
    </div>
  );
};

export default FeaturedProducts;
