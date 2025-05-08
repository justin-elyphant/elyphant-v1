
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface ExperienceCard {
  id: string;
  title: string;
  image: string;
  location: string;
  label: "Popular Experience" | "Digital Delivery";
  available: boolean;
  searchTerm: string;
}

const ExperienceGiftingSection = () => {
  const navigate = useNavigate();
  const [experiences, setExperiences] = useState<ExperienceCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchExperiences = async () => {
      setIsLoading(true);
      
      // Define experience types we want to display
      const experienceTypes = [
        {
          title: "Luxury Spa Day",
          searchTerm: "spa day gift",
          location: "Available Nationwide",
          label: "Popular Experience" as const
        },
        {
          title: "Golf Course Experience",
          searchTerm: "golf course gift",
          location: "Multiple Locations",
          label: "Popular Experience" as const
        },
        {
          title: "Boutique Hotel Stay",
          searchTerm: "boutique hotel gift",
          location: "Major Cities",
          label: "Popular Experience" as const
        },
        {
          title: "Couples Massage",
          searchTerm: "couples massage gift",
          location: "Available Nationwide",
          label: "Popular Experience" as const
        },
        {
          title: "Fine Dining Experience",
          searchTerm: "fine dining gift card",
          location: "Your City",
          label: "Digital Delivery" as const
        },
        {
          title: "Wine Tasting Tour",
          searchTerm: "wine tasting experience",
          location: "Select Regions",
          label: "Popular Experience" as const
        }
      ];
      
      try {
        // For each experience type, get a curated Unsplash image
        // In a real implementation, we'd call the Unsplash API directly
        const fetchedExperiences: ExperienceCard[] = experienceTypes.map((exp, index) => {
          // These are carefully selected Unsplash images that won't change
          const unsplashImageMap: Record<string, string> = {
            "spa day gift": "https://images.unsplash.com/photo-1620733723572-11c53f73a416?w=800&auto=format&fit=crop&q=80",
            "golf course gift": "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&auto=format&fit=crop&q=80",
            "boutique hotel gift": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&auto=format&fit=crop&q=80",
            "couples massage gift": "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop&q=80",
            "fine dining gift card": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&auto=format&fit=crop&q=80",
            "wine tasting experience": "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&auto=format&fit=crop&q=80"
          };
          
          return {
            id: `exp-${index}`,
            title: exp.title,
            image: unsplashImageMap[exp.searchTerm] || `https://source.unsplash.com/random/?${encodeURIComponent(exp.searchTerm)}`,
            location: exp.location,
            label: exp.label,
            available: Math.random() > 0.2, // 80% chance of being available
            searchTerm: exp.searchTerm
          };
        });
        
        setExperiences(fetchedExperiences);
      } catch (error) {
        console.error("Error fetching experience images:", error);
        // Fallback experience data with placeholder images
        const fallbackExperiences = experienceTypes.map((exp, index) => ({
          id: `exp-${index}`,
          title: exp.title,
          image: "/placeholder.svg",
          location: exp.location,
          label: exp.label,
          available: true,
          searchTerm: exp.searchTerm
        }));
        
        setExperiences(fallbackExperiences);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExperiences();
  }, []);
  
  const handleExperienceClick = (searchTerm: string) => {
    navigate(`/marketplace?search=${encodeURIComponent(searchTerm)}`);
  };
  
  if (isLoading) {
    return (
      <div className="py-16 bg-gray-50">
        <div className="container px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Giftable Experiences Near You</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <div className="aspect-video bg-slate-200"></div>
                <CardContent className="p-4">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-16 bg-gray-50">
      <div className="container px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">Giftable Experiences Near You</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {experiences.map((exp) => (
            <Card 
              key={exp.id} 
              className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleExperienceClick(exp.searchTerm)}
            >
              <div className="aspect-video relative">
                <img 
                  src={exp.image} 
                  alt={exp.title}
                  className="object-cover w-full h-full"
                  loading="lazy"
                />
                <Badge 
                  className={`absolute top-3 right-3 ${
                    exp.label === "Popular Experience" ? "bg-purple-600" : "bg-blue-600"
                  }`}
                >
                  {exp.label}
                </Badge>
              </div>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-1">{exp.title}</h3>
                <div className="flex justify-between">
                  <p className="text-sm text-muted-foreground">{exp.location}</p>
                  {exp.available ? (
                    <span className="text-sm text-green-600 font-medium">Available</span>
                  ) : (
                    <span className="text-sm text-amber-600 font-medium">Coming Soon</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExperienceGiftingSection;
