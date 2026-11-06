import React, { useEffect, useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { UserProvider, useUser } from './context/UserContext';
import RedesignedAppNav from './components/RedesignedAppNav';
import RedesignedTopbar from './components/RedesignedTopbar';
import RedesignedDiscover from './components/RedesignedDiscover';
import RedesignedMatches from './components/RedesignedMatches';
import RedesignedMessages from './components/RedesignedMessages';
import RedesignedProfile from './components/RedesignedProfile';
import CampusWall from './components/CampusWall';
import MatchQuiz from './components/MatchQuiz';
import UserDetailModal from './components/UserDetailModal';
import FirebaseSettingsModal from './components/FirebaseSettingsModal';
import ProfileModal from './components/ProfileModal';
import LoginPage from './components/LoginPage';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Cupid App Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 text-center" style={{ background: 'var(--cream, #f8f5ed)' }}>
          <div style={{ background: '#fff', padding: '32px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', border: '1px solid var(--line, #e9e2e3)', maxWidth: '500px' }}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', fontWeight: 700, color: 'var(--ink, #281522)', margin: '0 0 12px' }}>
              💘 Cupid Notice
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--muted, #81737b)', margin: '0 0 16px' }}>
              An issue occurred while rendering the page:
            </p>
            <div style={{ padding: '12px', background: 'rgba(238, 121, 109, 0.1)', border: '1px solid rgba(238, 121, 109, 0.3)', borderRadius: '12px', textAlign: 'left', fontSize: '11px', fontFamily: 'monospace', color: '#c53929', overflowX: 'auto', maxHeight: '140px', marginBottom: '16px' }}>
              {this.state.error?.toString() || 'Unknown rendering error'}
            </div>
            <button
              onClick={() => { localStorage.clear(); window.location.reload(); }}
              style={{ padding: '10px 24px', borderRadius: '12px', background: 'var(--coral, #ee796d)', color: '#fff', fontWeight: 700, fontSize: '13px', border: 0, cursor: 'pointer' }}
            >
              Reset App Data & Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function CupidMainApp({ onLogout }) {
  const [screen, setScreen] = useState('discover'); // 'discover' | 'matches' | 'messages' | 'wall' | 'quiz' | 'profile'
  const [chatId, setChatId] = useState(null);
  const [selectedProfileDetail, setSelectedProfileDetail] = useState(null);

  const { activeChatUser, setActiveChatUser, logoutUser, likedIds = [] } = useUser();

  const handleLogout = () => {
    logoutUser();
    if (onLogout) onLogout();
  };

  const handleOpenChat = (id) => {
    if (id) {
      setChatId(id);
      setActiveChatUser(id);
    }
    setScreen('messages');
  };

  // Sync activeChatUser with screen when triggered externally (e.g. from UserDetailModal)
  useEffect(() => {
    if (activeChatUser) {
      setChatId(activeChatUser);
      setScreen('messages');
    }
  }, [activeChatUser]);

  return (
    <main className="app-shell">
      {/* 1. Left Sidebar Navigation (and bottom bar on mobile) */}
      <RedesignedAppNav
        screen={screen}
        setScreen={setScreen}
        unreadCount={0}
        matchCount={likedIds.length}
        onLogout={handleLogout}
      />

      {/* 2. Main Content Area */}
      <div className="app-main">
        {screen === 'discover' && (
          <RedesignedDiscover
            onMessage={handleOpenChat}
            onOpenDetail={(profile) => setSelectedProfileDetail(profile)}
            onNavigateWall={() => setScreen('wall')}
            onNavigateProfile={() => setScreen('profile')}
          />
        )}

        {screen === 'matches' && (
          <RedesignedMatches
            onChat={handleOpenChat}
            onOpenDetail={(profile) => setSelectedProfileDetail(profile)}
            onNavigateDiscover={() => setScreen('discover')}
          />
        )}

        {screen === 'messages' && (
          <RedesignedMessages
            key={chatId || 'no-initial'}
            initialContact={chatId}
            onOpenDetail={(profile) => setSelectedProfileDetail(profile)}
            onNavigateDiscover={() => setScreen('discover')}
          />
        )}

        {screen === 'wall' && (
          <div className="screen-content">
            <RedesignedTopbar
              title="Campus Wall"
              subtitle="Anonymous confessions, shoutouts & campus buzz."
            />
            <div className="page-pad">
              <CampusWall />
            </div>
          </div>
        )}

        {screen === 'quiz' && (
          <div className="screen-content">
            <RedesignedTopbar
              title="Match Compatibility Quiz"
              subtitle="Calculate your campus compatibility score."
            />
            <div className="page-pad">
              <MatchQuiz />
            </div>
          </div>
        )}

        {screen === 'profile' && <RedesignedProfile />}
      </div>

      {/* Student Profile Detail Modal */}
      {selectedProfileDetail && (
        <UserDetailModal
          profile={selectedProfileDetail}
          onClose={() => setSelectedProfileDetail(null)}
        />
      )}

      {/* Firebase Settings Modal */}
      <FirebaseSettingsModal />

      {/* Profile Setup Modal */}
      <ProfileModal onSaveSuccess={() => setScreen('discover')} />
    </main>
  );
}

function RootApp() {
  const resetVersion = '2026-09-13-reset-accounts';
  const { logoutUser } = useUser();
  const [isResettingAccounts] = useState(() => localStorage.getItem('cupid_reset_version') !== resetVersion);
  const [showLoginPage, setShowLoginPage] = useState(() => {
    const hasLoggedIn = localStorage.getItem('cupid_has_logged_in');
    return hasLoggedIn !== 'true';
  });

  const handleLoginSuccess = () => {
    localStorage.setItem('cupid_has_logged_in', 'true');
    window.location.reload();
  };

  const handleLogout = () => {
    localStorage.removeItem('cupid_has_logged_in');
    setShowLoginPage(true);
  };

  useEffect(() => {
    if (!isResettingAccounts) return;

    Object.keys(localStorage)
      .filter((key) => key.startsWith('cupid_'))
      .forEach((key) => localStorage.removeItem(key));
    localStorage.setItem('cupid_reset_version', resetVersion);
    logoutUser();
  }, [isResettingAccounts, logoutUser, resetVersion]);

  if (isResettingAccounts) {
    return <div className="min-h-screen" style={{ background: 'var(--cream, #f8f5ed)' }} />;
  }

  if (showLoginPage) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return <CupidMainApp onLogout={handleLogout} />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <UserProvider>
          <RootApp />
        </UserProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
