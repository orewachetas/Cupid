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

  // Real contacts list: profiles that have chats OR have been liked/matched
  const realContacts = useMemo(() => {
    const chatPartnerIds = new Set([
      ...Object.keys(chats),
      ...likedIds
    ]);

    const list = [];
    allRealProfiles.forEach((p) => {
      if (chatPartnerIds.has(p.id) || chatPartnerIds.has(p.uid)) {
        const userChats = chats[p.id] || chats[p.uid] || [];
        const lastMsg = userChats[userChats.length - 1];
        list.push({
          id: p.id || p.uid,
          name: p.name || 'Campus Student',
          photoUrl: p.photoUrl || p.photo || null,
          preview: lastMsg?.text || 'Connected on campus',
          time: lastMsg?.timestamp ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
          unread: 0,
          online: true,
          major: p.major || p.college || 'College Student',
          age: p.age || 20,
          distance: p.distance || 'On campus',
          interests: Array.isArray(p.interests) ? p.interests : [],
          bio: p.bio || '',
          promptKey: p.promptKey || '',
          promptAnswer: p.promptAnswer || ''
        });
      }
    });

    return list;
  }, [allRealProfiles, chats, likedIds]);

  const [activeId, setActiveId] = useState(() => {
    if (initialContact && realContacts.some(c => c.id === initialContact)) {
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

  const activeContact = realContacts.find((c) => c.id === activeId) || realContacts[0] || null;

  // Real chat messages from context
  const activeMessages = useMemo(() => {
    if (!activeContact) return [];
    const fromContext = chats[activeContact.id] || [];
    return fromContext.map(m => ({
      from: m.sender === 'me' || m.sender === currentUser?.uid || m.senderId === currentUser?.uid ? 'me' : 'them',
      text: m.text,
      time: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'
    }));
  }, [chats, activeContact, currentUser]);

  const shownContacts = useMemo(() => {
    return realContacts.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));
  }, [realContacts, query]);

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

  if (realContacts.length === 0) {
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
