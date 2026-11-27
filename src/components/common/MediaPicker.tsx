import { useId } from 'react';
import { Camera, ImagePlus, Upload } from 'lucide-react';

interface MediaPickerProps {
  accept: string;
  captureKind?: 'image' | 'video';
  multiple?: boolean;
  disabled?: boolean;
  fileLabel?: string;
  cameraLabel?: string;
  hint?: string;
  onSelect: (files: FileList | null) => void;
  variant?: 'default' | 'compact';
}

export function MediaPicker({
  accept,
  captureKind = 'image',
  multiple = false,
  disabled = false,
  fileLabel = 'Choose from files or gallery',
  cameraLabel = captureKind === 'video' ? 'Record video' : 'Take photo',
  hint,
  onSelect,
  variant = 'default',
}: MediaPickerProps) {
  const fileId = useId();
  const cameraId = useId();
  const captureAccept = captureKind === 'video' ? 'video/*' : 'image/*';

  return (
    <div className={`sn-media-picker ${variant === 'compact' ? 'sn-media-picker-compact' : ''}`}>
      <div className="sn-media-picker-actions">
        <label htmlFor={fileId} className="sn-button secondary sn-media-picker-btn">
          {variant === 'compact' ? <ImagePlus size={15} /> : <Upload size={17} />}
          <span>{fileLabel}</span>
          <input
            id={fileId}
            type="file"
            accept={accept}
            multiple={multiple}
            disabled={disabled}
            onChange={event => {
              onSelect(event.currentTarget.files);
              event.currentTarget.value = '';
            }}
          />
        </label>
        <label htmlFor={cameraId} className="sn-button secondary sn-media-picker-btn">
          <Camera size={variant === 'compact' ? 15 : 17} />
          <span>{cameraLabel}</span>
          <input
            id={cameraId}
            type="file"
            accept={captureAccept}
            capture="environment"
            disabled={disabled}
            onChange={event => {
              onSelect(event.currentTarget.files);
              event.currentTarget.value = '';
            }}
          />
        </label>
      </div>
      {hint && <span className="sn-media-picker-hint">{hint}</span>}
    </div>
  );
}
