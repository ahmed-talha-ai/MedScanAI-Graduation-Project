'use client';

import { useRef, useState, useCallback } from 'react';

interface FileUploadZoneProps {
  accept?: string;
  maxSizeMB?: number;
  onFileSelected: (file: File) => void;
  label?: string;
  description?: string;
}

export function FileUploadZone({
  accept = 'image/jpeg,image/png,image/webp',
  maxSizeMB = 50,
  onFileSelected,
  label = 'Drag & drop your file here',
  description = 'Or browse to choose a file. Maximum file size: 50 MB.',
}: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const validateAndSelect = useCallback(
    (file: File) => {
      setError(null);
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File must be smaller than ${maxSizeMB} MB.`);
        return;
      }
      setSelectedFile(file);
      onFileSelected(file);
    },
    [maxSizeMB, onFileSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) validateAndSelect(file);
    },
    [validateAndSelect]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSelect(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`relative w-full min-h-[340px] bg-surface-container-lowest rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-8 text-center transition-all group cursor-pointer ${
        dragOver
          ? 'border-primary bg-primary/5 anim-upload-pulse'
          : 'border-outline-variant/40 hover:border-primary/40 hover:bg-surface-container-low'
      }`}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={handleChange}
      />

      {selectedFile ? (
        /* File selected state */
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 anim-success-ripple">
            <span className="material-symbols-outlined text-4xl text-primary">check_circle</span>
          </div>
          <p className="font-bold text-on-surface text-lg mb-1">{selectedFile.name}</p>
          <p className="text-sm text-on-surface-variant mb-4">
            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
          </p>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
            className="text-sm text-tertiary hover:underline"
          >
            Remove and choose another
          </button>
        </div>
      ) : (
        /* Upload prompt state */
        <>
          <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <span className="material-symbols-outlined text-4xl text-primary">cloud_upload</span>
          </div>
          <h3 className="text-xl font-bold text-on-surface mb-2">{label}</h3>
          <p className="text-on-surface-variant mb-8 max-w-md text-sm leading-relaxed" dir="ltr">{description}</p>
          <button
            type="button"
            className="signature-gradient text-white px-8 py-3.5 rounded-full font-bold hover:opacity-90 hover:-translate-y-0.5 transition-all flex items-center gap-2 text-sm"
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
          >
            <span className="material-symbols-outlined text-xl">folder_open</span>
            Browse Files
          </button>
        </>
      )}

      {error && (
        <p className="mt-4 text-sm text-error font-medium">{error}</p>
      )}
    </div>
  );
}
