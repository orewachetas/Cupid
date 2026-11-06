import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Icon, Avatar } from './FigmaIcons';
import { useUser } from '../context/UserContext';

export default function RedesignedMessages({ initialContact, onOpenDetail, onNavigateDiscover }) {
  const { 
    currentUser, 
    profiles: contextProfiles = [], 
    chats = {}, 
    sendMessage,
    toggleLike,
    likedIds = []
  } = useUser();

  // Real external profiles only
  const allRealProfiles = useMemo(() => {
    if (!Array.isArray(contextProfiles)) return [];
    return contextProfiles.filter(p => {
      const isMe = p.id === currentUser?.uid || p.uid === currentUser?.uid || (currentUser?.email && p.email?.toLowerCase() === currentUser?.email?.toLowerCase());
      return !isMe;
    });
  }, [contextProfiles, currentUser]);

  // Real contacts list: profiles that have chats OR have been liked/matched OR is the selected initialContact
  const realContacts = useMemo(() => {
    const partnerIdMap = new Map(); // partnerId -> lastMsg

    // 1. Scan chats to identify all conversation partners
    if (chats && typeof chats === 'object') {
      Object.entries(chats).forEach(([key, msgs]) => {
        if (!Array.isArray(msgs) || msgs.length === 0) return;
        const lastMsg = msgs[msgs.length - 1];

        let partnerId = null;
        if (key.includes('_')) {
          const parts = key.split('_');
          if (parts[0] === currentUser?.uid) partnerId = parts[1];
          else if (parts[1] === currentUser?.uid) partnerId = parts[0];
          else {
            const partMsg = msgs.find(m => Array.isArray(m.participants) && m.participants.includes(currentUser?.uid));
            if (partMsg) {
              partnerId = partMsg.participants.find(id => id !== currentUser?.uid);
            }
          }
        } else {
          partnerId = key;
        }

        if (partnerId && partnerId !== currentUser?.uid) {
          partnerIdMap.set(partnerId, lastMsg);
        }
      });
    }

    // 2. Include all liked/matched profiles
    likedIds.forEach(id => {
      if (id && id !== currentUser?.uid && !partnerIdMap.has(id)) {
        partnerIdMap.set(id, null);
      }
    });

    // 3. Include initialContact if provided
    if (initialContact && initialContact !== currentUser?.uid && !partnerIdMap.has(initialContact)) {
      partnerIdMap.set(initialContact, null);
    }

    // 4. Map to profile objects
    const list = [];
    partnerIdMap.forEach((lastMsg, pId) => {
      const p = allRealProfiles.find(prof => prof.id === pId || prof.uid === pId);
      if (p) {
        list.push({
          id: p.id || p.uid,
          name: p.name || 'Campus Student',
          photoUrl: p.photoUrl || p.photo || null,
          preview: lastMsg?.text || 'Connected on campus',
          time: lastMsg?.time || (lastMsg?.timestamp ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'),
          unread: 0,
          online: true,
          major: p.major || p.college || 'College Student',
          age: p.age || 20,
          distance: p.distance || 'On campus',
          interests: Array.isArray(p.interests) ? p.interests : [],
          bio: p.bio || '',
          promptKey: p.promptKey || '',
          promptAnswer: p.promptAnswer || '',
          lastTimestamp: lastMsg?.timestamp ? (typeof lastMsg.timestamp === 'number' ? lastMsg.timestamp : Date.now()) : 0
        });
      }
    });

    // Sort by recent activity
    list.sort((a, b) => b.lastTimestamp - a.lastTimestamp);
    return list;
  }, [allRealProfiles, chats, likedIds, initialContact, currentUser?.uid]);

  const [activeId, setActiveId] = useState(() => {
    if (initialContact && allRealProfiles.some(c => c.id === initialContact || c.uid === initialContact)) {
      return initialContact;
    }
    return realContacts[0]?.id || null;
  });

  // Keep activeId in sync if initialContact changes
  useEffect(() => {
    if (initialContact) {
      setActiveId(initialContact);
    } else if (!activeId && realContacts.length > 0) {
      setActiveId(realContacts[0].id);
    }
  }, [initialContact, realContacts, activeId]);

  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const chatScrollRef = useRef(null);

  // Active contact can be in realContacts OR from allRealProfiles directly (e.g. initialContact)
  const activeContact = useMemo(() => {
    if (!activeId) return realContacts[0] || null;
    const inContacts = realContacts.find(c => c.id === activeId);
    if (inContacts) return inContacts;
    const inProfiles = allRealProfiles.find(p => p.id === activeId || p.uid === activeId);
    if (inProfiles) {
      return {
        id: inProfiles.id || inProfiles.uid,
        name: inProfiles.name || 'Campus Student',
        photoUrl: inProfiles.photoUrl || inProfiles.photo || null,
        preview: 'Say hello!',
        time: 'Now',
        unread: 0,
        online: true,
        major: inProfiles.major || inProfiles.college || 'College Student',
        age: inProfiles.age || 20,
        distance: inProfiles.distance || 'On campus',
        interests: Array.isArray(inProfiles.interests) ? inProfiles.interests : [],
        bio: inProfiles.bio || '',
        promptKey: inProfiles.promptKey || '',
        promptAnswer: inProfiles.promptAnswer || ''
      };
    }
    return realContacts[0] || null;
  }, [activeId, realContacts, allRealProfiles]);

  // Real chat messages from context with compound chatId lookup
  const activeMessages = useMemo(() => {
    if (!activeContact || !currentUser?.uid) return [];
    const compoundKey = [currentUser.uid, activeContact.id].sort().join('_');
    const msgList = chats[compoundKey] || chats[activeContact.id] || [];
    return msgList.map(m => ({
      id: m.id || `${m.timestamp}-${Math.random()}`,
      from: (m.senderId === currentUser.uid || m.sender === 'me' || m.sender === currentUser.uid) ? 'me' : 'them',
      text: m.text,
      time: m.time || (m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now')
    }));
  }, [chats, activeContact, currentUser?.uid]);

  const shownContacts = useMemo(() => {
    if (!query.trim()) return realContacts;
    const q = query.toLowerCase();
    // Search in existing contacts
    const filteredContacts = realContacts.filter((c) => c.name.toLowerCase().includes(q));
    // Also search across all other campus profiles so user can initiate chat with anyone
    const otherCampusMatches = allRealProfiles
      .filter(p => !realContacts.some(c => c.id === (p.id || p.uid)) && (p.name || '').toLowerCase().includes(q))
      .map(p => ({
        id: p.id || p.uid,
        name: p.name || 'Campus Student',
        photoUrl: p.photoUrl || p.photo || null,
        preview: 'Tap to start chat',
        time: 'Campus',
        unread: 0,
        online: true,
        major: p.major || p.college || 'College Student',
        age: p.age || 20,
        distance: p.distance || 'On campus',
        interests: Array.isArray(p.interests) ? p.interests : [],
        bio: p.bio || '',
        promptKey: p.promptKey || '',
        promptAnswer: p.promptAnswer || ''
      }));

    return [...filteredContacts, ...otherCampusMatches];
  }, [realContacts, allRealProfiles, query]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [activeMessages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!draft.trim() || !activeContact) return;

    const textToSend = draft.trim();
    setDraft('');

    if (sendMessage) {
      try {
        await sendMessage(activeContact.id, textToSend);
      } catch (err) {
        console.warn('Live send notification:', err);
      }
    }
  };

  const userPhoto = currentUser?.photoUrl || currentUser?.photo || null;

  if (realContacts.length === 0 && !activeContact) {
    return (
      <div className="screen-content">
        <div
          style={{
            minHeight: '70vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '40px 20px'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(66, 21, 47, 0.1)',
              color: 'var(--plum, #42152f)',
              display: 'grid',
              placeItems: 'center',
              marginBottom: '16px'
            }}
          >
            <Icon name="message" size={28} />
          </div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', fontWeight: 700, margin: '0 0 8px', color: 'var(--ink)' }}>
            No messages yet
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--muted)', maxWidth: '320px', lineHeight: 1.5, margin: '0 0 24px' }}>
            When you match with classmates or send messages, your conversations will show up here.
          </p>

          {allRealProfiles.length > 0 && (
            <div style={{ marginBottom: '24px', width: '100%', maxWidth: '360px' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--plum)', marginBottom: '12px' }}>
                Say hello to campus classmates:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {allRealProfiles.slice(0, 4).map(p => (
                  <button
                    key={p.id || p.uid}
                    type="button"
                    onClick={() => setActiveId(p.id || p.uid)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1px solid var(--line, #e9e2e3)',
                      background: 'var(--paper, #fff)',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <Avatar src={p.photoUrl || p.photo} name={p.name} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--ink)' }}>{p.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{p.major || 'Campus Student'}</div>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--coral)', fontWeight: 600 }}>Message</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {onNavigateDiscover && (
            <button
              type="button"
              onClick={onNavigateDiscover}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                background: 'var(--plum, #42152f)',
                color: 'white',
                border: 0,
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Find Campus Matches
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="messages-screen">
      {/* 1. Conversation List Column */}
      <section className="conversation-list">
        <div className="conversation-title">
          <div>
            <h1>Messages</h1>
            <span>{realContacts.length} active</span>
          </div>
        </div>

        <label className="message-search">
          <Icon name="search" size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations"
          />
        </label>

        <div className="contact-list">
          {shownContacts.map((contact) => (
            <button
              key={contact.id}
              className={activeContact?.id === contact.id ? 'active' : ''}
              onClick={() => setActiveId(contact.id)}
              type="button"
            >
              <Avatar src={contact.photoUrl} name={contact.name} online={contact.online} />
              <span>
                <strong>
                  {contact.name}
                  <time>{contact.time}</time>
                </strong>
                <small>{contact.preview}</small>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 2. Main Chat Panel */}
      {activeContact ? (
        <section className="chat-panel">
          <header className="chat-head">
            <Avatar src={activeContact.photoUrl} name={activeContact.name} online={activeContact.online} />
            <div>
              <h2>
                {activeContact.name}
                <span>
                  <Icon name="check" size={9} />
                </span>
              </h2>
              <p>{activeContact.online ? "On campus" : "Joined Cupid"}</p>
            </div>
            <div>
              <button
                title="View profile"
                type="button"
                onClick={() => onOpenDetail && onOpenDetail(activeContact)}
              >
                <Icon name="profile" size={19} />
              </button>
            </div>
          </header>

          <div className="chat-body" ref={chatScrollRef}>
            <div className="match-day">
              <div className="match-avatar">
                <Avatar src={activeContact.photoUrl} name={activeContact.name} />
                <span>
                  <Avatar src={userPhoto} name={currentUser?.name || 'Me'} />
                </span>
              </div>
              <h3>You connected with {activeContact.name}</h3>
              <p>Direct chat on Cupid campus network</p>
            </div>

            <div className="date-rule">
              <span>Messages</span>
            </div>

            <div className="message-flow">
              {activeMessages.length === 0 ? (
                <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--muted)', margin: '20px 0' }}>
                  Say hello to {activeContact.name} to break the ice!
                </p>
              ) : (
                activeMessages.map((msg, index) => (
                  <div className={`bubble-row ${msg.from}`} key={`${msg.time}-${index}`}>
                    {msg.from === 'them' && <Avatar src={activeContact.photoUrl} name={activeContact.name} />}
                    <div>
                      <p>{msg.text}</p>
                      <time>
                        {msg.time}
                        {msg.from === 'me' && <Icon name="check" size={11} />}
                      </time>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <form className="composer" onSubmit={handleSend}>
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
      ) : (
        <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>
          Select a conversation from the left
        </div>
      )}

      {/* 3. Right Profile Details Rail */}
      {activeContact && (
        <aside className="chat-details">
          {activeContact.photoUrl ? (
            <img className="details-photo" src={activeContact.photoUrl} alt={activeContact.name} />
          ) : (
            <div
              style={{
                width: '100%',
                height: '220px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #42152f, #ee796d)',
                display: 'grid',
                placeItems: 'center',
                color: 'white',
                marginBottom: '16px'
              }}
            >
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'grid', placeItems: 'center', fontSize: '28px', fontWeight: 800 }}>
                {activeContact.name ? activeContact.name.charAt(0).toUpperCase() : '?'}
              </div>
            </div>
          )}

          <h2>
            {activeContact.name}, {activeContact.age}
            <span>
              <Icon name="check" size={10} />
            </span>
          </h2>
          <p>{activeContact.major}</p>

          <button
            className="view-profile"
            type="button"
            onClick={() => onOpenDetail && onOpenDetail(activeContact)}
          >
            View full profile
          </button>

          {activeContact.interests && activeContact.interests.length > 0 && (
            <div className="shared">
              <p>Interests</p>
              <div>
                {activeContact.interests.map((interest) => (
                  <span key={interest}>{interest}</span>
                ))}
              </div>
            </div>
          )}

          <div className="detail-actions">
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
      )}
    </div>
  );
}
