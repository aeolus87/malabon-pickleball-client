/**
 * Generates a consistent color based on a string (typically a user's name)
 * This ensures the same string always gets the same color
 *
 * @param name - The string to generate a color from
 * @returns A hex color code
 */
export const getColorFromName = (name: string): string => {
  // Default color for empty strings
  if (!name) return "#0ea5e9"; // Default to a nice blue

  // Simple hash function to generate a number from a string
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  // List of pleasing colors for avatars - all with good contrast for white text
  const colors = [
    "#0ea5e9", // blue
    "#16a34a", // green
    "#9333ea", // purple
    "#e11d48", // rose
    "#0891b2", // cyan
    "#7c3aed", // violet
    "#c026d3", // fuchsia
    "#ea580c", // orange
    "#0d9488", // teal
    "#4338ca", // indigo
    "#b91c1c", // red
    "#4d7c0f", // lime
  ];

  // Use the hash to pick a color from our palette
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};
