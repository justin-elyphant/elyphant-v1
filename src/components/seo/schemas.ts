// JSON-LD Structured Data Schemas

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Elyphant",
  "url": "https://elyphant.ai",
  "logo": "https://elyphant.ai/lovable-uploads/9b4f3dc7-ff8b-46c4-9eb3-56681e8c73b9.png",
  "description": "AI-powered gift discovery platform that helps users find perfect gifts with personalized recommendations and smart search technology.",
  "foundingDate": "2024",
  "sameAs": [
    "https://twitter.com/elyphant_ai"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "url": "https://elyphant.ai"
  }
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Elyphant",
  "url": "https://elyphant.ai",
  "description": "AI-powered gift discovery and personalized recommendations platform",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://elyphant.ai/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

export const webApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Elyphant",
  "url": "https://elyphant.ai",
  "description": "Smart gift discovery platform powered by AI that provides personalized gift recommendations",
  "applicationCategory": "E-commerce",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "featureList": [
    "AI-powered gift recommendations",
    "Smart search functionality", 
    "Wishlist creation and sharing",
    "Automated gifting system",
    "Personalized gift suggestions"
  ]
};

export const marketplaceSchema = {
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  "name": "Elyphant Marketplace",
  "url": "https://elyphant.ai/marketplace",
  "description": "Curated marketplace of gifts with AI-powered recommendations and personalized shopping experience",
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Gift Catalog",
    "itemListElement": [
      {
        "@type": "OfferCategory",
        "name": "Personalized Gifts"
      },
      {
        "@type": "OfferCategory", 
        "name": "Tech Gadgets"
      },
      {
        "@type": "OfferCategory",
        "name": "Home & Living"
      }
    ]
  }
};

export const breadcrumbSchema = (items: Array<{ name: string; url: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }))
});

export const faqSchema = (faqs: Array<{ question: string; answer: string }>) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
});