import { Home, Compass, Clapperboard, Map, BookOpen, MessageCircle, Sparkles, Plus, ArrowUpRight, User, LogIn } from 'lucide-react';
import { useApp, type NavTab } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useSocial } from '../../context/SocialContext';
const primary = [{ id: 'feed', label: 'Home', icon: Home }, { id: 'explore', label: 'Explore India', icon: Compass }, { id: 'reels', label: 'Reels', icon: Clapperboard }, { id: 'map', label: 'Map', icon: Map }, { id: 'profile', label: 'My journal', icon: User }] as const;
export function SocialNav() {
  const { activeTab, setActiveTab, currentUser } = useApp();
  const { setComposerOpen } = useSocial();
  const { openAuthModal, isAuthenticated } = useAuth();
  const item = (id: NavTab, label: string, Icon: typeof Home) => <button key={id} className={`sn-nav-item ${activeTab === id ? 'active' : ''}`} aria-current={activeTab === id ? 'page' : undefined} onClick={() => setActiveTab(id)}><Icon size={22} strokeWidth={activeTab === id ? 2.2 : 1.7} /><span>{label}</span>{activeTab === id && <i />}</button>;
  return <>
    <aside className="sn-sidebar"><button className="sn-brand" onClick={() => setActiveTab('feed')} aria-label="SafarNama home"><span className="sn-brand-mark"><Compass size={25} /></span><span>SafarNama<small>Every journey, a story</small></span></button>
      <nav aria-label="Main navigation">{primary.map(link => item(link.id, link.label, link.icon))}<div className="sn-nav-divider" />{item('trips', 'My journeys', BookOpen)}{item('qa', 'Travel conversations', MessageCircle)}{item('campaigns', 'Celebrate India', Sparkles)}</nav>
      <button className="sn-button sn-create" onClick={() => setComposerOpen(true)}><Plus size={19} /><span>Create a story</span></button>
      <div className="sn-sidebar-bottom"><div className="sn-sidebar-note"><span>A little curiosity.</span><span>A whole lot of India.</span><span className="sn-tricolor"><i /><i /><i /></span></div>
        <button className="sn-user-button" onClick={() => setActiveTab('profile')}><img src={currentUser.avatarUrl} alt="" /><span><strong>{currentUser.fullName}</strong><small>@{currentUser.username}</small></span><ArrowUpRight size={16} /></button>
        {!isAuthenticated && <button className="sn-sign-in" onClick={() => openAuthModal('signin')}><LogIn size={14} />Sign in / join</button>}
      </div>
    </aside>
    <header className="sn-mobile-header"><button className="sn-brand" onClick={() => setActiveTab('feed')}><span className="sn-brand-mark"><Compass size={21} /></span><span>SafarNama</span></button><button className="sn-icon" aria-label="Create a story" onClick={() => setComposerOpen(true)}><Plus /></button></header>
    <nav className="sn-bottom-nav" aria-label="Mobile navigation">{primary.map(link => item(link.id, link.label, link.icon))}</nav>
  </>;
}
