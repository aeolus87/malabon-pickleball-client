import React from "react";
import Avatar from "../Avatar";
import { Link } from "react-router-dom";

interface UserBadgeProps {
  photoURL: string | null | undefined;
  displayName: string | null | undefined;
  userId?: string;
  size?: "xs" | "sm" | "md"; // Only smaller sizes for compact display
  showName?: boolean;
  className?: string;
  linkToProfile?: boolean;
}

/**
 * UserBadge - A compact component for displaying user avatar and name
 *
 * Designed for use in comments, posts, and other areas where a small
 * user representation is needed.
 */
const UserBadge: React.FC<UserBadgeProps> = ({
  photoURL,
  displayName,
  userId,
  size = "sm",
  showName = true,
  className = "",
  linkToProfile = true,
}) => {
  const avatarSize = size === "xs" ? "xs" : size === "sm" ? "sm" : "md";
  const nameSize =
    size === "xs" ? "text-xs" : size === "sm" ? "text-sm" : "text-base";

  // Create the content to render
  const content = (
    <div className={`flex items-center gap-2 ${className}`}>
      <Avatar
        src={photoURL}
        name={displayName}
        size={avatarSize}
        className="flex-shrink-0"
      />
      {showName && displayName && (
        <span className={`font-medium truncate ${nameSize}`}>
          {displayName}
        </span>
      )}
    </div>
  );

  // If linking is enabled and we have a userId, wrap in a Link
  if (linkToProfile && userId) {
    return (
      <Link
        to={`/profile/${userId}`}
        className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-md"
      >
        {content}
      </Link>
    );
  }

  // Otherwise just return the content
  return content;
};

export default UserBadge;
