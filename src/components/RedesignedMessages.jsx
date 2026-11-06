import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Icon, Avatar } from './FigmaIcons';
import { useUser } from '../context/UserContext';
import { DEFAULT_FIGMA_PROFILES, DEFAULT_CONTACTS, DEFAULT_STARTER_MESSAGES } from '../data/figmaData';

export default function RedesignedMessages({ initialContact, onOpenDetail }) {
  const { 
    currentUser, 
    profiles: contextProfiles = [], 
    chats = {}, 
    sendMessage,
    toggleLike,
    likedIds = []
  } = useUser();

  // Build contact list from profiles + defaults
  const allContacts = useMemo(() => {
    const list = [...DEFAULT_CONTACTS];
    if (contextProfiles.length > 0) {
      contextProfiles.forEach((p, idx) => {
        if (!list.some(c => c.id === p.id)) {
          list.push({
            id: p.id,
            name: p.name || 'Campus Student',
            image: p.photoUrl || p.photo || DEFAULT_FIGMA_PROFILES[idx % DEFAULT_FIGMA_PROFILES.length].photoUrl,
            preview: 'Matched with you on campus!',
            time: '1h',
            unread: 0,
            online: true,
            major: p.major || 'Student',
            age: p.age || 21,
            distance: p.distance || 'On campus',
            interests: p.interests || ['Campus Life', 'Coffee']
          });
        }
      });
    }
    return list;
  }, [contextProfiles]);

  const [activeId, setActiveId] = useState(() => {
    if (initialContact && allContacts.some(c => c.id === initialContact)) {
      return initialContact;
    }
    return allContacts[0]?.id || 'figma-1';
  });

  const [query, setQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'unread'
  const [draft, setDraft] = useState('');
  const [localMessages, setLocalMessages] = useState(DEFAULT_STARTER_MESSAGES);
  const chatScrollRef = useRef(null);

  const activeContact = allContacts.find((c) => c.id === activeId) ?? allContacts[0];

  // Merge context messages and starter messages
  const activeMessages = useMemo(() => {
    const fromContext = chats[activeId];
    if (Array.isArray(fromContext) && fromContext.length > 0) {
      return fromContext.map(m => ({
        from: m.sender === 'me' || m.sender === currentUser?.uid ? 'me' : 'them',
        text: m.text,
        time: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'
      }));
    }
    return localMessages[activeId] || [
      { from: 'them', text: `Hey ${currentUser?.name ? currentUser.name.split(' ')[0] : 'there'}! Great to connect with you!`, time: '10:00' }
    ];
  }, [chats, activeId, localMessages, currentUser]);

  const shownContacts = useMemo(() => {
    return allContacts.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(query.toLowerCase());
      if (filterTab === 'unread') {
        return matchesSearch && c.unread > 0;
      }
      return matchesSearch;
    });
  }, [allContacts, query, filterTab]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [activeMessages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;

    const textToSend = draft.trim();
    setDraft('');

    // Update local state for immediate feedback
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLocalMessages(prev => ({
      ...prev,
      [activeId]: [
        ...(prev[activeId] || []),
        { from: 'me', text: textToSend, time: nowTime }
      ]
    }));

    // Send through context for Firestore / live sync
    if (sendMessage) {
      try {
        await sendMessage(activeId, textToSend);
      } catch (err) {
        console.warn('Live send notification:', err);
      }
    }
  };

  const activeProfileData = useMemo(() => {
    const found = contextProfiles.find(p => p.id === activeId) || DEFAULT_FIGMA_PROFILES.find(p => p.id === activeId);
    return found || DEFAULT_FIGMA_PROFILES[0];
  }, [activeId, contextProfiles]);

  const userPhoto = currentUser?.photoUrl || currentUser?.photo || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80';

  return (
    <div className="messages-screen">
      {/* 1. Conversation List Column */}
      <section className="conversation-list">
        <div className="conversation-title">
          <div>
            <h1>Messages</h1>
            <span>{allContacts.filter(c => c.unread > 0).length || 2} unread</span>
          </div>
          <button type="button" aria-label="More options">
            <Icon name="more" />
          </button>
        </div>

        <label className="message-search">
          <Icon name="search" size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations"
          />
        </label>

        <div className="conversation-tabs">
          <button
            className={filterTab === 'all' ? 'active' : ''}
            onClick={() => setFilterTab('all')}
            type="button"
          >
            All
          </button>
          <button
            className={filterTab === 'unread' ? 'active' : ''}
            onClick={() => setFilterTab('unread')}
            type="button"
          >
            Unread
          </button>
        </div>

        <div className="contact-list">
          {shownContacts.map((contact) => (
            <button
              key={contact.id}
              className={activeId === contact.id ? 'active' : ''}
              onClick={() => setActiveId(contact.id)}
              type="button"
            >
              <Avatar src={contact.image} name={contact.name} online={contact.online} />
              <span>
                <strong>
                  {contact.name}
                  <time>{contact.time}</time>
                </strong>
                <small className={contact.unread ? 'unread' : ''}>{contact.preview}</small>
              </span>
              {contact.unread > 0 && <b>{contact.unread}</b>}
            </button>
          ))}
        </div>
      </section>

      {/* 2. Main Chat Panel */}
      <section className="chat-panel">
        <header className="chat-head">
          <Avatar src={activeContact.image} name={activeContact.name} online={activeContact.online} />
          <div>
            <h2>
              {activeContact.name}
              <span>
                <Icon name="check" size={9} />
              </span>
            </h2>
            <p>{activeContact.online ? "Active now" : "Last active today"}</p>
          </div>
          <div>
            <button
              title="View profile"
              type="button"
              onClick={() => onOpenDetail && onOpenDetail(activeProfileData)}
            >
              <Icon name="profile" size={19} />
            </button>
            <button
              title="More options"
              type="button"
              onClick={() => onOpenDetail && onOpenDetail(activeProfileData)}
            >
              <Icon name="more" size={20} />
            </button>
          </div>
        </header>

        <div className="chat-body" ref={chatScrollRef}>
          <div className="match-day">
            <div className="match-avatar">
              <img src={activeContact.image} alt="" />
              <span>
                <img src={userPhoto} alt="" />
              </span>
            </div>
            <h3>You matched with {activeContact.name}</h3>
            <p>You both liked each other · Campus match</p>
          </div>

          <div className="date-rule">
            <span>Today</span>
          </div>

          <div className="message-flow">
            {activeMessages.map((msg, index) => (
              <div className={`bubble-row ${msg.from}`} key={`${msg.time}-${index}`}>
                {msg.from === 'them' && <Avatar src={activeContact.image} name="" />}
                <div>
                  <p>{msg.text}</p>
                  <time>
                    {msg.time}
                    {msg.from === 'me' && <Icon name="check" size={11} />}
                  </time>
                </div>
              </div>
            ))}
          </div>
        </div>

        <form className="composer" onSubmit={handleSend}>
          <button type="button" aria-label="Add image">
            <Icon name="image" size={19} />
          </button>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Message ${activeContact.name}...`}
          />
          <button className="send-button" aria-label="Send message" type="submit">
            <Icon name="send" size={17} />
          </button>
        </form>
      </section>

      {/* 3. Right Details Rail */}
      <aside className="chat-details">
        <button
          className="details-more"
          type="button"
          onClick={() => onOpenDetail && onOpenDetail(activeProfileData)}
        >
          <Icon name="more" />
        </button>
        <img className="details-photo" src={activeContact.image} alt={activeContact.name} />
        <h2>
          {activeContact.name}, {activeProfileData?.age || 21}
          <span>
            <Icon name="check" size={10} />
          </span>
        </h2>
        <p>{activeProfileData?.major || 'Campus Student'}</p>
        <small>
          <Icon name="pin" size={12} /> {activeProfileData?.distance || '0.5 km away'}
        </small>

        <button
          className="view-profile"
          type="button"
          onClick={() => onOpenDetail && onOpenDetail(activeProfileData)}
        >
          View full profile
        </button>

        <div className="shared">
          <p>Shared interests</p>
          <div>
            {(activeProfileData?.interests || ['Coffee walks', 'Campus Life', 'Art']).map((interest) => (
              <span key={interest}>{interest}</span>
            ))}
          </div>
        </div>

        <div className="detail-actions">
          <button type="button">Mute conversation</button>
          <button
            type="button"
            onClick={() => {
              if (toggleLike) toggleLike(activeContact.id);
            }}
          >
            Unmatch
          </button>
        </div>
      </aside>
    </div>
  );
}

