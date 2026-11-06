import React, { useState, useMemo } from 'react';
import { Icon } from './FigmaIcons';
import RedesignedTopbar from './RedesignedTopbar';
import { useUser } from '../context/UserContext';
import { DEFAULT_FIGMA_PROFILES } from '../data/figmaData';

export default function RedesignedMatches({ onChat, onOpenDetail }) {
  const { profiles: contextProfiles = [], likedIds = [] } = useUser();
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'new' | 'likes'

  const allProfiles = useMemo(() => {
    const list = contextProfiles.length > 0 ? contextProfiles : DEFAULT_FIGMA_PROFILES;
    const combined = [...list];
    // Pad to display a rich grid
    if (combined.length < 6) {
      combined.push(...DEFAULT_FIGMA_PROFILES.slice(0, 6 - combined.length));
    }
    return combined.map((p, idx) => ({
      ...p,
      match: p.match || (94 - idx * 2),
      major: p.major || 'Computer Science · Year 3',
      photoUrl: p.photoUrl || p.photo || DEFAULT_FIGMA_PROFILES[idx % DEFAULT_FIGMA_PROFILES.length].photoUrl
    }));
  }, [contextProfiles]);

  const displayedProfiles = useMemo(() => {
    if (activeTab === 'likes') {
      const likedSet = new Set(likedIds);
      const filtered = allProfiles.filter(p => likedSet.has(p.id));
      return filtered.length > 0 ? filtered : allProfiles.slice(0, 3);
    }
    if (activeTab === 'new') {
      return allProfiles.slice(0, 4);
    }
    return allProfiles;
  }, [activeTab, allProfiles, likedIds]);

  return (
    <div className="screen-content">
      <RedesignedTopbar
        title="Your matches"
        subtitle={`You’ve made ${allProfiles.length + likedIds.length} connections this month.`}
      />

      <div className="page-pad">
        <div className="section-tabs">
          <button
            className={activeTab === 'all' ? 'active' : ''}
            onClick={() => setActiveTab('all')}
            type="button"
          >
            All matches <span>{allProfiles.length}</span>
          </button>
          <button
            className={activeTab === 'new' ? 'active' : ''}
            onClick={() => setActiveTab('new')}
            type="button"
          >
            New <span>4</span>
          </button>
          <button
            className={activeTab === 'likes' ? 'active' : ''}
            onClick={() => setActiveTab('likes')}
            type="button"
          >
            Your likes <span>{likedIds.length || 2}</span>
          </button>
        </div>

        <div className="matches-grid">
          {displayedProfiles.map((person, i) => (
            <article className="match-card" key={`${person.id}-${i}`}>
              <div
                className="match-photo"
                onClick={() => onOpenDetail && onOpenDetail(person)}
                style={{ cursor: 'pointer' }}
              >
                <img src={person.photoUrl} alt={person.name} />
                <span>
                  <i /> {i < 2 ? "New match" : `${person.match}% match`}
                </span>
              </div>
              <div className="match-info">
                <h3>
                  {person.name}, {person.age || 21}
                  <span>
                    <Icon name="check" size={9} />
                  </span>
                </h3>
                <p>{person.major}</p>
                <div>
                  <button onClick={() => onChat(person.id)} type="button">
                    <Icon name="message" size={17} /> Say hello
                  </button>
                  <button
                    aria-label="More"
                    type="button"
                    onClick={() => onOpenDetail && onOpenDetail(person)}
                  >
                    <Icon name="more" size={18} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

