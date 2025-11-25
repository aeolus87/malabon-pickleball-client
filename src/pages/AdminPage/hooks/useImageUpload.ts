import { useState, useRef, ChangeEvent } from "react";
import axios from "axios";

interface UseImageUploadReturn {
  file: File | null;
  preview: string | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  uploadToCloudinary: (folder: string) => Promise<string>;
  reset: () => void;
  triggerFileSelect: () => void;
}

/**
 * Custom hook for handling image uploads to Cloudinary.
 * Extracts duplicated upload logic from AdminPage.
 */
export function useImageUpload(): UseImageUploadReturn {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      setFile(selectedFile);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const uploadToCloudinary = async (folder: string): Promise<string> => {
    if (!file) {
      throw new Error("No file selected");
    }

    // Get signed upload credentials from backend
    const signRes = await axios.post("/uploads/sign", { folder });
    const { timestamp, signature, api_key, cloud_name, folder: signedFolder } = signRes.data;

    // Build form data for Cloudinary
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", api_key);
    formData.append("timestamp", String(timestamp));
    formData.append("signature", signature);
    if (signedFolder) formData.append("folder", signedFolder);

    // Upload to Cloudinary
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`;
    const response = await fetch(uploadUrl, { method: "POST", body: formData });

    if (!response.ok) {
      throw new Error("Failed to upload image to Cloudinary");
    }

    const data = await response.json();
    return data.secure_url as string;
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const triggerFileSelect = () => {
    inputRef.current?.click();
  };

  return {
    file,
    preview,
    inputRef,
    handleFileChange,
    uploadToCloudinary,
    reset,
    triggerFileSelect,
  };
}

