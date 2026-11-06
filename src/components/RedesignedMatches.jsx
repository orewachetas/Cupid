import React, { useState, useMemo } from 'react';
import { Icon, Avatar } from './FigmaIcons';
import RedesignedTopbar from './RedesignedTopbar';
import { useUser } from '../context/UserContext';

export default function RedesignedMatches({ onChat, onOpenDetail, onNavigateDiscover }) {
  const { profiles: contextProfiles = [], likedIds = [], currentUser } = useUser();
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'likes'

  // Only real external profiles
  const allRealProfiles = useMemo(() => {
    if (!Array.isArray(contextProfiles)) return [];
    return contextProfiles.filter(p => {
      const isMe = p.id === currentUser?.uid || p.uid === currentUser?.uid || (currentUser?.email && p.email?.toLowerCase() === currentUser?.email?.toLowerCase());
      return !isMe;
    });
  }, [contextProfiles, currentUser]);

  const likedSet = useMemo(() => new Set(likedIds), [likedIds]);

  const matchedProfiles = useMemo(() => {
    return allRealProfiles.filter(p => likedSet.has(p.id) || likedSet.has(p.uid));
  }, [allRealProfiles, likedSet]);

  return (
    <div className="screen-content">
      <RedesignedTopbar
        title="Your matches"
        subtitle={matchedProfiles.length > 0 ? `You have ${matchedProfiles.length} campus connection${matchedProfiles.length === 1 ? '' : 's'}.` : "Keep connecting on campus."}
      />

      <div className="page-pad">
        <div className="section-tabs">
          <button
            className={activeTab === 'all' ? 'active' : ''}
            onClick={() => setActiveTab('all')}
            type="button"
          >
            All matches <span>{matchedProfiles.length}</span>
          </button>
          <button
            className={activeTab === 'likes' ? 'active' : ''}
            onClick={() => setActiveTab('likes')}
            type="button"
          >
            Your likes <span>{likedIds.length}</span>
          </button>
        </div>

        {matchedProfiles.length === 0 ? (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              background: 'var(--paper, #fffdfa)',
              borderRadius: '20px',
              border: '1px solid var(--line, #e9e2e3)',
              maxWidth: '500px',
              margin: '30px auto'
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(238, 121, 109, 0.15)',
                color: 'var(--coral, #ee796d)',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px'
              }}
            >
              <Icon name="heart" size={26} />
            </div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', margin: '0 0 8px', color: 'var(--ink)' }}>
              No matches yet
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 20px', lineHeight: 1.5 }}>
              Browse students on the Discover feed and press like when you find someone you want to meet!
            </p>
            {onNavigateDiscover && (
              <button
                type="button"
                onClick={onNavigateDiscover}
                style={{
                  padding: '10px 24px',
                  borderRadius: '12px',
                  background: 'var(--coral, #ee796d)',
                  color: 'white',
                  border: 0,
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Go to Discover
              </button>
            )}
          </div>
        ) : (
          <div className="matches-grid">
            {matchedProfiles.map((person) => (
              <article className="match-card" key={person.id}>
                <div
                  className="match-photo"
                  onClick={() => onOpenDetail && onOpenDetail(person)}
                  style={{ cursor: 'pointer', position: 'relative' }}
                >
                  {person.photoUrl || person.photo ? (
                    <img src={person.photoUrl || person.photo} alt={person.name} />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, #42152f 0%, #ee796d 100%)',
                        display: 'grid',
                        placeItems: 'center',
                        color: 'white'
                      }}
                    >
                      <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'grid', placeItems: 'center', fontSize: '24px', fontWeight: 800 }}>
                        {person.name ? person.name.charAt(0).toUpperCase() : '?'}
                      </div>
                    </div>
                  )}
                  <span>
                    <i /> Liked by you
                  </span>
                </div>

                <div className="match-info">
                  <h3>
                    {person.name || 'Campus Student'}, {person.age || 20}
                    <span>
                      <Icon name="check" size={9} />
                    </span>
                  </h3>
                  <p>{person.major || person.college || 'College Student'}</p>
                  <div>
                    <button onClick={() => onChat(person.id)} type="button">
                      <Icon name="message" size={17} /> Say hello
                    </button>
                    <button
                      aria-label="View Profile"
                      type="button"
                      onClick={() => onOpenDetail && onOpenDetail(person)}
                    >
                      <Icon name="profile" size={17} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
