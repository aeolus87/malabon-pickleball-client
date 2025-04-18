import { useState, memo } from "react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  width?: number | string;
  height?: number | string;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  fallbackText?: string;
}

const OptimizedImage = memo(
  ({
    src,
    alt,
    className = "",
    placeholderClassName = "",
    width,
    height,
    objectFit = "cover",
    fallbackText,
  }: OptimizedImageProps) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    // Apply width and height if provided
    const sizeStyle = {
      width: width || "100%",
      height: height || "100%",
    };

    // Handle error or missing source
    if (!src || hasError) {
      return (
        <div
          className={`flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 ${className}`}
          style={sizeStyle}
        >
          {fallbackText || alt || "Image unavailable"}
        </div>
      );
    }

    return (
      <div className="relative overflow-hidden" style={sizeStyle}>
        {/* Loading skeleton */}
        {!isLoaded && (
          <div
            className={`absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse ${placeholderClassName}`}
            style={sizeStyle}
          ></div>
        )}

        {/* Actual image */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={`${className} ${
            isLoaded ? "opacity-100" : "opacity-0"
          } transition-opacity duration-300 w-full h-full`}
          style={{
            objectFit,
          }}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
      </div>
    );
  }
);

export default OptimizedImage;
