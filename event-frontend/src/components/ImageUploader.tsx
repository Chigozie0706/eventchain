"use client";
import { useState } from "react";
import axios from "axios";

const ImageUploader = ({
  onImageUploaded,
}: {
  onImageUploaded: (url: string) => void;
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];

      // Validate file
      if (!selectedFile.type.startsWith("image/")) {
        setError("Only image files are allowed");
        return;
      }

      if (selectedFile.size > 10 * 1024 * 1024) {
        // 10MB limit
        setError("File size must be less than 10MB");
        return;
      }

      setFile(selectedFile);

      // Create preview
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const uploadToIPFS = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);

      // Add optional metadata
      formData.append(
        "pinataMetadata",
        JSON.stringify({
          name: `event-image-${Date.now()}`,
        })
      );

      const response = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`, // Alternative auth method
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        }
      );

      if (response.status !== 200) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const ipfsHash = response.data.IpfsHash;
      const imageUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

      onImageUploaded(imageUrl);
      console.log("Image uploaded successfully!");
    } catch (error: any) {
      console.error("Upload Error:", {
        error: error.response?.data || error.message,
        status: error.response?.status,
      });

      setError(
        error.response?.data?.error?.details ||
          error.response?.data?.error ||
          error.message ||
          "Failed to upload image"
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Event Image *
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
          disabled={uploading}
        />
      </div>

      {preview && (
        <div className="mt-2">
          <img
            src={preview}
            alt="Preview"
            className="max-w-full h-auto max-h-60 rounded-lg border border-gray-200"
          />
        </div>
      )}

      {error && (
        <div className="text-red-500 text-sm py-2">
          Error: {error}
          {error.includes("scopes") && (
            <div className="mt-1">
              <a
                href="https://app.pinata.cloud/developers"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                Update API key permissions
              </a>
            </div>
          )}
        </div>
      )}

      <button
        onClick={uploadToIPFS}
        disabled={!file || uploading || !!error}
        className={`w-full py-2 px-4 rounded-md font-medium
          ${
            !file || error
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : uploading
              ? "bg-blue-400 text-white"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }
        `}
      >
        {uploading ? "Uploading..." : "Upload Image"}
      </button>
    </div>
  );
};

export default ImageUploader;
