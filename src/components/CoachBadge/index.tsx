import React from "react";
import { UserRole } from "../../stores/UserStore";

interface CoachBadgeProps {
  role: UserRole;
  isAvailable?: boolean;
  size?: "xs" | "sm" | "md";
  showAvailability?: boolean;
  className?: string;
}

/**
 * CoachBadge - Visual indicator for coach role with optional availability status
 */
const CoachBadge: React.FC<CoachBadgeProps> = ({
  role,
  isAvailable = true,
  size = "sm",
  showAvailability = false,
  className = "",
}) => {
  if (role !== "coach") return null;

  const sizeClasses = {
    xs: "text-[10px] px-1.5 py-0.5",
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
  };

  const iconSize = {
    xs: "w-2.5 h-2.5",
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-medium
        bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {/* Whistle icon */}
      <svg
        className={iconSize[size]}
        fill="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm2 15h-4v-1h4v1zm1.13-4.47l-.63.44V14h-5v-1.03l-.63-.44C8.21 11.68 7 10.39 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.39-1.21 2.68-2.87 3.53z"/>
        <circle cx="12" cy="9" r="2.5"/>
      </svg>
      Coach
      {showAvailability && (
        <span
          className={`
            w-1.5 h-1.5 rounded-full ml-0.5
            ${isAvailable ? "bg-green-500" : "bg-gray-400"}
          `}
          title={isAvailable ? "Available" : "Unavailable"}
        />
      )}
    </span>
  );
};

export default CoachBadge;







