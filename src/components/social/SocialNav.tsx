import { ArrowUpRight, BookOpen, Clapperboard, Compass, Home, LogIn, Map, MessageCircle, Plus, Sparkles, User, Workflow } from 'lucide-react';
import { useApp, type NavTab } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useSocial } from '../../context/SocialContext';
import { ProfileAvatar } from './Primitives';

const primary = [{ id: 'feed', label: 'Home', icon: Home }, { id: 'explore', label: 'Explore India', icon: Compass }, { id: 'reels', label: 'Reels', icon: Clapperboard }, { id: 'map', label: 'Map', icon: Map }, { id: 'profile', label: 'My journal', icon: User }] as const;

export function SocialNav() {
  const { activeTab, setActiveTab } = useApp();
  const { setComposerOpen } = useSocial();
  const { openAuthModal, profile } = useAuth();
  const item = (id: NavTab, label: string, Icon: typeof Home) => <button key={id} className={`sn-nav-item ${activeTab === id ? 'active' : ''}`} aria-current={activeTab === id ? 'page' : undefined} onClick={() => setActiveTab(id)}><Icon size={22} strokeWidth={activeTab === id ? 2.2 : 1.7} /><span>{label}</span>{activeTab === id && <i />}</button>;
  const brand = <button className="sn-brand" onClick={() => setActiveTab('feed')} aria-label="SafarNama home"><img className="sn-brand-mark" src="/logo.svg" alt="" /><span>SafarNama</span></button>;
  return <>
    <aside className="sn-sidebar">{brand}
      <nav aria-label="Main navigation">{primary.map(link => item(link.id, link.label, link.icon))}<div className="sn-nav-divider" />
        {item('trips', 'My journeys', BookOpen)}{item('qa', 'Travel conversations', MessageCircle)}{item('campaigns', 'Celebrate India', Sparkles)}{profile && item('studio', 'Publishing studio', Workflow)}
      </nav>
      <button className="sn-button sn-create" onClick={() => setComposerOpen(true)}><Plus size={19} /><span>Create a story</span></button>
      <div className="sn-sidebar-bottom">
        {profile ? <button className="sn-user-button" onClick={() => setActiveTab('profile')}><ProfileAvatar profile={profile} /><span><strong>{profile.fullName}</strong><small>@{profile.username}</small></span><ArrowUpRight size={16} /></button>
          : <button className="sn-sign-in" onClick={() => openAuthModal()}><LogIn size={16} />Sign in / join</button>}
      </div>
    </aside>
    <header className="sn-mobile-header">{brand}<button className="sn-icon" aria-label="Create a story" onClick={() => setComposerOpen(true)}><Plus /></button></header>
    <nav className="sn-bottom-nav" aria-label="Mobile navigation">{primary.map(link => item(link.id, link.label, link.icon))}</nav>
  </>;
}
