import React, { useState } from 'react';
import { Send, X, MessageSquare, User, Heart, Sparkles, CheckCheck, Smile, Coffee, BookOpen } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { getAvatarBadge } from '../data/mockUsers';

export default function ChatDrawer({ isOpen, onClose }) {
  const { profiles = [], activeChatUser, setActiveChatUser, chats = {}, sendMessage, currentUser = {} } = useUser();
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  const validProfiles = Array.isArray(profiles) ? profiles.filter(p => p && typeof p === 'object') : [];

  // Active target user
  const targetUser = validProfiles.find(p => p.id === activeChatUser) || validProfiles[0] || null;

  const chatId = currentUser?.uid && targetUser?.id ? [currentUser.uid, targetUser.id].sort().join('_') : '';
  const chatMessages = (chatId && Array.isArray(chats?.[chatId])) ? chats[chatId] : [];

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !targetUser) return;
    sendMessage(targetUser.id, inputText);
    setInputText('');
  };

  const sendQuickPhrase = (phrase) => {
    if (targetUser) {
      sendMessage(targetUser.id, phrase);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-[#16161D] h-[100dvh] shadow-2xl flex flex-col md:flex-row border-l border-cupid-primary/30 overflow-hidden">
        
        {/* Left Side: Real Campus Contacts */}
        <div className="hidden w-full md:w-72 bg-gray-50 dark:bg-[#0B0B0E] border-r border-gray-200 dark:border-purple-900/40 md:flex flex-col h-full shrink-0">
          
          {/* Contacts Header */}
          <div className="p-4 border-b border-gray-200 dark:border-purple-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-cupid-primary" />
              <h3 className="font-extrabold text-base text-gray-900 dark:text-white">Live Campus Chats</h3>
            </div>
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {profiles.length === 0 ? (
              <div className="p-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
                No active users yet. Invite campus friends to join!
              </div>
            ) : (
              profiles.map((person) => {
                const isActive = person.id === targetUser?.id;
                const badge = getAvatarBadge(person.name, person.gender);

                return (
                  <div
                    key={person.id}
                    onClick={() => setActiveChatUser(person.id)}
                    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${
                      isActive
                        ? 'bg-cupid-primary text-white shadow-md shadow-cupid-primary/30'
                        : 'hover:bg-gray-200/60 dark:hover:bg-white/5 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${badge.gradient} flex items-center justify-center text-white font-extrabold text-sm shadow-sm shrink-0`}>
                      {person.photoUrl || person.photo ? (
                        <img src={person.photoUrl || person.photo} alt={`${person.name}'s profile`} className="w-full h-full rounded-2xl object-cover" />
                      ) : badge.initial}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="text-xs font-bold truncate">{person.name}</h4>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                          person.relationshipStatus === 'Single'
                            ? isActive ? 'bg-emerald-400 text-black' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : isActive ? 'bg-purple-300 text-black' : 'bg-purple-500/20 text-cupid-primary dark:text-purple-300'
                        }`}>
                          {person.relationshipStatus}
                        </span>
                      </div>
                      <p className={`text-[11px] truncate ${isActive ? 'text-purple-100' : 'text-gray-500 dark:text-gray-400'}`}>
                        Click to message live...
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Right Side: Active Live Message Thread */}
        {targetUser ? (
          <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#16161D]">
            
            {/* Thread Header */}
            <div className="p-4 border-b border-gray-100 dark:border-purple-900/30 flex items-center justify-between bg-white/80 dark:bg-[#16161D]/80 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${getAvatarBadge(targetUser.name, targetUser.gender).gradient} flex items-center justify-center text-white font-black text-sm shadow-sm`}>
                  {targetUser.photoUrl || targetUser.photo ? (
                    <img src={targetUser.photoUrl || targetUser.photo} alt={`${targetUser.name}'s profile`} className="w-full h-full rounded-2xl object-cover" />
                  ) : getAvatarBadge(targetUser.name, targetUser.gender).initial}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">{targetUser.name}</h3>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg ${
                      targetUser.relationshipStatus === 'Single' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-purple-500/20 text-cupid-primary dark:text-purple-300'
                    }`}>
                      {targetUser.relationshipStatus}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-gray-500 dark:text-purple-300">
                    {targetUser.major || 'College Student'}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 dark:bg-[#0B0B0E]/50">
              
              <div className="text-center my-4">
                <span className="px-3 py-1 rounded-full bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400 text-[10px] font-extrabold uppercase tracking-wider">
                  Live Real-Time Conversation with {targetUser?.name ? targetUser.name.split(' ')[0] : 'Student'}
                </span>
              </div>

              {chatMessages.length === 0 ? (
                <div className="text-center text-xs font-semibold text-gray-400 py-8">
                  No messages yet. Send a message to start live chatting!
                </div>
              ) : (
                chatMessages.map((msg, idx) => {
                  const isMe = msg.senderId === currentUser.uid;
                  const msgUser = isMe ? currentUser : targetUser;
                  const badge = getAvatarBadge(msgUser?.name || 'User', msgUser?.gender || 'Male');
                  
                  return (
                    <div
                      key={msg.id || idx}
                      className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    >
                      <div className={`flex gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        
                        {/* Avatar */}
                        {msgUser?.photoUrl || msgUser?.photo ? (
                          <img src={msgUser.photoUrl || msgUser.photo} alt={`${msgUser?.name || 'User'}'s profile`} className="w-8 h-8 rounded-full object-cover shrink-0 shadow-sm border border-gray-200 dark:border-purple-900/40" />
                        ) : (
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${badge.gradient} flex items-center justify-center text-white font-extrabold text-xs shrink-0 shadow-sm`}>
                            {badge.initial}
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                              isMe
                                ? 'bg-cupid-primary text-white rounded-tr-sm'
                                : 'bg-white dark:bg-[#22222E] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-purple-900/40 rounded-tl-sm'
                            }`}
                          >
                            {msg.text}
                          </div>
                          <span className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 mt-1 px-1">
                            {msg.time} {isMe && '✓✓'}
                          </span>
                        </div>
                        
                      </div>
                    </div>
                  );
                })
              )}

            </div>

            {/* Icebreaker Suggestions Bar */}
            <div className="p-2 bg-gray-100/70 dark:bg-[#0B0B0E]/70 flex items-center gap-1.5 overflow-x-auto border-t border-gray-200 dark:border-purple-900/30">
              <span className="text-[10px] font-extrabold uppercase text-cupid-primary dark:text-purple-300 shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Quick Prompts:
              </span>
              {[
                'Free for coffee at the canteen? ☕️',
                'Which library floor are you studying at? 📚',
                'What classes do you have today? 🎒'
              ].map((phrase, idx) => (
                <button
                  key={idx}
                  onClick={() => sendQuickPhrase(phrase)}
                  className="px-2.5 py-1 rounded-xl bg-white dark:bg-white/10 hover:bg-cupid-primary hover:text-white text-[10px] font-bold text-gray-700 dark:text-gray-300 transition-all shrink-0 border border-gray-200 dark:border-white/10"
                >
                  {phrase}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-3 border-t border-gray-200 dark:border-purple-900/40 bg-white dark:bg-[#16161D] flex items-center gap-2">
              <input
                type="text"
                placeholder={`Type live message to ${targetUser?.name ? targetUser.name.split(' ')[0] : 'Student'}...`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 px-4 py-3 rounded-2xl bg-gray-100 dark:bg-[#0B0B0E] border border-gray-200 dark:border-purple-900/50 text-gray-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-cupid-primary focus:outline-none"
              />
              <button
                type="submit"
                className="p-3 rounded-2xl bg-cupid-primary hover:bg-cupid-primaryHover text-white font-bold shadow-md shadow-cupid-primary/30 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-500 dark:text-gray-400">
            <MessageSquare className="w-12 h-12 mb-2 text-cupid-primary" />
            <p className="text-xs font-bold">Select a user to start live chat</p>
          </div>
        )}

      </div>
    </div>
  );
}
