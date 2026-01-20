import React from "react";
import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  schema?: any;
  children?: React.ReactNode;
}

const SEOWrapper: React.FC<SEOProps> = ({
  title = "Elyphant - AI-Powered Gift Discovery & Personalized Recommendations",
  description = "Discover perfect gifts with AI-powered recommendations. Elyphant helps you find meaningful presents for everyone with smart search, wishlists, and personalized suggestions.",
  keywords = "AI gifts, gift recommendations, personalized gifts, gift finder, smart gifting, AI shopping, gift ideas, automated gifting, gift discovery, thoughtful presents",
  image = "/lovable-uploads/9b4f3dc7-ff8b-46c4-9eb3-56681e8c73b9.png",
  url,
  type = "website",
  author = "Elyphant",
  publishedTime,
  modifiedTime,
  schema,
  children
}) => {
  const currentUrl = url || `https://elyphant.ai${window.location.pathname}`;
  const imageUrl = image.startsWith('http') ? image : `https://elyphant.ai${image}`;

  return (
    <>
      <Helmet>
        {/* Primary Meta Tags */}
        <title>{title}</title>
        <meta name="title" content={title} />
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta name="author" content={author} />
        <link rel="canonical" href={currentUrl} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content={type} />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:site_name" content="Elyphant" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={currentUrl} />
        <meta property="twitter:title" content={title} />
        <meta property="twitter:description" content={description} />
        <meta property="twitter:image" content={imageUrl} />
        <meta property="twitter:site" content="@elyphant_ai" />
        <meta property="twitter:creator" content="@elyphant_ai" />

        {/* Article specific meta tags */}
        {publishedTime && <meta property="article:published_time" content={publishedTime} />}
        {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
        {author && <meta property="article:author" content={author} />}

        {/* Structured Data */}
        {schema && (
          <script type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        )}
      </Helmet>
      {children}
    </>
  );
};

export default SEOWrapper;