import { useState, type FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { accountLabels } from '../../lib/authHelpers';
import type { AccountType } from '../../types';
import { Modal } from '../social/Primitives';

const accountDescriptions: Record<AccountType, string> = {
  traveler: 'Share stories and plan journeys.',
  local_guide: 'Share local knowledge and publish tours.',
  business: 'List a stay, agency, or local service.',
  destination_manager: 'Maintain destination pages and publish updates.',
};

export function AuthModal() {
  const auth = useAuth();
  if (!auth.isAuthModalOpen) return null;
  return <AccountForm key={auth.authModalMode} />;
}

function AccountForm() {
  const { authModalMode, closeAuthModal, signIn, signUp, signInWithGoogle, isLoading } = useAuth();
  const [mode, setMode] = useState(authModalMode);
  const [role, setRole] = useState<AccountType>('traveler');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setConfirmation(false);
    if (mode === 'signup' && !fullName.trim()) {
      setError('Enter your name or business name.');
      return;
    }
    const result = mode === 'signin'
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password, { fullName: fullName.trim(), username: username.trim().toLowerCase(), role });
    if (result.error) setError(result.error.message);
    else if (result.needsEmailConfirmation) setConfirmation(true);
  }

  return <Modal title={mode === 'signin' ? 'Sign in to SafarNama' : 'Join SafarNama'} onClose={closeAuthModal}>
    <div className="sn-secondary-form sn-account-dialog">
      <div className="sn-segment" role="group" aria-label="Access your account">
        {(['signin', 'signup'] as const).map(value => <button key={value} aria-pressed={mode === value} onClick={() => {
          setMode(value); setError(''); setConfirmation(false);
        }}>{value === 'signin' ? 'Sign in' : 'Create account'}</button>)}
      </div>
      {error && <p className="sn-form-feedback" role="alert">{error}</p>}
      {confirmation && <p className="sn-form-feedback success" role="status">Check your email for a confirmation link, then sign in.</p>}
      {mode === 'signin' && <button className="sn-button secondary" disabled={isLoading} onClick={async () => {
        setError('');
        const result = await signInWithGoogle();
        if (result.error) setError(result.error.message);
      }}>Continue with Google</button>}
      <form className="sn-secondary-stack" onSubmit={submit}>
        {mode === 'signup' && <>
          <label className="sn-secondary-label">Account type<select className="sn-field" value={role} onChange={event => setRole(event.target.value as AccountType)}>
            {Object.entries(accountLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select><small className="sn-secondary-body">{accountDescriptions[role]}</small></label>
          <label className="sn-secondary-label">{role === 'business' ? 'Business name' : 'Full name'}<input className="sn-field" autoComplete="name" value={fullName} onChange={event => setFullName(event.target.value)} maxLength={80} required /></label>
          <label className="sn-secondary-label">Username<input className="sn-field" autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} pattern="[A-Za-z0-9_]{3,24}" title="Use 3 to 24 letters, numbers, or underscores." required /></label>
        </>}
        <label className="sn-secondary-label">Email<input className="sn-field" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required /></label>
        <div className="sn-secondary-label"><label htmlFor="account-password">Password</label><div className="sn-password-field">
          <input id="account-password" className="sn-field" type={visible ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={mode === 'signup' ? 6 : undefined} required />
          <button type="button" className="sn-icon" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={16} /> : <Eye size={16} />}</button>
        </div></div>
        <button className="sn-button" disabled={isLoading || confirmation}>{isLoading ? 'Please wait…' : mode === 'signin' ? 'Sign in with email' : 'Create account'}</button>
      </form>
    </div>
  </Modal>;
}
