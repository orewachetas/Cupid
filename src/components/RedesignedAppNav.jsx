import React, { useState } from 'react';
import { Icon, Avatar } from './FigmaIcons';
import { useUser } from '../context/UserContext';

export default function RedesignedAppNav({ screen, setScreen, unreadCount = 2, matchCount = 4, onLogout }) {
  const { currentUser, setIsFirebaseSettingsOpen, setIsProfileModalOpen } = useUser();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const items = [
    { id: 'discover', label: 'Discover', icon: 'discover' },
    { id: 'matches', label: 'Matches', icon: 'heart', badge: matchCount },
    { id: 'messages', label: 'Messages', icon: 'message', badge: unreadCount },
    { id: 'wall', label: 'Campus Wall', icon: 'sparkle' },
    { id: 'quiz', label: 'Match Quiz', icon: 'bolt' },
    { id: 'profile', label: 'My profile', icon: 'profile' },
  ];

  const mobileItems = [
    { id: 'discover', label: 'Discover', icon: 'discover' },
    { id: 'matches', label: 'Matches', icon: 'heart', badge: matchCount },
    { id: 'messages', label: 'Messages', icon: 'message', badge: unreadCount },
    { id: 'wall', label: 'Wall', icon: 'sparkle' },
    { id: 'profile', label: 'Profile', icon: 'profile' },
  ];

  const userName = currentUser?.name || 'Alex Morgan';
  const userEmail = currentUser?.email || 'alex@campus.edu';
  const userPhoto = currentUser?.photoUrl || currentUser?.photo || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80';

  return (
    <>
      <aside className="app-sidebar">
        <button className="app-brand" onClick={() => setScreen('discover')}>
          <span>
            <Icon name="heart" size={18} />
          </span>
          Cupid
        </button>

        <nav>
          <p>Campus</p>
          {items.map((item) => (
            <button
              key={item.id}
              className={screen === item.id ? 'active' : ''}
              onClick={() => {
                setScreen(item.id);
                setShowUserMenu(false);
              }}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {Boolean(item.badge && item.badge > 0) && <b>{item.badge}</b>}
            </button>
          ))}
        </nav>

        <div className="campus-card" onClick={() => setScreen('quiz')} role="button" tabIndex={0} style={{ cursor: 'pointer' }}>
          <span>
            <Icon name="sparkle" size={18} />
          </span>
          <div>
            <strong>Campus Plus</strong>
            <small>Find your best matches</small>
          </div>
          <Icon name="chevron" size={15} />
        </div>

        <div style={{ position: 'relative' }}>
          {showUserMenu && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                left: 0,
                right: 0,
                marginBottom: '10px',
                background: '#281522',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <button
                onClick={() => { setScreen('profile'); setShowUserMenu(false); }}
                style={{
                  border: 0,
                  background: 'transparent',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  textAlign: 'left',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Icon name="profile" size={14} /> View Profile
              </button>
              <button
                onClick={() => { setIsFirebaseSettingsOpen(true); setShowUserMenu(false); }}
                style={{
                  border: 0,
                  background: 'transparent',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  textAlign: 'left',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Icon name="settings" size={14} /> Firebase Config
              </button>
              <button
                onClick={() => { if (onLogout) onLogout(); }}
                style={{
                  border: 0,
                  background: 'rgba(238, 121, 109, 0.15)',
                  color: '#ee796d',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  textAlign: 'left',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Log Out
              </button>
            </div>
          )}

          <button
            className="sidebar-user"
            onClick={() => setShowUserMenu(!showUserMenu)}
            type="button"
          >
            <Avatar src={userPhoto} name={userName} online />
            <span>
              <strong>{userName}</strong>
              <small>{userEmail}</small>
            </span>
            <Icon name="more" size={18} />
          </button>
        </div>
      </aside>

      <nav className="mobile-nav">
        {mobileItems.map((item) => (
          <button
            aria-label={item.label}
            key={item.id}
            className={screen === item.id ? 'active' : ''}
            onClick={() => setScreen(item.id)}
          >
            <Icon name={item.icon} size={21} />
            {Boolean(item.badge && item.badge > 0) && <b>{item.badge}</b>}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}

