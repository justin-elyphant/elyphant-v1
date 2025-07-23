
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share, Copy, Check, MessageCircle, Mail, Link } from 'lucide-react';
import { toast } from 'sonner';
import { triggerHapticFeedback, HapticPatterns } from '@/utils/haptics';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import ShareToConnectionButton from '@/components/messaging/ShareToConnectionButton';

interface ProductShareButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    image?: string;
    brand?: string;
  };
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  showLabel?: boolean;
}

const ProductShareButton: React.FC<ProductShareButtonProps> = ({
  product,
  variant = 'ghost',
  size = 'sm',
  showLabel = false
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const generateShareUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/product/${product.id}`;
  };

  const generateShareText = () => {
    return `Check out this ${product.brand ? `${product.brand} ` : ''}${product.name} for $${product.price.toFixed(2)}!`;
  };

  const handleCopyLink = async () => {
    triggerHapticFeedback(HapticPatterns.buttonTap);
    
    try {
      await navigator.clipboard.writeText(generateShareUrl());
      setIsCopied(true);
      toast.success('Link copied to clipboard!');
      
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleNativeShare = async () => {
    triggerHapticFeedback(HapticPatterns.cardTap);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: generateShareText(),
          url: generateShareUrl(),
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to copy link
      handleCopyLink();
    }
  };

  const handleEmailShare = () => {
    triggerHapticFeedback(HapticPatterns.buttonTap);
    
    const subject = encodeURIComponent(`Check out this ${product.name}`);
    const body = encodeURIComponent(`${generateShareText()}\n\n${generateShareUrl()}`);
    
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleTextShare = () => {
    triggerHapticFeedback(HapticPatterns.buttonTap);
    
    const text = encodeURIComponent(`${generateShareText()} ${generateShareUrl()}`);
    
    // iOS SMS
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      window.open(`sms:&body=${text}`, '_blank');
    } else {
      // Android SMS
      window.open(`sms:?body=${text}`, '_blank');
    }
  };

  // Convert product to match ShareToConnectionButton expected format
  const shareProduct = {
    product_id: product.id,
    id: product.id,
    title: product.name,
    name: product.name,
    image: product.image || "/placeholder.svg",
    price: product.price,
    brand: product.brand
  };

  const shareOptions = [
    {
      id: 'native',
      label: 'Share',
      icon: Share,
      action: handleNativeShare,
      available: !!navigator.share,
      primary: true
    },
    {
      id: 'copy',
      label: isCopied ? 'Copied!' : 'Copy Link',
      icon: isCopied ? Check : Copy,
      action: handleCopyLink,
      available: true,
      primary: !navigator.share
    },
    {
      id: 'text',
      label: 'Text Message',
      icon: MessageCircle,
      action: handleTextShare,
      available: true,
      primary: false
    },
    {
      id: 'email',
      label: 'Email',
      icon: Mail,
      action: handleEmailShare,
      available: true,
      primary: false
    }
  ];

  const availableOptions = shareOptions.filter(option => option.available);

  // If native sharing is available, use it directly
  if (navigator.share && !showLabel) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={handleNativeShare}
        className="touch-target-44 tap-feedback"
        aria-label={`Share ${product.name}`}
      >
        <Share className="w-4 h-4" />
        {showLabel && <span className="ml-2">Share</span>}
      </Button>
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className="touch-target-44 tap-feedback"
          aria-label={`Share ${product.name}`}
        >
          <Share className="w-4 h-4" />
          {showLabel && <span className="ml-2">Share</span>}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="bottom" className="safe-area-bottom">
        <SheetHeader className="text-left">
          <SheetTitle>Share Product</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6">
          {/* Product Preview */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-6">
            {product.image && (
              <img
                src={product.image}
                alt={product.name}
                className="w-12 h-12 object-cover rounded-md"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{product.name}</p>
              {product.brand && (
                <p className="text-xs text-gray-500">{product.brand}</p>
              )}
              <p className="text-sm font-semibold text-green-600">
                ${product.price.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Connection Sharing - New Feature */}
          <div className="mb-4 pb-4 border-b">
            <h3 className="text-sm font-medium mb-3 text-muted-foreground">Share with Friends</h3>
            <ShareToConnectionButton 
              product={shareProduct}
              variant="full" 
              className="w-full justify-start h-14 flex-col gap-2"
            />
          </div>

          {/* Traditional Share Options */}
          <div>
            <h3 className="text-sm font-medium mb-3 text-muted-foreground">Other Options</h3>
            <div className="grid grid-cols-2 gap-3">
              {availableOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.id}
                    variant="outline"
                    onClick={option.action}
                    className="h-14 flex-col gap-2 touch-target-44 tap-feedback"
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{option.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProductShareButton;
