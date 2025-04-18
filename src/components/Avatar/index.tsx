import React, { useState, useEffect } from "react";
import { getInitials } from "../../utils/userUtils";

interface AvatarProps {
  src?: string | null;
  name: string | null | undefined;
  alt?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-12 h-12 text-lg",
  xl: "w-16 h-16 text-3xl",
};

/**
 * Avatar - A component for displaying user profile images with fallback
 *
 * Features:
 * - Lazy loading
 * - Loading state with skeleton
 * - Initials fallback with white bg and green text
 * - Sizes: xs (24px), sm (32px), md (40px), lg (48px), xl (64px)
 */
const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  alt,
  size = "md",
  className = "",
}) => {
  const [imageError, setImageError] = useState(false);
  const [isGooglePhoto, setIsGooglePhoto] = useState(false);
  const displayName = name || "User";
  const initials = getInitials(displayName);
  const sizeClass = sizeClasses[size];

  // Check if the image is from Google (googleusercontent.com)
  useEffect(() => {
    if (
      src &&
      typeof src === "string" &&
      src.includes("googleusercontent.com")
    ) {
      setIsGooglePhoto(true);
    } else {
      setIsGooglePhoto(false);
    }
  }, [src]);

  // If we have a valid photo URL (not from Google) and no errors, render an image
  if (src && !imageError && !isGooglePhoto) {
    return (
      <img
        src={src}
        alt={alt || displayName}
        className={`${sizeClass} rounded-full object-cover ${className}`}
        onError={() => setImageError(true)}
        loading="lazy"
      />
    );
  }

  // Otherwise, render initials in a white circle with green text
  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-bold text-green-600 bg-white border border-gray-200 dark:border-gray-700 ${className}`}
      title={alt || displayName}
    >
      {initials}
    </div>
  );
};

export default Avatar;
