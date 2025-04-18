import React, { useState, useRef, useCallback } from "react";
import AvatarEditor from "react-avatar-editor";

interface ImageCropperProps {
  imageSrc: string;
  aspectRatio: number;
  onSave: (canvas: HTMLCanvasElement) => void;
  onCancel: () => void;
  width?: number;
  height?: number;
  borderRadius?: number;
  minZoom?: number;
  maxZoom?: number;
}

const ImageCropper: React.FC<ImageCropperProps> = ({
  imageSrc,
  onSave,
  onCancel,
  width = 300,
  height = 300,
  borderRadius = 0,
  minZoom = 1,
  maxZoom = 4,
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0.5, y: 0.5 });
  const editorRef = useRef<AvatarEditor>(null);

  const handleScale = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const scale = parseFloat(e.target.value);
    setScale(scale);
  }, []);

  const handlePositionChange = useCallback(
    (position: { x: number; y: number }) => {
      setPosition(position);
    },
    []
  );

  const handleSave = useCallback(() => {
    if (editorRef.current) {
      const canvas = editorRef.current.getImageScaledToCanvas();
      onSave(canvas);
    }
  }, [onSave]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
          Adjust your image
        </h3>

        <div className="flex justify-center mb-4">
          <AvatarEditor
            ref={editorRef}
            image={imageSrc}
            width={width}
            height={height}
            border={20}
            borderRadius={borderRadius}
            color={[0, 0, 0, 0.6]}
            scale={scale}
            rotate={0}
            position={position}
            onPositionChange={handlePositionChange}
            style={{ width: "100%", height: "auto" }}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Zoom
          </label>
          <input
            type="range"
            min={minZoom}
            max={maxZoom}
            step={0.01}
            value={scale}
            onChange={handleScale}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>Min</span>
            <span>Max</span>
          </div>
        </div>

        <div className="flex justify-between gap-3 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-500 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
