import { useEffect, useRef, useState, type ReactNode } from 'react';
import { X, ImageOff, Compass, User } from 'lucide-react';
import { loadMedia } from '../../lib/localMedia';
import { serverMediaUrl } from '../../lib/serverStorage';
import type { Profile } from '../../types';

let openDialogs = 0;
let originalOverflow = '';

export function Modal({ title, children, onClose, className = '' }: { title: string; children: ReactNode; onClose: () => void; className?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    element.showModal();
    if (openDialogs === 0) originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    openDialogs += 1;
    return () => {
      element.close();
      openDialogs -= 1;
      if (openDialogs === 0) document.body.style.overflow = originalOverflow;
    };
  }, []);
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
  return source?.startsWith('local-media:') ? resolved : serverMediaUrl(source);
}
export function TravelImage({ src, alt, className = '' }: { src?: string; alt: string; className?: string }) {
  const url = useMediaSource(src);
  const [fallbackLevel, setFallbackLevel] = useState<0 | 1 | 2>(0);
  useEffect(() => setFallbackLevel(0), [src, url]);
  const activeUrl = fallbackLevel === 0 ? url : fallbackLevel === 1 && src?.startsWith('/media/') && url !== src ? src : undefined;
  return activeUrl ? <img className={className} src={activeUrl} alt={alt} loading="lazy" onError={() => {
    if (fallbackLevel === 0 && src?.startsWith('/media/') && url !== src) setFallbackLevel(1);
    else setFallbackLevel(2);
  }} /> : <div role="img" aria-label={alt} className={`sn-image-fallback ${className}`}><ImageOff size={24} /><span>{alt}</span></div>;
}
export function ProfileAvatar({ profile, className = '' }: { profile: Profile; className?: string }) {
  const url = useMediaSource(profile.avatarUrl);
  const [failedUrl, setFailedUrl] = useState('');
  const initials = profile.fullName.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase();
  return <span className={`sn-profile-initial ${className}`} aria-hidden="true">
    {url && failedUrl !== url
      ? <img src={url} alt="" onError={() => setFailedUrl(url)} />
      : initials || <User size={17} />}
  </span>;
}
export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="sn-empty"><Compass size={34} strokeWidth={1.3} /><h3>{title}</h3><p>{description}</p>{action}</div>;
}
