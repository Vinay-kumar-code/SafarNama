import { useEffect, useRef, useState, type ReactNode } from 'react';
import { X, ImageOff, Compass } from 'lucide-react';
import { loadMedia } from '../../lib/localMedia';

export function Modal({ title, children, onClose, className = '' }: { title: string; children: ReactNode; onClose: () => void; className?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); const old = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = old; }; }, []);
  return <dialog ref={dialog} className={`sn-modal ${className}`} aria-label={title} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="sn-modal-inner"><header className="sn-modal-header"><h2>{title}</h2><button className="sn-icon" aria-label="Close dialog" onClick={onClose}><X size={21} /></button></header>{children}</div>
  </dialog>;
}
export function useMediaSource(source?: string) {
  const [resolved, setResolved] = useState<string>();
  useEffect(() => {
    let cancelled = false; let objectUrl: string | undefined;
    setResolved(undefined);
    if (source?.startsWith('local-media:')) loadMedia(source).then(blob => {
      if (blob && !cancelled) { objectUrl = URL.createObjectURL(blob); setResolved(objectUrl); }
    }).catch(() => {});
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [source]);
  return source?.startsWith('local-media:') ? resolved : source;
}
export function TravelImage({ src, alt, className = '' }: { src?: string; alt: string; className?: string }) {
  const url = useMediaSource(src); const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return url && !failed ? <img className={className} src={url} alt={alt} loading="lazy" onError={() => setFailed(true)} /> : <div role="img" aria-label={alt} className={`sn-image-fallback ${className}`}><ImageOff size={24} /><span>{alt}</span></div>;
}
export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="sn-empty"><Compass size={34} strokeWidth={1.3} /><h3>{title}</h3><p>{description}</p>{action}</div>;
}
