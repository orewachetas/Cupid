import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Icon, Avatar } from './FigmaIcons';
import RedesignedTopbar from './RedesignedTopbar';
import { useUser } from '../context/UserContext';

function RightRail({ onMessage, likedProfiles, activeChats, totalCampusCount }) {
  return (
    <aside className="right-rail">
      <div className="rail-head">
        <div>
          <h3>Your likes & matches</h3>
          <span>{likedProfiles.length}</span>
        </div>
      </div>

      {likedProfiles.length > 0 ? (
        <div className="match-row">
          {likedProfiles.map((person) => (
            <button key={person.id} onClick={() => onMessage(person.id)} type="button">
              <span className="fresh">
                {person.photoUrl || person.photo ? (
                  <img src={person.photoUrl || person.photo} alt={person.name} />
                ) : (
                  <Avatar name={person.name} />
                )}
              </span>
              <small>{person.name || 'Student'}</small>
            </button>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: '11px', color: 'var(--muted)', padding: '10px 0' }}>
          Like students on Discover to see your matches here.
        </p>
      )}

      <div className="rail-divider" />

      <div className="rail-head">
        <div>
          <h3>Recent messages</h3>
          <span>{activeChats.length}</span>
        </div>
      </div>

      {activeChats.length > 0 ? (
        <div className="mini-conversations">
          {activeChats.slice(0, 4).map((chat) => (
            <button key={chat.id} onClick={() => onMessage(chat.id)} type="button">
              <Avatar src={chat.photoUrl || chat.photo} name={chat.name} online={chat.online} />
              <span>
                <strong>{chat.name || 'Student'}</strong>
                <small>{chat.lastMessage || 'Connected on campus'}</small>
              </span>
              <time>{chat.time || 'Today'}</time>
            </button>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: '11px', color: 'var(--muted)', padding: '10px 0' }}>
          No conversations yet. Match and say hello!
        </p>
      )}

      <div className="campus-pulse">
        <span>
          <Icon name="bolt" size={19} />
        </span>
        <div>
          <strong>Campus is active</strong>
          <p>{totalCampusCount > 0 ? `${totalCampusCount} students joined Cupid.` : 'Connect with campus students now.'}</p>
        </div>
      </div>
    </aside>
  );
}

export default function RedesignedDiscover({ onMessage, onOpenDetail, onNavigateWall, onNavigateProfile }) {
  const { currentUser, profiles: contextProfiles = [], likedIds = [], toggleLike, chats = {} } = useUser();

  // ONLY real registered profiles, excluding the current user. NEVER inject fake profiles.
  const allProfiles = useMemo(() => {
    if (!Array.isArray(contextProfiles)) return [];
    return contextProfiles.filter(p => {
      const isMe = p.id === currentUser?.uid || p.uid === currentUser?.uid || (currentUser?.email && p.email?.toLowerCase() === currentUser?.email?.toLowerCase());
      return !isMe;
    });
  }, [contextProfiles, currentUser]);

  const likedProfiles = useMemo(() => {
    const set = new Set(likedIds);
    return allProfiles.filter(p => set.has(p.id) || set.has(p.uid));
  }, [allProfiles, likedIds]);

  const activeChats = useMemo(() => {
    const list = [];
    Object.keys(chats).forEach((chatPartnerId) => {
      const partner = allProfiles.find(p => p.id === chatPartnerId || p.uid === chatPartnerId);
      const messages = chats[chatPartnerId] || [];
      const lastMsg = messages[messages.length - 1];
      if (partner) {
        list.push({
          id: partner.id,
          name: partner.name,
          photoUrl: partner.photoUrl || partner.photo || null,
          lastMessage: lastMsg?.text || 'Connected',
          time: lastMsg?.timestamp ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
          online: true
        });
      }
    });
    return list;
  }, [chats, allProfiles]);

  const [index, setIndex] = useState(0);
  const [saved, setSaved] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const currentProfile = allProfiles.length > 0 ? allProfiles[index % allProfiles.length] : null;
  const nextProfile = allProfiles.length > 1 ? allProfiles[(index + 1) % allProfiles.length] : null;

  const handleNext = (action) => {
    if (!currentProfile) return;
    if (action === "like") {
      toggleLike(currentProfile.id);
      setNotice(`You liked ${currentProfile.name || 'this student'}`);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } else {
      setNotice("Profile passed");
    }
    setTimeout(() => setNotice(""), 1800);
    setIndex((val) => (val + 1) % allProfiles.length);
  };

  const handleUndo = () => {
    if (allProfiles.length === 0) return;
    setIndex((val) => (val - 1 + allProfiles.length) % allProfiles.length);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (!currentProfile) return;
      if (e.key === 'ArrowLeft') {
        handleNext('pass');
      } else if (e.key === 'ArrowRight') {
        handleNext('like');
      } else if (e.key === 'ArrowUp' && onOpenDetail) {
        onOpenDetail(currentProfile);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentProfile, allProfiles.length, onOpenDetail]);

  const firstName = currentUser?.name ? currentUser.name.split(' ')[0] : 'there';

  return (
    <div className="screen-content">
      <RedesignedTopbar
        title={`Good afternoon, ${firstName}`}
        subtitle={allProfiles.length > 0 ? "Discover classmates and singles on campus." : "Welcome to Cupid."}
        onFilter={() => setFiltersOpen(true)}
      />

      <div className="discover-layout">
        <section className="discovery-stage">
          {notice && (
            <div className="toast">
              <Icon name="check" size={15} />
              {notice}
            </div>
          )}

          {allProfiles.length === 0 ? (
            /* Clean Empty State when no real external profiles exist yet */
            <div
              style={{
                width: 'min(420px, 94%)',
                minHeight: '440px',
                borderRadius: '24px',
                background: 'var(--paper, #fffdfa)',
                border: '1px solid var(--line, #e9e2e3)',
                padding: '40px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                boxShadow: '0 10px 30px rgba(0,0,0,0.04)'
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(238, 121, 109, 0.15)',
                  color: 'var(--coral, #ee796d)',
                  display: 'grid',
                  placeItems: 'center',
                  marginBottom: '16px'
                }}
              >
                <Icon name="heart" size={28} />
              </div>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', fontWeight: 700, margin: '0 0 8px', color: 'var(--ink, #281522)' }}>
                No other profiles yet
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--muted, #81737b)', maxWidth: '300px', lineHeight: 1.5, margin: '0 0 24px' }}>
                You are one of the first on Cupid! When classmates sign up and build their profiles, they will appear here.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '240px' }}>
                <button
                  type="button"
                  onClick={onNavigateProfile}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '12px',
                    background: 'var(--plum, #42152f)',
                    color: 'white',
                    border: 0,
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Edit My Profile & Photo
                </button>
                <button
                  type="button"
                  onClick={onNavigateWall}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '12px',
                    background: 'transparent',
                    color: 'var(--plum, #42152f)',
                    border: '1px solid var(--line, #e9e2e3)',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Visit Campus Wall
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Stacked background preview */}
              {nextProfile && (
                <div className="deck-card behind-card">
                  {nextProfile.photoUrl || nextProfile.photo ? (
                    <img src={nextProfile.photoUrl || nextProfile.photo} alt="" />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #42152f, #6b274e)' }} />
                  )}
                </div>
              )}

              {/* Active Profile Card */}
              {currentProfile && (
                <article
                  className="deck-card main-card"
                  key={currentProfile.id}
                  onClick={() => onOpenDetail && onOpenDetail(currentProfile)}
                  style={{ cursor: 'pointer' }}
                >
                  {currentProfile.photoUrl || currentProfile.photo ? (
                    <img
                      src={currentProfile.photoUrl || currentProfile.photo}
                      alt={currentProfile.name || 'Campus Profile'}
                    />
                  ) : (
                    /* Initial Avatar Fallback when user hasn't uploaded a photo */
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, #42152f 0%, #281522 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        padding: '30px'
                      }}
                    >
                      <div
                        style={{
                          width: '100px',
                          height: '100px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #ee796d, #6b274e)',
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: '40px',
                          fontWeight: 800,
                          marginBottom: '16px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
                        }}
                      >
                        {currentProfile.name ? currentProfile.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 600, opacity: 0.8 }}>No photo uploaded</span>
                    </div>
                  )}

                  <div className="deck-overlay" />

                  <div className="profile-topline" onClick={(e) => e.stopPropagation()}>
                    <span>
                      <i /> Verified Student
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSaved((ids) =>
                          ids.includes(currentProfile.id)
                            ? ids.filter((id) => id !== currentProfile.id)
                            : [...ids, currentProfile.id],
                        )
                      }
                      className={saved.includes(currentProfile.id) ? "saved" : ""}
                      aria-label="Save profile"
                    >
                      <Icon name="bookmark" size={19} />
                    </button>
                  </div>

                  <div className="deck-copy">
                    <div className="active-now">
                      <i /> On Campus
                    </div>
                    <h2>
                      {currentProfile.name || 'Campus Student'}, {currentProfile.age || 20}
                      <span>
                        <Icon name="check" size={11} />
                      </span>
                    </h2>
                    <p className="major">
                      {currentProfile.major ? `${currentProfile.major} · ${currentProfile.year || 'Student'}` : (currentProfile.college || 'College Student')}
                    </p>

                    {Array.isArray(currentProfile.interests) && currentProfile.interests.length > 0 && (
                      <div className="interest-row">
                        {currentProfile.interests.map((interest) => (
                          <span key={interest}>{interest}</span>
                        ))}
                      </div>
                    )}

                    {currentProfile.bio && (
                      <div className="prompt">
                        <small>{currentProfile.promptKey || "About me"}</small>
                        <p>“{currentProfile.promptAnswer || currentProfile.bio}”</p>
                      </div>
                    )}
                  </div>
                </article>
              )}

              {/* Action Buttons */}
              <div className="swipe-actions">
                <button
                  className="round-action undo"
                  aria-label="Previous profile"
                  onClick={handleUndo}
                  type="button"
                >
                  <Icon name="undo" />
                </button>
                <button
                  className="round-action pass"
                  aria-label="Pass"
                  onClick={() => handleNext("pass")}
                  type="button"
                >
                  <Icon name="x" size={26} />
                </button>
                <button
                  className="round-action like"
                  aria-label="Like"
                  onClick={() => handleNext("like")}
                  type="button"
                >
                  <Icon name="heart" size={25} />
                </button>
                <button
                  className="round-action message"
                  aria-label="Send message"
                  onClick={() => currentProfile && onMessage(currentProfile.id)}
                  type="button"
                >
                  <Icon name="message" size={20} />
                </button>
              </div>

              <p className="key-hint">
                <kbd>←</kbd> pass <kbd>→</kbd> like <kbd>↑</kbd> view profile
              </p>
            </>
          )}
        </section>

        {/* Right Rail with only real data */}
        <RightRail
          onMessage={onMessage}
          likedProfiles={likedProfiles}
          activeChats={activeChats}
          totalCampusCount={allProfiles.length}
        />
      </div>

      {/* Filter Modal */}
      {filtersOpen && (
        <div className="modal-backdrop" onClick={() => setFiltersOpen(false)}>
          <div className="filter-panel" onClick={(e) => e.stopPropagation()}>
            <div className="panel-head">
              <div>
                <p>Discovery settings</p>
                <h2>Fine-tune your matches</h2>
              </div>
              <button onClick={() => setFiltersOpen(false)} type="button">
                <Icon name="x" />
              </button>
            </div>

            <label>
              Age range <strong>18 — 26</strong>
              <input type="range" min="18" max="35" defaultValue="25" />
            </label>

            <div className="filter-group">
              <p>Show me</p>
              <div>
                <button type="button" className="selected">Everyone</button>
                <button type="button">Women</button>
                <button type="button">Men</button>
              </div>
            </div>

            <button className="apply-filter" onClick={() => setFiltersOpen(false)} type="button">
              Show matches
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
