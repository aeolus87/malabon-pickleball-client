import React, { useState, useEffect } from "react";
import { getInitials } from "../../utils/userUtils";

interface UserAvatarProps {
  photoURL?: string | null;
  displayName?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  photoURL,
  displayName,
  size = "md",
  className = "",
}) => {
  const [imgError, setImgError] = useState(false);
  const [isGooglePhoto, setIsGooglePhoto] = useState(false);

  const sizeClasses = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
    xl: "w-16 h-16 text-3xl",
  };

  const sizeClass = sizeClasses[size];
  const initials = getInitials(displayName);

  // Check if the image is from Google (googleusercontent.com)
  useEffect(() => {
    if (
      photoURL &&
      typeof photoURL === "string" &&
      photoURL.includes("googleusercontent.com")
    ) {
      setIsGooglePhoto(true);
    } else {
      setIsGooglePhoto(false);
    }
  }, [photoURL]);

  // If we have a photo URL (not from Google), render an image
  if (photoURL && !imgError && !isGooglePhoto) {
    return (
      <img
        src={photoURL}
        alt={displayName || "User"}
        className={`${sizeClass} rounded-full object-cover border-2 border-green-500 ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  // Otherwise, render initials in a white circle with green text
  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-bold text-green-600 bg-white border border-gray-200 dark:border-gray-700 ${className}`}
      title={displayName || "User"}
    >
      {initials}
    </div>
  );
};

export default UserAvatar;
