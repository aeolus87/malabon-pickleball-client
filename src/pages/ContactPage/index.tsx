import React, { useState } from "react";

// Validation
const validateEmail = (email: string) => {
  const emailRegex = /^[a-zA-Z0-9.@]+$/;
  if (!emailRegex.test(email)) {
    return "Email should only contain letters, numbers, periods, and @";
  }

  if (!email.includes("@")) {
    return "Email must contain @";
  }

  return "";
};

// Validate name (only letters, spaces, and common punctuation)
const validateName = (name: string): boolean => {
  const re = /^[A-Za-z\s\.\-']+$/;
  return re.test(name);
};

// Types for form errors
interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  form?: string;
}

// Web3Forms access key
const WEB3FORMS_ACCESS_KEY = "5635287e-9e77-4cb9-82e4-39753e357bff";

// Component
const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Character limits
  const characterLimits = {
    name: 100,
    message: 1000,
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
      isValid = false;
    } else if (formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
      isValid = false;
    } else if (formData.name.length > characterLimits.name) {
      newErrors.name = `Name must be less than ${characterLimits.name} characters`;
      isValid = false;
    } else if (!validateName(formData.name)) {
      newErrors.name =
        "Name should only contain letters, spaces, and common punctuation";
      isValid = false;
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (validateEmail(formData.email)) {
      newErrors.email = validateEmail(formData.email);
      isValid = false;
    }

    // Subject validation
    if (!formData.subject) {
      newErrors.subject = "Please select a subject";
      isValid = false;
    }

    // Message validation
    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
      isValid = false;
    } else if (formData.message.length < 10) {
      newErrors.message = "Message must be at least 10 characters";
      isValid = false;
    } else if (formData.message.length > characterLimits.message) {
      newErrors.message = `Message must be less than ${characterLimits.message} characters`;
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Updated handleEmailChange to restrict input
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow letters, numbers, periods, and @
    if (/^[a-zA-Z0-9.@]*$/.test(value) || value === "") {
      setFormData((prev) => ({ ...prev, email: value }));
      if (value) {
        setErrors((prev) => ({ ...prev, email: validateEmail(value) }));
      } else {
        setErrors((prev) => ({ ...prev, email: "" }));
      }
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    // Special handling for the name field
    if (name === "name" && value !== "") {
      // Only allow valid name characters
      if (!validateName(value)) {
        return; // Don't update if invalid
      }
    }

    // Remove error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors({
        ...errors,
        [name]: undefined,
      });
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors and messages
    setSubmitError(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare form data with better email formatting
      const formPayload = {
        access_key: WEB3FORMS_ACCESS_KEY,
        from_name: "Malabon Pickleballers Contact Form",
        name: formData.name,
        email: formData.email,
        subject: `${formData.subject} Inquiry from ${formData.name}`,
        botcheck: "",
        replyto: formData.email,
        site_name: "Malabon Pickleballers",
        message: `Dear Admin,

A new inquiry has been submitted through the Malabon Pickleballers website contact form.

Contact Details:
---------------
Name: ${formData.name}
Email: ${formData.email}
Subject: ${formData.subject}

Message Content:
--------------
${formData.message}

-------------------
This is an automated message from the Malabon Pickleballers website contact form.
Please reply directly to ${formData.email} to respond to this inquiry.`,
      };

      // Submit to Web3Forms with standard headers
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(formPayload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Handle success
        setIsSubmitting(false);
        setSubmitSuccess(true);
        setFormData({ name: "", email: "", subject: "", message: "" });

        // Reset success message after 10 seconds
        setTimeout(() => {
          setSubmitSuccess(false);
        }, 10000);
      } else {
        throw new Error(data.message || "Failed to send message");
      }
    } catch (error: any) {
      console.error("Contact form submission error:", error);
      setIsSubmitting(false);
      setSubmitError(
        error.message === "Failed to fetch" 
          ? "Network error. Please check your internet connection and try again."
          : error.message || "Failed to send your message. Please try again later."
      );
    }
  };

  return (
    <main className="flex-grow bg-gray-50 dark:bg-dark-bg py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-lg overflow-hidden dark:border dark:border-dark-border">
          {/* Header */}
          <div className="bg-brand-700 dark:bg-brand-800 py-8 px-8">
            <h1 className="text-3xl font-bold text-white text-center">
              Contact Us
            </h1>
            <p className="text-center text-brand-100 mt-2">
              We'd love to hear from you! Fill out the form below to get in
              touch.
            </p>
          </div>

          <div className="p-8">
            {/* Contact Information */}
            <div className="mb-8 border-b border-gray-200 dark:border-dark-border pb-8">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Our Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col space-y-2">
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Email:</span>
                  </p>
                  <p className="text-gray-800 dark:text-gray-300 font-medium">
                    info@malabonpickleballers.com
                  </p>
                </div>
                <div className="flex flex-col space-y-2">
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Phone:</span>
                  </p>
                  <p className="text-gray-800 dark:text-gray-300 font-medium">
                    +63 9951325494
                  </p>
                </div>
                <div className="flex flex-col space-y-2">
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Office Hours:</span>
                  </p>
                  <p className="text-gray-800 dark:text-gray-300">
                    Monday - Friday: 9:00 AM - 5:00 PM
                  </p>
                </div>
                <div className="flex flex-col space-y-2">
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Address:</span>
                  </p>
                  <p className="text-gray-800 dark:text-gray-300">
                    Malabon City, Metro Manila, Philippines
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Send Us a Message
              </h2>

              {/* Success Message */}
              {submitSuccess && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md border border-green-200 dark:border-green-800 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-green-400 dark:text-green-300"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        Thank you! Your message has been sent successfully.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {submitError && (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400 dark:text-red-300"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">
                        {submitError}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Your Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      maxLength={characterLimits.name}
                      className={`block w-full rounded-md p-4 text-lg bg-gray-50 border border-gray-300 shadow-sm focus:ring-brand-500 focus:border-brand-500 dark:bg-dark-muted dark:border-dark-border dark:text-gray-100 ${
                        errors.name
                          ? "border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500"
                          : ""
                      }`}
                      required
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Your Email *
                    </label>
                    <input
                      type="text"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleEmailChange}
                      className={`block w-full rounded-md p-4 text-lg bg-gray-50 border border-gray-300 shadow-sm focus:ring-brand-500 focus:border-brand-500 dark:bg-dark-muted dark:border-dark-border dark:text-gray-100 ${
                        errors.email
                          ? "border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500"
                          : ""
                      }`}
                      required
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className={`block w-full rounded-md p-4 text-lg bg-gray-50 border border-gray-300 shadow-sm focus:ring-brand-500 focus:border-brand-500 dark:bg-dark-muted dark:border-dark-border dark:text-gray-100 ${
                      errors.subject
                        ? "border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500"
                        : ""
                    }`}
                    required
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="membership">Membership</option>
                    <option value="events">Events</option>
                    <option value="training">Training</option>
                    <option value="feedback">Feedback</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.subject && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.subject}
                    </p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={7}
                    maxLength={characterLimits.message}
                    className={`block w-full rounded-md p-4 text-lg bg-gray-50 border border-gray-300 shadow-sm focus:ring-brand-500 focus:border-brand-500 dark:bg-dark-muted dark:border-dark-border dark:text-gray-100 ${
                      errors.message
                        ? "border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500"
                        : ""
                    }`}
                    required
                  ></textarea>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                    <span>
                      {formData.message.length}/{characterLimits.message}
                    </span>
                    <span>* Required fields</span>
                  </div>
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-center mt-8">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:bg-brand-700 dark:hover:bg-brand-600 ${
                      isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      "Send Message"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ContactPage;
