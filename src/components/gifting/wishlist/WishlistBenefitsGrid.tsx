import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Share2, CheckCircle2, Sparkles } from "lucide-react";

interface WishlistBenefitsGridProps {
  className?: string;
}

const WishlistBenefitsGrid: React.FC<WishlistBenefitsGridProps> = ({ className }) => {
  const prefersReducedMotion = typeof window !== 'undefined' 
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const benefits = [
    {
      icon: Share2,
      title: "Share & Get What You Want",
      description: "Make your lists public and share with friends and family. No more guessing games—everyone knows exactly what you want.",
    },
    {
      icon: CheckCircle2,
      title: "Avoid Duplicate Gifts",
      description: "Friends can see when items are purchased, so you'll never receive the same gift twice. Perfect coordination, every time.",
    },
    {
      icon: Sparkles,
      title: "Power AI Recommendations",
      description: "Your wishlists help our AI understand your style and preferences, making gift suggestions from others even more on-point.",
    }
  ];

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon;
          
          return (
            <motion.div
              key={benefit.title}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.4, 
                delay: prefersReducedMotion ? 0 : index * 0.1,
                ease: "easeOut"
              }}
              style={{ transform: 'translate3d(0,0,0)', willChange: 'transform, opacity' }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow duration-200 border-border/50">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default WishlistBenefitsGrid;
