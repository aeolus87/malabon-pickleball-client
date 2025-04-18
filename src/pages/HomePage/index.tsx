import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { observer } from "mobx-react-lite";
import { authStore } from "../../stores/AuthStore";

const HomePage: React.FC = observer(() => {
  const images = [
    {
      id: 0,
      url: "https://d1v7t0q4j1bj2e.cloudfront.net/0.jpg",
      alt: "Pickleball training session",
    },
    {
      id: 1,
      url: "https://d1v7t0q4j1bj2e.cloudfront.net/1.jpg",
      alt: "Training facilities",
    },
    {
      id: 2,
      url: "https://d1v7t0q4j1bj2e.cloudfront.net/2.jpg",
      alt: "Coach and players",
    },
    {
      id: 3,
      url: "https://d1v7t0q4j1bj2e.cloudfront.net/3.jpg",
      alt: "Group training session",
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  const totalSlides = images.length;

  useEffect(() => {
    let slideInterval: number;

    if (autoPlay) {
      slideInterval = window.setInterval(() => {
        setCurrentSlide((prevSlide) => (prevSlide + 1) % totalSlides);
      }, 5000);
    }

    return () => {
      if (slideInterval) {
        clearInterval(slideInterval);
      }
    };
  }, [autoPlay, totalSlides]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setAutoPlay(false);
  };

  const goToNextSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide + 1) % totalSlides);
    setAutoPlay(false);
  };

  const goToPrevSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide - 1 + totalSlides) % totalSlides);
    setAutoPlay(false);
  };

  return (
    <main className="flex-grow flex items-center justify-center bg-gray-100 dark:bg-dark-bg transition-colors duration-300">
      <div className="max-w-6xl mx-auto p-8 flex flex-col md:flex-row items-center gap-12">
        {/* Left side content */}
        <div className="text-center md:text-left md:w-1/2">
          <div className="inline-flex items-center gap-3 mb-8 bg-white dark:bg-dark-card px-4 py-2 rounded-full shadow-sm">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Train With Us
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-100 mb-6 leading-tight">
            Malabon{" "}
            <span className="text-gray-700 dark:text-gray-300">
              PickleBallers
            </span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-8 leading-relaxed">
            Welcome to Malabon PickleBallers! Join our training sessions at your
            convenience. Check available schedules and venues to find the
            perfect time to improve your skills and enjoy the game with our
            community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            {authStore.isAuthenticated ? (
              <>
                <Link
                  to="/venues"
                  className="inline-flex items-center justify-center bg-brand-600 text-white px-6 py-3 rounded-md hover:bg-brand-700 transition shadow-sm dark:bg-brand-700 dark:hover:bg-brand-600"
                >
                  View Venues
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                <Link
                  to="/profile"
                  className="inline-flex items-center justify-center bg-white dark:bg-dark-card border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 px-6 py-3 rounded-md hover:bg-gray-50 dark:hover:bg-dark-muted transition shadow-sm"
                >
                  My Profile
                </Link>
              </>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center justify-center bg-brand-600 text-white px-6 py-3 rounded-md hover:bg-brand-700 dark:bg-brand-700 dark:hover:bg-brand-600 transition shadow-sm"
              >
                Join Us
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            )}
          </div>
        </div>

        {/* Right side slideshow */}
        <div className="md:w-1/2">
          <div className="relative rounded-lg overflow-hidden shadow-md">
            {/* Main slideshow image */}
            <div className="relative h-64 md:h-80">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className={`absolute w-full h-full transition-opacity duration-500 ease-in-out ${
                    index === currentSlide ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>

            {/* Navigation arrows */}
            <button
              onClick={goToPrevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white dark:bg-dark-card bg-opacity-50 dark:bg-opacity-70 hover:bg-opacity-75 dark:hover:bg-opacity-90 rounded-full p-2 transition-colors duration-300"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-6 h-6 text-gray-800 dark:text-gray-200" />
            </button>

            <button
              onClick={goToNextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white dark:bg-dark-card bg-opacity-50 dark:bg-opacity-70 hover:bg-opacity-75 dark:hover:bg-opacity-90 rounded-full p-2 transition-colors duration-300"
              aria-label="Next slide"
            >
              <ChevronRight className="w-6 h-6 text-gray-800 dark:text-gray-200" />
            </button>

            {/* Navigation dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                    currentSlide === index
                      ? "bg-white"
                      : "bg-white bg-opacity-50"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Thumbnail images */}
          <div className="mt-4 grid grid-cols-4 gap-2">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => goToSlide(index)}
                className={`rounded-lg overflow-hidden shadow-sm p-1 transition-colors duration-300 ${
                  currentSlide === index
                    ? "bg-brand-600 dark:bg-brand-700"
                    : "bg-white dark:bg-dark-card"
                }`}
              >
                <img
                  src={image.url}
                  alt={image.alt}
                  className="w-full h-16 object-cover rounded-md"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
});

export default HomePage;
