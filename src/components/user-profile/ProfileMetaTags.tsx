import React from "react";
import { Helmet } from "react-helmet-async";

interface ProfileMetaTagsProps {
  profileName: string;
  profileBio?: string;
  profileImage?: string;
  profileUrl: string;
  wishlistCount?: number;
}

/**
 * Social sharing meta tags for profile pages
 * Optimizes how the profile appears when shared on social media
 */
const ProfileMetaTags: React.FC<ProfileMetaTagsProps> = ({
  profileName,
  profileBio,
  profileImage,
  profileUrl,
  wishlistCount = 0
}) => {
  const title = `${profileName}'s Gift Wishlist`;
  const description = profileBio || `Check out ${profileName}'s wishlist with ${wishlistCount} items. Find the perfect gift!`;
  const image = profileImage || '/placeholder.svg';

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="profile" />
      <meta property="og:url" content={profileUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={profileUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

      {/* Mobile App Meta Tags */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content={profileName} />
    </Helmet>
  );
};

export default ProfileMetaTags;
