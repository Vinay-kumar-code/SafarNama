import React from 'react';
import { Film, Map, Compass, MessageSquareText, Trophy, User } from 'lucide-react';
import { useApp, NavTab } from '../../context/AppContext';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, currentTrip, qaThreads, activeRole } = useApp();

  const totalSavedStops = currentTrip.stops.length;
  const activeQACount = qaThreads.filter(t => t.status === 'active').length;

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'feed',
      label: 'Reels',
      icon: <Film className="w-5 h-5" />,
    },
    {
      id: 'map',
      label: 'Explore Map',
      icon: <Map className="w-5 h-5" />,
    },
    {
      id: 'trips',
      label: 'Trip Plan',
      icon: <Compass className="w-5 h-5" />,
      badge: totalSavedStops > 0 ? totalSavedStops : undefined,
    },
    {
      id: 'qa',
      label: 'Live Q&A',
      icon: <MessageSquareText className="w-5 h-5" />,
      badge: activeQACount > 0 ? activeQACount : undefined,
    },
    {
      id: 'campaigns',
      label: 'Trends',
      icon: <Trophy className="w-5 h-5" />,
    },
    {
      id: 'profile',
      label: activeRole === 'local_guide' ? 'Guide' : 'Passport',
      icon: <User className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-zinc-200 px-2 py-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-xs">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-orange-500 font-bold scale-105'
                  : 'text-zinc-500 hover:text-zinc-800 font-medium'
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-[10px] font-black text-white flex items-center justify-center shadow-md">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight ${isActive ? 'text-orange-600 font-semibold' : 'text-zinc-500'}`}>
                {item.label}
              </span>

              {isActive && (
                <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-orange-500 shadow-xs shadow-orange-500" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
