import { useState, useRef } from "react";
import { clsx } from "clsx";
import { Camera, Upload, X } from "lucide-react";

interface EmployeePhotoUploadProps {
  currentPhoto?: string;
  onPhotoChange: (file: File | null) => void;
  className?: string;
}

export function EmployeePhotoUpload({
  currentPhoto,
  onPhotoChange,
  className,
}: EmployeePhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentPhoto || null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
    onPhotoChange(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const remove = () => {
    setPreview(null);
    onPhotoChange(null);
  };

  return (
    <div className={clsx("flex flex-col items-center gap-3", className)}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={clsx(
          "relative w-24 h-24 rounded-full overflow-hidden border-2 border-dashed cursor-pointer transition-colors",
          dragging
            ? "border-primary-400 bg-primary-50"
            : preview
              ? "border-transparent"
              : "border-gray-300 hover:border-gray-400 bg-gray-50",
        )}
      >
        {preview ? (
          <img
            src={preview}
            alt="Employee photo"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full text-gray-400">
            <Camera className="w-6 h-6" />
            <span className="text-[10px] mt-0.5">Photo</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFile(e.target.files?.[0] || null)}
        className="hidden"
        aria-label="Upload employee photo"
      />
      {preview && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800"
          >
            <Upload className="w-3 h-3" />
            Change
          </button>
          <button
            type="button"
            onClick={remove}
            className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800"
          >
            <X className="w-3 h-3" />
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
