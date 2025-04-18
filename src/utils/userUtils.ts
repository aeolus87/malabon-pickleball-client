/**
 * Extracts initials from a user's name
 * Takes both first and last name initials if available
 */
export const getInitials = (displayName: string | null | undefined): string => {
  if (!displayName) return "U";

  // Split the name by spaces
  const nameParts = displayName.trim().split(/\s+/);

  if (nameParts.length === 0) return "U";

  if (nameParts.length === 1) {
    // Just one word name, use first letter
    return nameParts[0].charAt(0).toUpperCase();
  }

  // Get first letter of first name and first letter of last name
  const firstInitial = nameParts[0].charAt(0);
  const lastInitial = nameParts[nameParts.length - 1].charAt(0);

  return (firstInitial + lastInitial).toUpperCase();
};

/**
 * Gets display name from user information
 */
export const getDisplayName = (
  displayName: string | null | undefined,
  email: string | null | undefined
): string => {
  if (displayName) return displayName;
  if (email) return email.split("@")[0];
  return "User";
};

/**
 * Generates an avatar URL for a user
 * Returns null if no valid photo URL exists (so Avatar components can use their fallback)
 */
export const getAvatarUrl = (
  photoURL: string | null | undefined
): string | null => {
  // If no photo URL, return null
  if (!photoURL) return null;

  // If it's a Google photo, return null
  if (photoURL.includes("googleusercontent.com")) {
    return null;
  }

  // Return the photo URL
  return photoURL;
};

/**
 * Generates initials from a name (using same logic as getInitials for consistency)
 * @param name The name to generate initials from
 * @returns The initials (1-2 characters)
 */
export const generateInitials = getInitials;
