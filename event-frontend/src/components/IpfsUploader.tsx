import { useState, ChangeEvent } from "react";
import axios from "axios";

interface IpfsUploaderProps {
  onUploadSuccess: (ipfsHash: string, pinataUrl: string) => void;
  disabled?: boolean;
}

export default function IpfsUploader({
  onUploadSuccess,
  disabled,
}: IpfsUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post<{
        ipfsHash: string;
        pinataUrl: string;
      }>("/api/pinata/upload", formData);

      onUploadSuccess(response.data.ipfsHash, response.data.pinataUrl);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-md file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100 disabled:opacity-50"
      />

      {previewUrl && (
        <div className="mt-2">
          <img
            src={previewUrl}
            alt="Preview"
            className="max-h-48 rounded-md object-contain"
          />
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || isUploading || disabled}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
          disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isUploading ? (
          <span className="flex items-center">
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
            Uploading...
          </span>
        ) : (
          "Upload to IPFS"
        )}
      </button>
    </div>
  );
}
