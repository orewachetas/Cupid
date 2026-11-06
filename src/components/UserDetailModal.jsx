import React, { useState } from 'react';
import { X, Heart, MessageCircle, MapPin, BookOpen, Sparkles, Send, ShieldCheck, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useUser } from '../context/UserContext';
import { getAvatarBadge } from '../data/mockUsers';

export default function UserDetailModal({ profile, onClose }) {
  const { likedIds = [], toggleLike, setActiveChatUser, sendMessage } = useUser();
  const [quickMsg, setQuickMsg] = useState('');
  const [sentNotice, setSentNotice] = useState(false);

  if (!profile) return null;

  const isLiked = Array.isArray(likedIds) && likedIds.includes(profile.id);
  const badge = getAvatarBadge(profile.name || '', profile.gender || 'Male');
  const profilePhoto = profile.photoUrl || profile.photo;

  const handleLike = () => {
    toggleLike(profile.id);
    if (!isLiked) {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    }
  };

  const handleSendQuickMsg = async (e) => {
    e.preventDefault();
    if (!quickMsg.trim()) return;
    await sendMessage(profile.id, quickMsg);
    setQuickMsg('');
    setSentNotice(true);
    setTimeout(() => {
      setSentNotice(false);
      onClose();
      setActiveChatUser(profile.id);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#16161D] rounded-3xl shadow-2xl border border-cupid-primary/30 overflow-hidden my-8 animate-heart-pop">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Full profile portrait over a soft, blurred version of the same photo */}
        <div className={`relative h-64 w-full bg-gradient-to-tr ${badge.gradient} flex items-center justify-center p-6 text-white overflow-hidden`}>

          {/* Blurred Background Image */}
          {profilePhoto && (
            <div className="absolute inset-0 z-0">
              <img src={profilePhoto} alt="" aria-hidden="true" className="w-full h-full object-cover blur-2xl scale-125 opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10"></div>
            </div>
          )}

          <div className={`relative z-10 flex items-center justify-center overflow-hidden shadow-2xl ${profilePhoto ? 'w-36 h-44 rounded-3xl border-2 border-white/70 bg-white/10' : 'w-28 h-28 rounded-full border-4 border-white/40 bg-white/20 backdrop-blur-md text-5xl font-black'}`}>
            {profilePhoto ? (
              <img src={profilePhoto} alt={`${profile.name}'s profile`} className="w-full h-full object-cover" />
            ) : (
              badge.initial
            )}
          </div>

          {/* Title Badges over Photo */}
          <div className="absolute bottom-4 left-6 right-6 text-white z-10 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-extrabold tracking-tight">{profile.name}, {profile.age || 20}</h2>
                <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase ${profile.relationshipStatus === 'Single'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-cupid-primary text-white'
                  }`}>
                  {profile.relationshipStatus}
                </span>
              </div>
              <p className="text-sm font-semibold text-purple-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-white" />
                {profile.major || 'College Student'} ({profile.year || 'Junior'})
              </p>
            </div>

            <button
              onClick={handleLike}
              className={`p-3 rounded-2xl shadow-xl transition-all transform hover:scale-110 ${isLiked ? 'bg-rose-500 text-white' : 'bg-white/20 backdrop-blur-md text-white hover:bg-white/40'
                }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-white' : ''}`} />
            </button>
          </div>

        </div>

        {/* Modal Main Body */}
        <div className="p-6 space-y-6">

          {/* Info Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

            <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#0B0B0E] border border-gray-100 dark:border-purple-900/40">
              <span className="text-[10px] font-extrabold uppercase text-gray-500 dark:text-gray-400 block">Gender</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {profile.gender === 'Male' ? '👦 Male' : profile.gender === 'Female' ? '👧 Female' : '✨ Non-Binary'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#0B0B0E] border border-gray-100 dark:border-purple-900/40">
              <span className="text-[10px] font-extrabold uppercase text-gray-500 dark:text-gray-400 block">Looking For</span>
              <span className="text-sm font-bold text-cupid-primary dark:text-purple-300">
                {profile.lookingFor || 'Friendship'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#0B0B0E] border border-gray-100 dark:border-purple-900/40 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-extrabold uppercase text-gray-500 dark:text-gray-400 block">Status</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                Campus Verified
              </span>
            </div>

          </div>

          {/* Bio */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-purple-300 mb-1.5">
              About Student
            </h4>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-relaxed p-4 rounded-2xl bg-gray-50 dark:bg-[#0B0B0E] border border-gray-100 dark:border-purple-900/40">
              {profile.bio || "Campus student ready to make connections!"}
            </p>
          </div>

          {/* Hobbies & Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-purple-300 mb-2">
                Interests & Passions
              </h4>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-950/50 text-cupid-primary dark:text-purple-300 text-xs font-bold border border-cupid-primary/20"
                  >
                    #{interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quick Direct Live Message Bar */}
          <div className="pt-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-purple-300 mb-2 flex items-center justify-between">
              <span>Send Live Message to {profile.name.split(' ')[0]}</span>
              <span className="text-[10px] text-emerald-500 font-bold">🟢 Active Now</span>
            </h4>

            {sentNotice ? (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                <span>Live message sent! Opening chat...</span>
              </div>
            ) : (
              <form onSubmit={handleSendQuickMsg} className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Say hi live to ${profile.name.split(' ')[0]}...`}
                  value={quickMsg}
                  onChange={(e) => setQuickMsg(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-2xl bg-gray-50 dark:bg-[#0B0B0E] border border-gray-200 dark:border-purple-900/50 text-gray-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-cupid-primary focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-3 rounded-2xl bg-cupid-primary hover:bg-cupid-primaryHover text-white font-extrabold text-sm shadow-md shadow-cupid-primary/30 flex items-center gap-1.5 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
