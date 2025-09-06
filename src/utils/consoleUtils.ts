/**
 * Console utilities for Malabon PickleBallers app
 */

import axios from "axios";
import { SOCKET_URL } from "../config/env";

/**
 * Displays ASCII art in the console when the app starts
 */
export const printConsoleWelcome = (): void => {
  const styles = {
    title: "font-size: 20px; font-weight: bold; color: #10b981;",
    subtitle: "font-size: 14px; color: #6b7280;",
    info: "font-size: 12px; color: #9ca3af;",
  };

  console.log(
    `%c
 __  __       _       _                
|  \\/  | __ _| | __ _| |__   ___  _ __ 
| |\\/| |/ _\` | |/ _\` | '_ \\ / _ \\| '_ \\ 
| |  | | (_| | | (_| | |_) | (_) | | | |
|_|  |_|\\__,_|_|\\__,_|_.__/ \\___/|_| |_|
                                        
 ____  _      _    _     ____       _ _               
|  _ \\(_) ___| | _| |__ | __ )  __ _| | | ___ _ __ ___ 
| |_) | |/ __| |/ / '_ \\|  _ \\ / _\` | | |/ _ \\ '__/ __|
|  __/| | (__|   <| |_) | |_) | (_| | | |  __/ |  \\__ \\
|_|   |_|\\___|_|\\_\\_.__/|____/ \\__,_|_|_|\\___|_|  |___/
`,
    styles.title
  );

  console.log("%cWelcome to Malabon PickleBallers!", styles.subtitle);
  console.log("%cDeveloped with ♥ by the Malabon dev team", styles.info);

  // Add a helpful message about server coldstart
  console.log(
    "%cIf the app seems slow to load, the server might be in cold start mode. It will be faster next time!",
    "color: #f59e0b;"
  );
};

/**
 * Calls the server warmup endpoint to mitigate cold starts
 * This is called when the app initially loads to "wake up" the server
 */
export const warmupServer = async (): Promise<void> => {
  try {
    // Use the configured socket/server origin for warmup
    const serverBaseUrl = SOCKET_URL;

    if (process.env.NODE_ENV !== "production") {
      console.log(`🔌 Attempting to warm up server at ${serverBaseUrl}/warmup`);
    }

    // Try the most reliable method first - fetch with no-cors
    const startTime = performance.now();
    let success = false;

    try {
      // We're not using the response variable in no-cors mode
      await fetch(`${serverBaseUrl}/warmup`, {
        method: "GET",
        mode: "no-cors", // This mode can bypass CORS issues but won't return JSON
        cache: "no-cache",
      });

      // With no-cors, we won't be able to check response.ok or parse JSON
      // If we get here without throwing, consider it contacted
      const endTime = performance.now();
      if (process.env.NODE_ENV !== "production") {
        console.log(
          `✅ Server contacted with fetch(no-cors) in ${(
            endTime - startTime
          ).toFixed(0)}ms`
        );
      }
      success = true;
    } catch (error) {
      // Properly type the error
      const fetchError = error as Error;
      // If this fails, try another method
      console.log("Fetch no-cors method failed:", fetchError.message);
    }

    // Try with regular cors mode if the first attempt failed
    if (!success) {
      try {
        const response = await fetch(`${serverBaseUrl}/warmup`, {
          method: "GET",
          mode: "cors",
          cache: "no-cache",
          headers: {
            Accept: "application/json",
          },
        });

        if (response.ok) {
          const endTime = performance.now();
          try {
            const data = await response.json();
            if (process.env.NODE_ENV !== "production") {
              console.log(
                `✅ Server warmed up with fetch(cors) in ${(
                  endTime - startTime
                ).toFixed(0)}ms`,
                data
              );
            }
          } catch (e) {
            if (process.env.NODE_ENV !== "production") {
              console.log(
                `✅ Server contacted in ${(endTime - startTime).toFixed(
                  0
                )}ms (no valid JSON)`
              );
            }
          }
          success = true;
        }
      } catch (error) {
        // Properly type the error
        const fetchError = error as Error;
        console.log("Fetch cors method failed:", fetchError.message);
      }
    }

    // Last resort - use the image technique
    if (!success) {
      return new Promise((resolve) => {
        const img = new Image();
        const imgStartTime = performance.now();

        img.onload = () => {
          const endTime = performance.now();
          if (process.env.NODE_ENV !== "production") {
            console.log(
              `✅ Server warmed up with Image technique in ${(
                endTime - imgStartTime
              ).toFixed(0)}ms`
            );
          }
          success = true;
          resolve();
        };

        img.onerror = () => {
          // Even if the image 404s, the server still processed the request
          const endTime = performance.now();
          if (process.env.NODE_ENV !== "production") {
            console.log(
              `⚠️ Image technique resulted in error after ${(
                endTime - imgStartTime
              ).toFixed(0)}ms (but server may still be warmed up)`
            );
          }
          resolve();
        };

        // Add a random query param to prevent caching
        img.src = `${serverBaseUrl}/warmup?nocache=${Date.now()}`;
      });
    }
  } catch (error: any) {
    // Error handling code stays the same...
    if (process.env.NODE_ENV !== "production") {
      // Extract the base server URL for logging
      const serverBaseUrl = SOCKET_URL;

      console.warn(
        "⚠️ Server warmup failed:",
        error.message,
        error.response?.status,
        error.response?.data
      );

      // Provide helpful troubleshooting tips
      console.info(
        "🔍 Troubleshooting tips:\n" +
          `1. Check that your backend is running at ${serverBaseUrl}\n` +
          "2. Verify CORS is properly configured in backend/src/index.ts\n" +
          "3. The /warmup endpoint should be accessible without authentication\n" +
          `4. Your API URL is set to ${axios.defaults.baseURL} but warmup needs to bypass the /api prefix\n` +
          "5. Check backend logs for any CORS-related errors"
      );
    } else {
      console.warn("Server warmup failed - continuing with app initialization");
    }
  }
};

export default {
  printConsoleWelcome,
  warmupServer,
};
