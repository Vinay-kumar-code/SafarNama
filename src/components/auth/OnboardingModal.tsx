import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocial } from '../../context/SocialContext';
import { useServerData } from '../../context/ServerDataContext';
import { hasServerStorage } from '../../lib/serverStorage';
import { accountLabels, isAccountType } from '../../lib/authHelpers';
import { removeMedia, storeMedia } from '../../lib/localMedia';
import { normalizeMediaFile } from '../../lib/storyDrafts';
import type { AccountType, Profile } from '../../types';
import { MediaPicker } from '../common/MediaPicker';
import { Modal, ProfileAvatar } from '../social/Primitives';

export function OnboardingModal() {
  const { isOnboardingOpen, profile } = useAuth();
  return isOnboardingOpen && profile ? <ProfileEditor key={profile.id} profile={profile} /> : null;
}

function ProfileEditor({ profile }: { profile: Profile }) {
  const { closeOnboarding, updateProfile } = useAuth();
  const { notify } = useSocial();
  const { write } = useServerData();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [avatar, setAvatar] = useState(profile.avatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  function handleSelectAvatar(files: FileList | null) {
    const raw = files?.[0];
    if (!raw) return;
    try {
      const file = normalizeMediaFile(raw, false);
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Choose a JPG, PNG, WebP, or GIF photo under 8 MB.');
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    const read = (key: string) => String(data.get(key) ?? '').trim();
    if (!read('name')) { setError('Enter your name or business name.'); return; }
    setBusy(true);
    setError('');
    let uploaded: string | undefined;
    try {
      if (avatarFile) {
        uploaded = await storeMedia(avatarFile);
      }
      const avatarUrl = uploaded ?? avatar;
      const result = await updateProfile({
        fullName: read('name'), username: read('username').toLowerCase(), bio: read('bio'), homeCity: read('city'), avatarUrl,
        languagesSpoken: [...new Set(read('languages').split(',').map(language => language.trim()).filter(Boolean))],
        activeRole: (read('account') || profile.activeRole) as AccountType,
      });
      if (result.error) throw result.error;
      if (hasServerStorage) {
        try { await write('me', 'profile', 'current', {}); }
        catch { closeOnboarding(); notify('Profile saved. Published author details will refresh on your next successful update.'); return; }
      }
      closeOnboarding();
      notify('Profile settings saved.');
    } catch (failure) {
      if (uploaded) await removeMedia(uploaded).catch(() => {});
      setError(failure instanceof Error ? failure.message : 'Could not save your profile.');
    } finally { setBusy(false); }
  }

  return <Modal title="Profile settings" onClose={() => { if (!busy) closeOnboarding(); }}>
    <form className="sn-secondary-form sn-account-dialog" onSubmit={save}>
      <div className="sn-profile-photo-settings">
        <ProfileAvatar profile={{ ...profile, avatarUrl: previewUrl || avatar }} />
        <div className="sn-secondary-stack">
          <MediaPicker
            variant="compact"
            accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
            captureKind="image"
            disabled={busy}
            fileLabel={avatarFile || avatar ? 'Change photo' : 'Choose from gallery / files'}
            cameraLabel="Take photo"
            onSelect={handleSelectAvatar}
          />
          {(avatarFile || avatar) && <button className="sn-button secondary" type="button" disabled={busy} onClick={() => { setAvatarFile(null); setPreviewUrl(''); setAvatar(''); }}>Remove photo</button>}
        </div>
      </div>
      <div className="sn-account-fields">
        <label className="sn-secondary-label">Display name<input className="sn-field" name="name" autoComplete="name" defaultValue={profile.fullName} maxLength={80} required /></label>
        <label className="sn-secondary-label">Username<input className="sn-field" name="username" autoComplete="username" defaultValue={profile.username} pattern="[A-Za-z0-9_]{3,24}" title="Use 3 to 24 letters, numbers, or underscores." required /></label>
      </div>
      {isAccountType(profile.activeRole) && <label className="sn-secondary-label">Account type<select className="sn-field" name="account" defaultValue={profile.activeRole}>
        {Object.entries(accountLabels).map(([role, label]) => <option value={role} key={role}>{label}</option>)}
      </select></label>}
      <label className="sn-secondary-label">Home city<input className="sn-field" name="city" defaultValue={profile.homeCity} maxLength={80} /></label>
      <label className="sn-secondary-label">Bio<textarea className="sn-field" name="bio" rows={3} defaultValue={profile.bio} maxLength={320} /></label>
      <label className="sn-secondary-label">Languages spoken<input className="sn-field" name="languages" defaultValue={profile.languagesSpoken.join(', ')} placeholder="English, Tamil" maxLength={160} /></label>
      {error && <p className="sn-form-feedback" role="alert">{error}</p>}
      <div className="sn-secondary-actions"><button className="sn-button secondary" type="button" disabled={busy} onClick={closeOnboarding}>Cancel</button><button className="sn-button" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button></div>
    </form>
  </Modal>;
}
