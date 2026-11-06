import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Icon, Avatar } from './FigmaIcons';
import RedesignedTopbar from './RedesignedTopbar';
import { useUser } from '../context/UserContext';
import { DEFAULT_FIGMA_PROFILES, DEFAULT_CONTACTS } from '../data/figmaData';

function RightRail({ onMessage, liked, profiles, contacts }) {
  return (
    <aside className="right-rail">
      <div className="rail-head">
        <div>
          <h3>New matches</h3>
          <span>{liked.length || profiles.length}</span>
        </div>
        <button type="button" onClick={() => onMessage(profiles[0]?.id)}>See all</button>
      </div>

      <div className="match-row">
        {profiles.map((person, i) => (
          <button key={person.id} onClick={() => onMessage(person.id)} type="button">
            <span className={i === 0 ? "fresh" : ""}>
              <img src={person.photoUrl || person.photo || person.image} alt={person.name} />
              {i === 0 && <i>New</i>}
            </span>
            <small>{person.name}</small>
          </button>
        ))}
      </div>

      <div className="rail-divider" />

      <div className="rail-head">
        <div>
          <h3>Messages</h3>
          <span>{contacts.filter(c => c.unread > 0).length || 2}</span>
        </div>
        <button onClick={() => onMessage(contacts[0]?.id)} type="button">View all</button>
      </div>

      <div className="mini-conversations">
        {contacts.slice(0, 4).map((contact) => (
          <button key={contact.id} onClick={() => onMessage(contact.id)} type="button">
            <Avatar src={contact.image} name={contact.name} online={contact.online} />
            <span>
              <strong>{contact.name}</strong>
              <small>{contact.preview}</small>
            </span>
            <time>{contact.time}</time>
            {contact.unread > 0 && <b>{contact.unread}</b>}
          </button>
        ))}
      </div>

      <div className="campus-pulse">
        <span>
          <Icon name="bolt" size={19} />
        </span>
        <div>
          <strong>Campus is buzzing</strong>
          <p>38 people near you are active now.</p>
        </div>
      </div>
    </aside>
  );
}

export default function RedesignedDiscover({ onMessage, onOpenDetail }) {
  const { currentUser, profiles: contextProfiles = [], likedIds = [], toggleLike } = useUser();

  // Combine default high-res curated profiles with real user-created campus profiles
  const allProfiles = useMemo(() => {
    if (!contextProfiles || contextProfiles.length === 0) {
      return DEFAULT_FIGMA_PROFILES;
    }
    // Transform context profiles to match the UI format if needed
    const normalized = contextProfiles.map((p, idx) => ({
      ...p,
      match: p.match || (95 - (idx * 3) % 20),
      distance: p.distance || `${(0.4 + (idx * 0.3)).toFixed(1)} km away`,
      prompt: p.prompt || "My ideal Sunday",
      answer: p.answer || p.bio || "Finding the best coffee spot on campus and talking about life.",
      interests: Array.isArray(p.interests) && p.interests.length > 0 ? p.interests : ['Campus Life', 'Coffee', 'Music'],
      photoUrl: p.photoUrl || p.photo || DEFAULT_FIGMA_PROFILES[idx % DEFAULT_FIGMA_PROFILES.length].photoUrl
    }));

    // Put context profiles first, then pad with default profiles if fewer than 4
    const existingIds = new Set(normalized.map(p => p.id));
    const extra = DEFAULT_FIGMA_PROFILES.filter(p => !existingIds.has(p.id));
    return [...normalized, ...extra];
  }, [contextProfiles]);

  const [index, setIndex] = useState(0);
  const [saved, setSaved] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const currentProfile = allProfiles[index % allProfiles.length];
  const nextProfile = allProfiles[(index + 1) % allProfiles.length];

  const handleNext = (action) => {
    if (action === "like") {
      toggleLike(currentProfile.id);
      setNotice(`You liked ${currentProfile.name}`);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } else {
      setNotice("Profile passed");
    }
    setTimeout(() => setNotice(""), 1800);
    setIndex((val) => (val + 1) % allProfiles.length);
  };

  const handleUndo = () => {
    setIndex((val) => (val - 1 + allProfiles.length) % allProfiles.length);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
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
        subtitle="Here are today’s best people for you."
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

          {/* Background card preview for stacked deck effect */}
          {nextProfile && (
            <div className="deck-card behind-card">
              <img src={nextProfile.photoUrl || nextProfile.photo || nextProfile.image} alt="" />
            </div>
          )}

          {/* Active Main Card */}
          {currentProfile && (
            <article
              className="deck-card main-card"
              key={currentProfile.id}
              onClick={() => onOpenDetail && onOpenDetail(currentProfile)}
              style={{ cursor: 'pointer' }}
            >
              <img
                src={currentProfile.photoUrl || currentProfile.photo || currentProfile.image}
                alt={`${currentProfile.name}, ${currentProfile.age}`}
              />
              <div className="deck-overlay" />

              <div className="profile-topline" onClick={(e) => e.stopPropagation()}>
                <span>
                  <i /> {currentProfile.match}% match
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
                  <i /> Active now
                </div>
                <h2>
                  {currentProfile.name}, {currentProfile.age}
                  <span>
                    <Icon name="check" size={11} />
                  </span>
                </h2>
                <p className="major">{currentProfile.major || `${currentProfile.year || 'Junior'} Year`}</p>
                <p className="distance">
                  <Icon name="pin" size={14} /> {currentProfile.distance}
                </p>

                <div className="interest-row">
                  {currentProfile.interests?.map((interest) => (
                    <span key={interest}>{interest}</span>
                  ))}
                </div>

                <div className="prompt">
                  <small>{currentProfile.prompt || "My ideal Sunday"}</small>
                  <p>“{currentProfile.answer || currentProfile.bio || "Coffee & spontaneous walks."}”</p>
                </div>
              </div>
            </article>
          )}

          {/* Swipe Buttons */}
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
              onClick={() => onMessage(currentProfile.id)}
              type="button"
            >
              <Icon name="message" size={20} />
            </button>
          </div>

          <p className="key-hint">
            <kbd>←</kbd> pass <kbd>→</kbd> like <kbd>↑</kbd> view profile
          </p>
        </section>

        {/* Right Rail */}
        <RightRail
          onMessage={onMessage}
          liked={likedIds}
          profiles={allProfiles}
          contacts={DEFAULT_CONTACTS}
        />
      </div>

      {/* Filter Settings Modal */}
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
              Age range <strong>19 — 25</strong>
              <input type="range" min="18" max="35" defaultValue="25" />
            </label>

            <label>
              Maximum distance <strong>8 km</strong>
              <input type="range" min="1" max="30" defaultValue="8" />
            </label>

            <div className="filter-group">
              <p>Show me</p>
              <div>
                <button type="button" className="selected">Everyone</button>
                <button type="button">Women</button>
                <button type="button">Men</button>
              </div>
            </div>

            <div className="filter-group">
              <p>Looking for</p>
              <div>
                <button type="button" className="selected">Dating</button>
                <button type="button">Friends</button>
                <button type="button">Study buddy</button>
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

