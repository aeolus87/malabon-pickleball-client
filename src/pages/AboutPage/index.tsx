import React from "react";
import { Link } from "react-router-dom";

const AboutPage: React.FC = () => {
  return (
    <main className="min-h-screen bg-white dark:bg-dark-bg transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-brand-600 text-white">
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url('/api/placeholder/1920/1080')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              mixBlendMode: "overlay",
            }}
          />
        </div>
        <div className="container mx-auto px-4 py-24 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Our Story
            </h1>
            <p className="text-xl md:text-2xl font-light max-w-xl mx-auto">
              We're on a mission to make pickleball accessible to everyone in
              Malabon.
            </p>
          </div>
        </div>
        <svg
          className="fill-white dark:fill-dark-bg w-full h-16 -mb-1"
          viewBox="0 0 1440 48"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M0 48h1440V0C1159.93 37.4164 720.535 37.4164 0 0v48z" />
        </svg>
      </section>

      {/* Company History */}
      <section className="py-20 container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-12">
            <div className="h-0.5 w-12 bg-gradient-to-r from-blue-500 to-brand-500 mr-4"></div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100">
              Our Journey
            </h2>
            <div className="h-0.5 w-12 bg-gradient-to-r from-brand-500 to-blue-500 ml-4"></div>
          </div>
          <div className="prose prose-lg max-w-none text-gray-600 dark:text-gray-300 leading-relaxed">
            <p className="text-xl mb-6">
              Founded in 2023,{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-brand-600 font-medium">
                Malabon PickleBallers
              </span>{" "}
              began with a simple idea: to create a community around the
              fastest-growing sport in the Philippines. What started as a small
              group of three passionate players has grown into a thriving
              organization dedicated to our shared love of pickleball.
            </p>
            <div className="grid md:grid-cols-3 gap-8 my-12">
              <div className="bg-gray-50 dark:bg-dark-card p-6 rounded-lg shadow-sm text-center border-t-4 border-blue-500 dark:border-blue-600">
                <span className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-brand-600">
                  2023
                </span>
                <p className="mt-4 dark:text-gray-300">
                  Founded with just three courts and a passion for the game
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-dark-card p-6 rounded-lg shadow-sm text-center border-t-4 border-teal-500 dark:border-teal-600">
                <span className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-brand-600">
                  2024
                </span>
                <p className="mt-4 dark:text-gray-300">
                  Expanded to our first major location with 8 professional
                  courts
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-dark-card p-6 rounded-lg shadow-sm text-center border-t-4 border-brand-500 dark:border-brand-600">
                <span className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-brand-600">
                  Today
                </span>
                <p className="mt-4 dark:text-gray-300">
                  Premier pickleball destination in Malabon with growing
                  membership
                </p>
              </div>
            </div>
            <p className="dark:text-gray-300">
              Our early years were defined by persistence and community building
              as we developed our first courts. By 2024, we had secured our
              first major location and began to expand our facilities. Through
              the challenges of growth, we adapted and discovered new ways to
              bring pickleball to more people in Malabon.
            </p>
            <p className="dark:text-gray-300">
              Today, we continue to evolve and push boundaries, always staying
              true to our founding principles of accessibility, community, and
              the joy of the game.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-dark-card dark:to-dark-bg">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-12">
              <div className="h-0.5 w-12 bg-gradient-to-r from-blue-500 to-brand-500 mr-4"></div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100">
                Our Mission & Values
              </h2>
              <div className="h-0.5 w-12 bg-gradient-to-r from-brand-500 to-blue-500 ml-4"></div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-dark-card p-8 rounded-xl shadow-md transform transition-transform hover:-translate-y-1 hover:shadow-lg dark:border dark:border-dark-border">
                <h3 className="text-2xl font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-brand-600">
                  Our Mission
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  To create accessible, high-quality pickleball facilities that
                  bring people together and promote an active, healthy lifestyle
                  in our community.
                </p>
              </div>

              <div className="bg-white dark:bg-dark-card p-8 rounded-xl shadow-md transform transition-transform hover:-translate-y-1 hover:shadow-lg dark:border dark:border-dark-border">
                <h3 className="text-2xl font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-brand-600">
                  Our Vision
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  To be the premier pickleball destination in Metro Manila,
                  known for exceptional facilities, inclusive community, and a
                  welcoming atmosphere for players of all skill levels.
                </p>
              </div>
            </div>

            <div className="mt-16">
              <h3 className="text-2xl font-semibold mb-10 text-center text-gray-800 dark:text-gray-100">
                Our Core Values
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    title: "Community",
                    description:
                      "We build connections through the shared joy of pickleball.",
                    color: "border-blue-400 dark:border-blue-500",
                  },
                  {
                    title: "Accessibility",
                    description:
                      "We make pickleball available to everyone regardless of age or skill level.",
                    color: "border-blue-500 dark:border-blue-600",
                  },
                  {
                    title: "Fun",
                    description:
                      "We believe sport should be enjoyable and create positive experiences.",
                    color: "border-teal-400 dark:border-teal-500",
                  },
                  {
                    title: "Quality",
                    description:
                      "We maintain excellent facilities and services for the best playing experience.",
                    color: "border-teal-500 dark:border-teal-600",
                  },
                  {
                    title: "Health",
                    description:
                      "We promote active lifestyles and wellness through sport.",
                    color: "border-brand-400 dark:border-brand-500",
                  },
                  {
                    title: "Growth",
                    description:
                      "We continuously improve and expand to serve more players.",
                    color: "border-brand-500 dark:border-brand-600",
                  },
                ].map((value, index) => (
                  <div
                    key={index}
                    className={`bg-white dark:bg-dark-card p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 border-l-4 ${value.color} dark:border-dark-border dark:border-l-4`}
                  >
                    <h4 className="font-semibold text-lg mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-brand-600">
                      {value.title}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      {value.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-800 to-brand-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
              Ready to Join the Community?
            </h2>
            <p className="text-xl text-white opacity-90 mb-10 max-w-2xl mx-auto">
              Book a court now or contact us to learn more about memberships and
              upcoming events.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/login"
                className="bg-gradient-to-r from-blue-600 to-brand-600 hover:from-blue-700 hover:to-brand-700 text-white py-4 px-8 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Train With Us
              </Link>
              <Link
                to="/contact"
                className="bg-transparent border-2 border-white hover:bg-white hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-600 hover:to-brand-600 text-white py-4 px-8 rounded-lg font-medium transition-all duration-300"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AboutPage;
