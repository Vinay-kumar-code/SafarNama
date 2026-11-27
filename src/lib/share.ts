import { isNative, nativeAction } from './device';

export async function copyLink(url: string) {
  if (isNative) await nativeAction({ action: 'copy', text: url });
  else await navigator.clipboard.writeText(url);
}

export async function shareLink(title: string, url: string, text?: string) {
  if (isNative) { await nativeAction({ action: 'share', title, text: [title, text, url].filter(Boolean).join('\n\n') }); return 'shared'; }
  if (navigator.share) {
    try { await navigator.share({ title, text, url }); return 'shared'; }
    catch (failure) { if (failure instanceof DOMException && failure.name === 'AbortError') throw failure; }
  }
  await copyLink(url);
  return 'copied';
}
