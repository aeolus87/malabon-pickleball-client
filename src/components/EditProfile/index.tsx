import React, { useState, useRef, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { reaction, runInAction } from "mobx";
import { authStore } from "../../stores/AuthStore";
import Avatar from "../Avatar";
import { userStore } from "../../stores/UserStore";
import ImageCropper from "../ImageCropper";
import axios from "axios";

interface EditProfileProps {
  open: boolean;
  onClose: () => void;
  onUpdate?: (data: {
    displayName: string;
    bio: string;
    photoURL: string | null;
    coverPhotoURL: string | null;
    previewPhotoURL?: string | null;
    previewCoverURL?: string | null;
  }) => void;
}

const EditProfile: React.FC<EditProfileProps> = observer(
  ({ open, onClose, onUpdate }) => {
    // Initialize with empty values and sync later with reaction
    const [displayName, setDisplayName] = useState("");
    const [bio, setBio] = useState("");
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [coverPhoto, setCoverPhoto] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showProfileCropper, setShowProfileCropper] = useState(false);
    const [showCoverCropper, setShowCoverCropper] = useState(false);
    const [tempProfilePicture, setTempProfilePicture] = useState<string | null>(
      null
    );
    const [tempCoverPhoto, setTempCoverPhoto] = useState<string | null>(null);

    const profileInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    const user = authStore.user;
    const photoURL = user?.photoURL;
    const userCoverPhoto = user?.coverPhoto;
    const userDisplayName = user?.displayName || "User";

    useEffect(() => {
      const disposer = reaction(
        () => ({
          displayName: authStore.user?.displayName || "",
          bio: authStore.user?.bio || "",
        }),
        (data) => {
          setDisplayName(data.displayName);
          setBio(data.bio);
        },
        { fireImmediately: true }
      );

      return () => disposer();
    }, []);

    useEffect(() => {
      if (onUpdate) {
        const previewPhotoURL = profilePicture
          ? URL.createObjectURL(profilePicture)
          : null;

        const previewCoverURL = coverPhoto
          ? URL.createObjectURL(coverPhoto)
          : null;

        onUpdate({
          displayName,
          bio,
          photoURL: photoURL || null,
          coverPhotoURL: userCoverPhoto || null,
          previewPhotoURL,
          previewCoverURL,
        });

        return () => {
          if (previewPhotoURL) URL.revokeObjectURL(previewPhotoURL);
          if (previewCoverURL) URL.revokeObjectURL(previewCoverURL);
        };
      }
    }, [
      displayName,
      bio,
      profilePicture,
      coverPhoto,
      photoURL,
      userCoverPhoto,
      onUpdate,
    ]);

    const handleProfilePictureClick = () => {
      profileInputRef.current?.click();
    };

    const handleCoverPhotoClick = () => {
      coverInputRef.current?.click();
    };

    const handleProfilePictureChange = (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const imageUrl = URL.createObjectURL(file);
        setTempProfilePicture(imageUrl);
        setShowProfileCropper(true);
      }
    };

    const handleCoverPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const imageUrl = URL.createObjectURL(file);
        setTempCoverPhoto(imageUrl);
        setShowCoverCropper(true);
      }
    };

    const handleSaveProfileCrop = (canvas: HTMLCanvasElement) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "profile-picture.png", {
            type: "image/png",
          });
          setProfilePicture(file);
          setShowProfileCropper(false);

          if (tempProfilePicture) {
            URL.revokeObjectURL(tempProfilePicture);
            setTempProfilePicture(null);
          }
        }
      }, "image/png");
    };

    const handleSaveCoverCrop = (canvas: HTMLCanvasElement) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "cover-photo.png", {
            type: "image/png",
          });
          setCoverPhoto(file);
          setShowCoverCropper(false);

          if (tempCoverPhoto) {
            URL.revokeObjectURL(tempCoverPhoto);
            setTempCoverPhoto(null);
          }
        }
      }, "image/png");
    };

    const handleCancelProfileCrop = () => {
      setShowProfileCropper(false);
      if (tempProfilePicture) {
        URL.revokeObjectURL(tempProfilePicture);
        setTempProfilePicture(null);
      }
    };

    const handleCancelCoverCrop = () => {
      setShowCoverCropper(false);
      if (tempCoverPhoto) {
        URL.revokeObjectURL(tempCoverPhoto);
        setTempCoverPhoto(null);
      }
    };

    const uploadImage = async (file: File): Promise<string> => {
      // Ask backend to sign the upload
      const signRes = await axios.post("/uploads/sign", {
        folder: "profile_pictures",
      });

      const { timestamp, signature, api_key, cloud_name, folder } = signRes.data;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", api_key);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      if (folder) formData.append("folder", folder);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`;
      const response = await fetch(uploadUrl, { method: "POST", body: formData });

      if (!response.ok) {
        throw new Error("Failed to upload image to Cloudinary");
      }

      const data = await response.json();
      return data.secure_url as string;
    };

    const handleSave = async () => {
      setLoading(true);
      setError(null);

      try {
        const updates: any = {
          displayName,
          bio,
        };

        if (userStore.profile) {
          runInAction(() => {
            if (userStore.profile) {
              userStore.profile = {
                ...userStore.profile,
                displayName,
                bio,
              };
            }
          });
        }

        if (profilePicture) {
          const photoURL = await uploadImage(profilePicture);
          updates.photoURL = photoURL;
        }

        if (coverPhoto) {
          const coverPhotoURL = await uploadImage(coverPhoto);
          updates.coverPhoto = coverPhotoURL;
        }

        const success = await authStore.updateUserProfile(updates);

        if (success) {
          await userStore.loadProfile();

          onClose();
        } else {
          setError("Failed to update profile");

          await userStore.loadProfile();
        }
      } catch (error) {
        console.error("Failed to update profile:", error);
        setError("An error occurred while updating your profile");

        await userStore.loadProfile();
      } finally {
        setLoading(false);
      }
    };

    if (!open) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 dark:bg-black dark:bg-opacity-70 transition-colors duration-200">
        <div className="bg-white dark:bg-dark-bg text-gray-900 dark:text-gray-100 rounded-xl w-full max-w-md overflow-hidden shadow-lg dark:shadow-xl transition-colors duration-200">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
            <h2 className="text-xl font-bold">Edit profile</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-[calc(100vh-150px)] overflow-y-auto">
            <div className="flex flex-col gap-6">
              {/* Profile Picture Section */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Profile picture</h3>
                  <button
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium transition-colors duration-200"
                    onClick={handleProfilePictureClick}
                  >
                    Edit
                  </button>
                  <input
                    ref={profileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfilePictureChange}
                  />
                </div>

                <div className="flex justify-center">
                  <div
                    className="relative cursor-pointer w-32 h-32 rounded-full overflow-hidden"
                    onClick={handleProfilePictureClick}
                  >
                    {profilePicture ? (
                      <img
                        src={URL.createObjectURL(profilePicture)}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Avatar
                        src={photoURL}
                        name={userDisplayName}
                        size="xl"
                        className="w-full h-full text-4xl"
                      />
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-50 dark:bg-opacity-60 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-white text-sm">Change photo</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Cover photo</h3>
                  <button
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium transition-colors duration-200"
                    onClick={handleCoverPhotoClick}
                  >
                    Edit
                  </button>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverPhotoChange}
                  />
                </div>

                <div
                  className="relative cursor-pointer w-full h-48 rounded-lg overflow-hidden"
                  onClick={handleCoverPhotoClick}
                >
                  {coverPhoto || userCoverPhoto ? (
                    <img
                      src={
                        coverPhoto
                          ? URL.createObjectURL(coverPhoto)
                          : userCoverPhoto || ""
                      }
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center transition-colors duration-200">
                      <span className="text-gray-600 dark:text-gray-400">
                        No cover photo
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-50 dark:bg-opacity-60 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white">Change cover photo</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Display Name</h3>
                </div>

                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                  className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-500 dark:focus:border-indigo-500 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                />
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Bio</h3>
                </div>

                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Write a short bio about yourself..."
                  className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-500 dark:focus:border-indigo-500 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none transition-colors duration-200"
                  rows={4}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg text-red-600 dark:text-red-200 mb-4 transition-colors duration-200">
                  {error}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-4 p-4 border-t border-gray-200 dark:border-gray-700 transition-colors duration-200">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-900 text-gray-800 dark:text-gray-200 font-medium transition-colors duration-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-800 text-white font-medium transition-colors duration-200 flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </div>

        {showProfileCropper && tempProfilePicture && (
          <ImageCropper
            imageSrc={tempProfilePicture}
            aspectRatio={1}
            width={300}
            height={300}
            borderRadius={150}
            onSave={handleSaveProfileCrop}
            onCancel={handleCancelProfileCrop}
            minZoom={1}
            maxZoom={3}
          />
        )}

        {/* Cover Photo Cropper Modal */}
        {showCoverCropper && tempCoverPhoto && (
          <ImageCropper
            imageSrc={tempCoverPhoto}
            aspectRatio={3 / 1}
            width={600}
            height={200}
            borderRadius={0}
            onSave={handleSaveCoverCrop}
            onCancel={handleCancelCoverCrop}
            minZoom={1}
            maxZoom={3}
          />
        )}
      </div>
    );
  }
);

export default EditProfile;
