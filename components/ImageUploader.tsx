import React, { useRef } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { ImageState } from '../types';

interface ImageUploaderProps {
  imageState: ImageState;
  onImageChange: (newState: ImageState) => void;
  disabled?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ imageState, onImageChange, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      onImageChange({
        file,
        previewUrl: URL.createObjectURL(file),
        base64: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageChange({ file: null, previewUrl: null, base64: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTriggerUpload = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  if (imageState.previewUrl) {
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-md border border-stone-200 group">
        <img 
          src={imageState.previewUrl} 
          alt="Room Preview" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
                onClick={handleClear}
                className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white p-3 rounded-full transition-colors"
                disabled={disabled}
            >
                <X size={24} />
            </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={handleTriggerUpload}
      className={`
        w-full aspect-video border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all
        ${disabled ? 'opacity-50 cursor-not-allowed border-stone-200' : 'border-stone-300 hover:border-emerald-500 hover:bg-stone-100'}
      `}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
        disabled={disabled}
      />
      <div className="bg-stone-100 p-4 rounded-full mb-3 text-emerald-600">
        <Upload size={32} />
      </div>
      <p className="text-stone-600 font-medium">Click to upload a room photo</p>
      <p className="text-stone-400 text-sm mt-1">Supports JPG, PNG, WEBP</p>
    </div>
  );
};
