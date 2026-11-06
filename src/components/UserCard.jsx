import React, { useState } from 'react';
import { Heart, MessageCircle, Sparkles, MapPin, BookOpen, User, Check, Eye } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useUser } from '../context/UserContext';
import { getAvatarBadge } from '../data/mockUsers';

export default function UserCard({ profile, onOpenDetail }) {
  const { likedIds = [], toggleLike, setActiveChatUser, currentUser = {}, setIsProfileModalOpen } = useUser();
  if (!profile) return null;

  const isLiked = Array.isArray(likedIds) && likedIds.includes(profile.id);
  const [winked, setWinked] = useState(false);
  const isSelf = Boolean(
    profile.isSelf || 
    (currentUser?.uid && (profile.id === currentUser.uid || profile.uid === currentUser.uid)) || 
    (currentUser?.name && profile.name === currentUser.name && profile.email === currentUser.email)
  );

  const badge = getAvatarBadge(profile.name || '', profile.gender || 'Male');

  const handleLikeClick = (e) => {
    e.stopPropagation();
    toggleLike(profile.id);
    if (!isLiked) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  };

  const handleWinkClick = (e) => {
    e.stopPropagation();
    setWinked(true);
    confetti({
      particleCount: 30,
      angle: 60,
      spread: 55,
      origin: { x: 0 }
    });
    setTimeout(() => setWinked(false), 2500);
  };

  const handleChatClick = (e) => {
    e.stopPropagation();
    setActiveChatUser(profile.id);
  };

  return (
    <div 
      onClick={() => onOpenDetail(profile)}
      className="group relative bg-white dark:bg-[#16161D] rounded-3xl overflow-hidden border border-cupid-primary/20 hover:border-cupid-primary/60 shadow-md hover:shadow-2xl hover:shadow-cupid-primary/20 transform hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col justify-between"
    >
      
      {/* Profile Header Banner: Custom Uploaded Photo or Gradient Avatar */}
      <div className={`relative h-56 w-full overflow-hidden ${profile.photoUrl ? 'bg-black' : `bg-gradient-to-tr ${badge.gradient}`} flex items-center justify-center text-white`}>
        
        {profile.photoUrl ? (
          <img
            src={profile.photoUrl}
            alt={profile.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-md border-4 border-white/40 flex items-center justify-center text-4xl font-black shadow-xl group-hover:scale-110 transition-transform duration-300">
            {badge.initial}
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
          
          {/* Gender Tag */}
          <span className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-black/50 backdrop-blur-md text-white border border-white/20 flex items-center gap-1">
            {profile.gender === 'Male' ? '👦 Male' : profile.gender === 'Female' ? '👧 Female' : '✨ Non-Binary'}
          </span>

          {/* Relationship Status Tag */}
          <span className={`px-3 py-1 rounded-xl text-xs font-black shadow-lg backdrop-blur-md flex items-center gap-1.5 ${
            profile.relationshipStatus === 'Single'
              ? 'bg-emerald-500/90 text-white border border-emerald-400/30'
              : 'bg-cupid-primary/90 text-white border border-purple-400/30'
          }`}>
            <span className={`w-2 h-2 rounded-full ${profile.relationshipStatus === 'Single' ? 'bg-emerald-300 animate-ping' : 'bg-purple-200'}`} />
            <span>{profile.relationshipStatus === 'Single' ? 'Single' : 'Committed'}</span>
          </span>

        </div>

        {/* Cupid Score Badge */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/50 backdrop-blur-md text-white text-xs font-bold border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>{isSelf ? '👑 You (My Profile)' : 'Real Student'}</span>
          </div>

        </div>

      </div>

      {/* Profile Details Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">

        <div>
          {/* Name & Age */}
          <div className="flex items-baseline justify-between mb-1">
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight group-hover:text-cupid-primary transition-colors flex items-center gap-2">
              <span>{profile.name}, <span className="font-semibold text-lg text-gray-600 dark:text-purple-300">{profile.age || 20}</span></span>
              {isSelf && (
                <span className="px-2 py-0.5 rounded-full bg-cupid-primary text-white text-[10px] font-black uppercase tracking-wider">
                  You
                </span>
              )}
            </h3>
          </div>

          {/* Major & Year */}
          <div className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-purple-300 mb-2">
            <BookOpen className="w-3.5 h-3.5 text-cupid-primary shrink-0" />
            <span className="truncate">{profile.major || 'College Student'} • {profile.year || 'Junior'}</span>
          </div>

          {/* Looking For Tag */}
          <div className="inline-block px-3 py-1 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-cupid-primary dark:text-purple-300 text-xs font-bold mb-2 border border-cupid-primary/20">
            Looking for: {profile.lookingFor || 'Friendship'}
          </div>

          {/* Bio Preview */}
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
            "{profile.bio || 'Excited to connect with fellow students on campus!'}"
          </p>
        </div>

        {/* Interests Tags */}
        {profile.interests && profile.interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {profile.interests.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-[10px] font-semibold"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between gap-2">
          {isSelf ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsProfileModalOpen(true);
              }}
              className="w-full py-2.5 rounded-2xl bg-cupid-primary hover:bg-cupid-primaryHover text-white font-extrabold text-xs shadow-md shadow-cupid-primary/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              <span>✏️ Edit My Profile</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleLikeClick}
                title="Like Profile"
                className={`p-2.5 rounded-2xl flex-1 flex items-center justify-center gap-1.5 font-bold text-xs transition-all ${
                  isLiked
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-white animate-heart-pop' : ''}`} />
                <span>{isLiked ? 'Liked' : 'Like'}</span>
              </button>

              <button
                onClick={handleChatClick}
                title="Send Real-Time Live Message"
                className="p-2.5 rounded-2xl flex-1 bg-cupid-primary hover:bg-cupid-primaryHover text-white font-bold text-xs shadow-md shadow-cupid-primary/30 flex items-center justify-center gap-1.5 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Live Chat</span>
              </button>

              <button
                onClick={handleWinkClick}
                title="Send Wink"
                className={`p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-cupid-primary dark:text-purple-300 font-bold text-xs hover:bg-purple-200 dark:hover:bg-purple-900/60 transition-all ${winked ? 'ring-2 ring-yellow-400 scale-105' : ''}`}
              >
                {winked ? '😉 Winked!' : '😉'}
              </button>
            </>
          )}
        </div>

      </div>

    </div>
  );
}
