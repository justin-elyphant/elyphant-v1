import React from 'react';
import { useFavorites } from '@/components/gifting/hooks/useFavorites';
import { Product } from '@/types/product';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const FavoritesTabContent: React.FC = () => {
  const { favoriteItems, handleFavoriteToggle, isLoading } = useFavorites();
  const { addToCart, removeFromCart } = useCart();

  if (isLoading) {
    return <p>Loading favorites...</p>;
  }

  if (!favoriteItems || favoriteItems.length === 0) {
    return <p>No favorite items saved yet.</p>;
  }

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    toast.success(`${product.name} added to cart!`);
  };

  const handleRemoveItem = (productId: string) => {
    removeFromCart(productId);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {favoriteItems.map((product) => (
        <Card key={product.id} className="shadow-md">
          <div className="aspect-w-3 aspect-h-2 relative overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="object-cover rounded-t-md"
            />
          </div>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
            <p className="text-gray-600">${product.price?.toFixed(2)}</p>
            <div className="flex justify-between mt-4">
              <Button size="sm" onClick={() => handleAddToCart(product)}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleRemoveItem(product.product_id)}>
                Remove
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default FavoritesTabContent;
