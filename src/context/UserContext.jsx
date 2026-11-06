import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  db, 
  isFirebaseConfigured,
  getFirebaseConfig,
  signInAnonymously, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  linkWithCredential,
  EmailAuthProvider,
  signInWithEmailAndPassword,
  signOut,
  deleteUser,
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  addDoc, 
  query, 
  where,
  orderBy, 
  serverTimestamp,
  updateDoc,
  deleteDoc
} from '../firebase';

const UserContext = createContext();

const sameProfileOwner = (profile, uid, email) => {
  if (!profile) return false;
  if (uid && (profile.id === uid || profile.uid === uid)) return true;
  return Boolean(email && profile.email?.toLowerCase() === email.toLowerCase());
};

const replaceProfileWithoutDuplicates = (profiles, profile) => {
  const email = profile.email?.toLowerCase();
  let hasKeptProfile = false;

  const deduped = profiles.reduce((result, existing) => {
    if (!sameProfileOwner(existing, profile.uid, email)) {
      result.push(existing);
      return result;
    }

    // A stale local/Firebase record can exist under a previous ID. Keep exactly
    // one record, always keyed to the authenticated user's current UID.
    if (!hasKeptProfile) {
      result.push({ ...existing, ...profile, id: profile.uid });
      hasKeptProfile = true;
    }
    return result;
  }, []);

  if (!hasKeptProfile) {
    deduped.push({ ...profile, id: profile.uid });
  }

  return deduped;
};

export const UserProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [isFirebaseSettingsOpen, setIsFirebaseSettingsOpen] = useState(false);

  // Current logged in user profile
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('cupid_current_user');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch (e) {}
    }
    return {
      uid: `user-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      gender: 'Male',
      relationshipStatus: 'Single',
      lookingFor: 'Girlfriend',
      major: 'Computer Science',
      year: 'Junior',
      age: 20,
      bio: 'Excited to meet awesome people on campus!',
      instagram: '@student_life',
      interests: ['Campus Fest', 'Coffee', 'Music', 'Coding'],
      isProfileComplete: false
    };
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profiles, setProfiles] = useState(() => {
    const deletedIds = JSON.parse(localStorage.getItem('cupid_deleted_user_ids') || '[]');
    const saved = localStorage.getItem('cupid_profiles');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(p => !deletedIds.includes(p.id) && !deletedIds.includes(p.uid) && !deletedIds.includes(p.email?.toLowerCase()));
        }
      } catch (e) {}
    }
    return [];
  });

  const [likedIds, setLikedIds] = useState(() => {
    const saved = localStorage.getItem('cupid_liked_ids');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeChatUser, setActiveChatUser] = useState(null);
  
  // Map of chatId -> messages array
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem('cupid_all_chats');
    return saved ? JSON.parse(saved) : {};
  });

  const [wallPosts, setWallPosts] = useState(() => {
    const saved = localStorage.getItem('cupid_wall_posts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  // Local BroadcastChannel for live multi-tab sync when running locally
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('cupid_live_channel');
      
      channel.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type === 'USER_UPDATED') {
          setProfiles(prev => {
            const updated = replaceProfileWithoutDuplicates(prev, { ...payload, uid: payload.uid || payload.id });
            localStorage.setItem('cupid_profiles', JSON.stringify(updated));
            return updated;
          });
        } else if (type === 'USER_DELETED') {
          setProfiles(prev => {
            const filtered = prev.filter(p => p.id !== payload.id && p.uid !== payload.id && p.email?.toLowerCase() !== payload.email);
            localStorage.setItem('cupid_profiles', JSON.stringify(filtered));
            return filtered;
          });
        } else if (type === 'NEW_MESSAGE') {
          setChats(prev => {
            const history = prev[payload.chatId] || [];
            const updated = { ...prev, [payload.chatId]: [...history, payload.message] };
            localStorage.setItem('cupid_all_chats', JSON.stringify(updated));
            return updated;
          });
        } else if (type === 'NEW_POST') {
          setWallPosts(prev => {
            const updated = [payload, ...prev];
            localStorage.setItem('cupid_wall_posts', JSON.stringify(updated));
            return updated;
          });
        }
      };

      return () => channel.close();
    }
  }, []);

  // 1. Firebase Auth listener (if configured)
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) return;

    try {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setFirebaseUser(user);
          const deletedIds = JSON.parse(localStorage.getItem('cupid_deleted_user_ids') || '[]');
          if (deletedIds.includes(user.uid) || (user.email && deletedIds.includes(user.email.toLowerCase()))) {
            return;
          }
          setCurrentUser(prev => ({ ...prev, uid: user.uid, email: user.email || prev.email }));
          try {
            const userDocRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
              setCurrentUser(prev => {
                const merged = { ...prev, ...docSnap.data() };
                localStorage.setItem('cupid_current_user', JSON.stringify(merged));
                return merged;
              });
            }
          } catch (err) {
            console.warn("Firestore fetch user error:", err);
          }
        } else {
          try {
            await signInAnonymously(auth);
          } catch (err) {
            console.warn("Firebase Auth error:", err);
          }
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("Firebase Auth setup error:", e);
    }
  }, []);

  // 2. Cloud Firestore Real-time Users Sync (merges live + local data)
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    try {
      const q = query(collection(db, 'users'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const deletedIds = JSON.parse(localStorage.getItem('cupid_deleted_user_ids') || '[]');
        const liveUsers = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const isDeleted = deletedIds.includes(docSnap.id) || deletedIds.includes(data.uid) || (data.email && deletedIds.includes(data.email.toLowerCase()));
          if (data.name && data.gender && data.relationshipStatus && !isDeleted) {
            liveUsers.push({ id: docSnap.id, ...data });
          }
        });

        setProfiles(prev => {
          const profileMap = new Map();
          prev.forEach(p => { 
            const isDel = deletedIds.includes(p.id) || deletedIds.includes(p.uid) || (p.email && deletedIds.includes(p.email.toLowerCase()));
            if (p.id && !isDel) profileMap.set(p.id, p); 
          });
          liveUsers.forEach(p => { 
            if (p.id && !deletedIds.includes(p.id) && !deletedIds.includes(p.uid)) {
              profileMap.set(p.id, { ...profileMap.get(p.id), ...p }); 
            }
          });
          const mergedList = Array.from(profileMap.values());
          localStorage.setItem('cupid_profiles', JSON.stringify(mergedList));
          return mergedList;
        });
      }, (err) => {
        console.warn("Firestore users sync error:", err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("Firestore query error:", e);
    }
  }, []);

  // 4. Cloud Firestore Real-time Messages Sync
  useEffect(() => {
    if (!isFirebaseConfigured || !db || !currentUser?.uid) return;

    try {
      const q = query(
        collection(db, 'messages'),
        where('participants', 'array-contains', currentUser.uid)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const loadedChats = {};
        const messagesList = [];
        snapshot.forEach((docSnap) => messagesList.push({ ...docSnap.data(), id: docSnap.id }));

        // Sort client-side by timestamp
        messagesList.sort((a, b) => {
           const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : (a.timestamp || 0);
           const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : (b.timestamp || 0);
           return timeA - timeB;
        });

        // Group into chats
        messagesList.forEach(msg => {
          if (!msg.chatId) return;
          if (!loadedChats[msg.chatId]) loadedChats[msg.chatId] = [];
          loadedChats[msg.chatId].push(msg);
        });

        if (messagesList.length > 0) {
          setChats(prev => {
            const updated = { ...prev };
            // Merge Firestore data into local state
            for (const [chatId, msgs] of Object.entries(loadedChats)) {
              updated[chatId] = msgs;
            }
            localStorage.setItem('cupid_all_chats', JSON.stringify(updated));
            return updated;
          });
        }
      }, (err) => {
        console.warn("Firestore messages sync error:", err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("Firestore messages query error:", e);
    }
  }, [currentUser?.uid]);

  // 3. Cloud Firestore Real-time Wall Posts Sync (merges live + local data)
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    try {
      const q = query(collection(db, 'posts'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const livePosts = [];
        snapshot.forEach((docSnap) => {
          livePosts.push({ id: docSnap.id, ...docSnap.data() });
        });

        if (livePosts.length > 0) {
          setWallPosts(prev => {
            const postMap = new Map();
            prev.forEach(p => { if (p.id) postMap.set(p.id, p); });
            livePosts.forEach(p => { if (p.id) postMap.set(p.id, { ...postMap.get(p.id), ...p }); });
            const mergedList = Array.from(postMap.values());
            localStorage.setItem('cupid_wall_posts', JSON.stringify(mergedList));
            return mergedList;
          });
        }
      }, (err) => {
        console.warn("Firestore posts sync error:", err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("Firestore posts query error:", e);
    }
  }, []);

  // Sync current user state to localStorage
  useEffect(() => {
    localStorage.setItem('cupid_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  // Sync profiles to localStorage
  useEffect(() => {
    localStorage.setItem('cupid_profiles', JSON.stringify(profiles));
  }, [profiles]);

  // Remove legacy copies of the signed-in user's profile. Older app releases
  // could save a profile under a temporary ID before Firebase supplied the
  // real UID, leaving duplicate cards after an update or sign-in.
  useEffect(() => {
    const currentUid = currentUser?.uid;
    const currentName = currentUser?.name?.trim().toLowerCase();
    const currentEmail = currentUser?.email?.trim().toLowerCase();
    if (!currentUid || !currentName) return;

    const staleIds = profiles
      .filter((profile) => {
        if (!profile?.id || profile.id === currentUid || profile.uid === currentUid) return false;
        const sameEmail = Boolean(currentEmail && profile.email?.toLowerCase() === currentEmail);
        const legacyNameMatch = !profile.email && profile.name?.trim().toLowerCase() === currentName;
        return sameEmail || legacyNameMatch;
      })
      .map((profile) => profile.id);

    if (staleIds.length === 0) return;

    setProfiles((previous) => {
      const cleaned = previous.filter((profile) => !staleIds.includes(profile.id));
      localStorage.setItem('cupid_profiles', JSON.stringify(cleaned));
      return cleaned;
    });

    if (isFirebaseConfigured && db) {
      staleIds.forEach((profileId) => {
        deleteDoc(doc(db, 'users', profileId)).catch((error) => {
          console.warn('Firestore legacy profile cleanup error:', error);
        });
      });
    }
  }, [currentUser?.uid, currentUser?.name, currentUser?.email, profiles]);

  // Sync chats to localStorage
  useEffect(() => {
    localStorage.setItem('cupid_all_chats', JSON.stringify(chats));
  }, [chats]);

  const updateProfile = async (updatedFields) => {
    const isComplete = Boolean(updatedFields.name?.trim() && (updatedFields.dob || updatedFields.age) && updatedFields.gender && updatedFields.relationshipStatus);
    const updated = {
      ...currentUser,
      ...updatedFields,
      uid: currentUser.uid || firebaseUser?.uid || `user-${Date.now()}`,
      isProfileComplete: isComplete,
      updatedAt: new Date().toISOString()
    };

    setCurrentUser(updated);
    localStorage.setItem('cupid_current_user', JSON.stringify(updated));

    // Update registered accounts cache
    if (updated.email) {
      try {
        const registered = JSON.parse(localStorage.getItem('cupid_registered_accounts') || '{}');
        registered[updated.email.toLowerCase()] = updated;
        localStorage.setItem('cupid_registered_accounts', JSON.stringify(registered));
      } catch (e) {}
    }

    // Broadcast locally for instant multi-tab sync
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('cupid_live_channel');
      channel.postMessage({ type: 'USER_UPDATED', payload: { id: updated.uid, ...updated } });
      channel.close();
    }

    setProfiles(prev => {
      const list = replaceProfileWithoutDuplicates(prev, { ...updated, id: updated.uid });
      localStorage.setItem('cupid_profiles', JSON.stringify(list));
      return list;
    });

    if (isFirebaseConfigured && db && updated.uid) {
      try {
        const { email, ...publicProfile } = updated;
        await setDoc(doc(db, 'users', updated.uid), publicProfile, { merge: true });
      } catch (err) {
        console.warn("Firestore setDoc user error:", err);
      }
    }
  };

  const toggleLike = async (userId) => {
    const isLikedCurrently = likedIds.includes(userId);
    const updatedLikedIds = isLikedCurrently ? likedIds.filter(id => id !== userId) : [...likedIds, userId];
    setLikedIds(updatedLikedIds);
    localStorage.setItem('cupid_liked_ids', JSON.stringify(updatedLikedIds));

    // Save likes/matches to Cloud Firestore
    if (isFirebaseConfigured && db && currentUser.uid) {
      try {
        const likeDocId = `${currentUser.uid}_${userId}`;
        if (!isLikedCurrently) {
          await setDoc(doc(db, 'likes', likeDocId), {
            fromUid: currentUser.uid,
            toUid: userId,
            timestamp: serverTimestamp()
          });
        }
      } catch (err) {
        console.warn("Firestore save like error:", err);
      }
    }
  };

  const sendMessage = async (targetUserId, text) => {
    if (!text.trim() || !currentUser.uid || !targetUserId) return;

    const chatId = [currentUser.uid, targetUserId].sort().join('_');
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.uid,
      senderName: currentUser.name || 'Student',
      text: text.trim(),
      time: timeNow,
      timestamp: Date.now()
    };

    // Update local state immediately
    setChats(prev => {
      const history = prev[chatId] || [];
      const updated = { ...prev, [chatId]: [...history, newMsg] };
      localStorage.setItem('cupid_all_chats', JSON.stringify(updated));
      return updated;
    });

    // Broadcast across browser tabs
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('cupid_live_channel');
      channel.postMessage({ type: 'NEW_MESSAGE', payload: { chatId, message: newMsg } });
      channel.close();
    }

    if (isFirebaseConfigured && db) {
      try {
        await addDoc(collection(db, 'messages'), {
          ...newMsg,
          chatId,
          participants: [currentUser.uid, targetUserId],
          timestamp: serverTimestamp()
        });
      } catch (err) {
        console.warn("Firestore addDoc chat error:", err);
      }
    }
  };

  const addWallPost = async (content, category = 'General') => {
    if (!content.trim()) return;

    const newPost = {
      id: `post-${Date.now()}`,
      author: currentUser.name ? `${currentUser.name} (${currentUser.relationshipStatus})` : 'Anonymous Student',
      avatar: currentUser.gender === 'Female' ? '👧' : '👦',
      content: content.trim(),
      likes: 0,
      time: 'Just now',
      category,
      timestamp: Date.now()
    };

    setWallPosts(prev => {
      const updated = [newPost, ...prev];
      localStorage.setItem('cupid_wall_posts', JSON.stringify(updated));
      return updated;
    });

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('cupid_live_channel');
      channel.postMessage({ type: 'NEW_POST', payload: newPost });
      channel.close();
    }

    if (isFirebaseConfigured && db) {
      try {
        await addDoc(collection(db, 'posts'), { ...newPost, authorUid: currentUser.uid, timestamp: serverTimestamp() });
      } catch (err) {
        console.warn("Firestore addDoc post error:", err);
      }
    }
  };

  const likeWallPost = async (postId) => {
    setWallPosts(prev => {
      const updated = prev.map(p => p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p);
      localStorage.setItem('cupid_wall_posts', JSON.stringify(updated));
      return updated;
    });

    if (isFirebaseConfigured && db) {
      try {
        const postRef = doc(db, 'posts', postId);
        const postObj = wallPosts.find(p => p.id === postId);
        if (postObj) {
          await updateDoc(postRef, { likes: (postObj.likes || 0) + 1 });
        }
      } catch (err) {
        console.warn("Firestore updateDoc post error:", err);
      }
    }
  };

  const saveFirebaseCredentials = (newConfig) => {
    localStorage.setItem('cupid_firebase_config', JSON.stringify(newConfig));
    window.location.reload();
  };

  // Firebase Auth Email Sign Up (Remembers registered profile permanently)
  const signupWithEmail = async (email, password, extraData = {}) => {
    let uid = `user-${Date.now()}`;
    let firebaseUserObj = null;

    if (isFirebaseConfigured && auth) {
      try {
        // The app starts guests as anonymous Firebase users. Linking that account
        // preserves its UID instead of creating a second profile on sign-up.
        const anonymousUser = auth.currentUser?.isAnonymous ? auth.currentUser : null;
        const userCredential = anonymousUser
          ? await linkWithCredential(anonymousUser, EmailAuthProvider.credential(email, password))
          : await createUserWithEmailAndPassword(auth, email, password);
        firebaseUserObj = userCredential.user;
        uid = userCredential.user.uid;
        setFirebaseUser(userCredential.user);
      } catch (fbErr) {
        if (fbErr.code === 'auth/email-already-in-use' || fbErr.code === 'auth/weak-password' || fbErr.code === 'auth/invalid-email') {
          throw fbErr;
        }
        console.warn("Firebase Auth signup notice:", fbErr);
      }
    }

    const defaultName = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ');
    const formattedName = defaultName ? defaultName.charAt(0).toUpperCase() + defaultName.slice(1) : 'Student';

    const userObj = {
      ...currentUser,
      uid,
      email,
      name: extraData.name?.trim() || formattedName,
      gender: extraData.gender || 'Male',
      relationshipStatus: extraData.relationshipStatus || 'Single',
      lookingFor: extraData.lookingFor || (extraData.gender === 'Female' ? 'Boyfriend' : 'Girlfriend'),
      major: extraData.major || 'Computer Science',
      year: extraData.year || 'Junior',
      age: extraData.age || 20,
      bio: extraData.bio || 'Excited to meet awesome people on campus!',
      instagram: extraData.instagram || `@${email.split('@')[0]}`,
      photoUrl: extraData.photoUrl || '',
      interests: ['Campus Fest', 'Coffee', 'Music', 'Coding'],
      isProfileComplete: Boolean(extraData.name?.trim()),
      updatedAt: new Date().toISOString()
    };

    // Save to active state and localStorage
    setCurrentUser(userObj);
    localStorage.setItem('cupid_current_user', JSON.stringify(userObj));
    localStorage.setItem('cupid_has_logged_in', 'true');
    localStorage.setItem('cupid_last_email', email);

    // Save to permanent registered accounts map
    try {
      const registered = JSON.parse(localStorage.getItem('cupid_registered_accounts') || '{}');
      registered[email.toLowerCase()] = userObj;
      localStorage.setItem('cupid_registered_accounts', JSON.stringify(registered));
    } catch (e) {}

    // Un-blacklist if re-registering
    try {
      const deletedIds = JSON.parse(localStorage.getItem('cupid_deleted_user_ids') || '[]');
      const cleanedDeleted = deletedIds.filter(id => id !== uid && id !== email.toLowerCase());
      localStorage.setItem('cupid_deleted_user_ids', JSON.stringify(cleanedDeleted));
    } catch (e) {}

    // Add to campus profiles
    setProfiles(prev => {
      const updated = replaceProfileWithoutDuplicates(prev, { ...userObj, id: uid });
      localStorage.setItem('cupid_profiles', JSON.stringify(updated));
      return updated;
    });

    if (isFirebaseConfigured && db && uid) {
      try {
        const { email: _email, ...publicProfile } = userObj;
        await setDoc(doc(db, 'users', uid), publicProfile, { merge: true });
      } catch (err) {
        console.warn("Firestore save new user error:", err);
      }
    }

    return userObj;
  };

  // Firebase Auth Email Login (Strictly verifies registered account)
  const loginWithEmail = async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();
    let uid = null;
    let foundProfile = null;
    let hasFirebaseProfile = false;
    let authError = null;

    if (isFirebaseConfigured && auth) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
        setFirebaseUser(userCredential.user);
        uid = userCredential.user.uid;
      } catch (fbErr) {
        authError = fbErr;
        if (fbErr.code === 'auth/user-not-found') {
          throw new Error('No account found with this email. Please sign up first!');
        } else if (fbErr.code === 'auth/wrong-password' || fbErr.code === 'auth/invalid-credential') {
          throw new Error('Incorrect password. Please try again or create a new account.');
        } else if (fbErr.code === 'auth/invalid-email') {
          throw new Error('Invalid email address format.');
        }
      }
    }

    // Check permanent registered accounts database
    let registered = {};
    try {
      registered = JSON.parse(localStorage.getItem('cupid_registered_accounts') || '{}');
      if (registered[normalizedEmail]) {
        foundProfile = registered[normalizedEmail];
      }
    } catch (e) {}

    // Check Firestore
    if (uid && isFirebaseConfigured && db) {
      try {
        const docSnap = await getDoc(doc(db, 'users', uid));
        if (docSnap.exists()) {
          hasFirebaseProfile = true;
          foundProfile = { ...foundProfile, ...docSnap.data() };
        }
      } catch (err) {
        console.warn("Firestore user fetch notice:", err);
      }
    }

    // Accounts from before the reset no longer have a profile document. Do not
    // let an old Firebase Auth record recreate a deleted Cupid profile.
    if (uid && !hasFirebaseProfile) {
      await signOut(auth).catch(() => {});
      throw new Error('This account was reset. Please create a new account to continue.');
    }

    // Check local profiles
    if (!foundProfile) {
      foundProfile = profiles.find(p => p.email?.toLowerCase() === normalizedEmail || (uid && (p.uid === uid || p.id === uid)));
    }

    // If account was NEVER registered, strictly reject login!
    if (!foundProfile && !uid) {
      throw new Error(`No account found for "${email}". You haven't registered yet — please click "Create an account" below!`);
    }

    const defaultName = normalizedEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ');
    const formattedName = defaultName ? defaultName.charAt(0).toUpperCase() + defaultName.slice(1) : 'Student';

    const userObj = {
      ...(foundProfile || {}),
      email: normalizedEmail,
      uid: uid || foundProfile?.uid || foundProfile?.id || `user-${Date.now()}`,
      name: foundProfile?.name || formattedName,
      gender: foundProfile?.gender || 'Male',
      relationshipStatus: foundProfile?.relationshipStatus || 'Single',
      lookingFor: foundProfile?.lookingFor || 'Girlfriend',
      major: foundProfile?.major || 'Computer Science',
      year: foundProfile?.year || 'Junior',
      age: foundProfile?.age || 20,
      bio: foundProfile?.bio || 'Excited to meet awesome people on campus!',
      instagram: foundProfile?.instagram || '@student_life',
      interests: foundProfile?.interests || ['Campus Fest', 'Coffee', 'Music', 'Coding'],
      isProfileComplete: Boolean(foundProfile?.isProfileComplete),
      updatedAt: new Date().toISOString()
    };

    setCurrentUser(userObj);
    localStorage.setItem('cupid_current_user', JSON.stringify(userObj));
    localStorage.setItem('cupid_has_logged_in', 'true');
    localStorage.setItem('cupid_last_email', normalizedEmail);

    try {
      registered[normalizedEmail] = userObj;
      localStorage.setItem('cupid_registered_accounts', JSON.stringify(registered));
    } catch (e) {}

    return userObj;
  };

  // Firebase Auth Phone / Custom Login
  const loginWithPhone = async (phoneNumber) => {
    const customUid = `phone-${phoneNumber.replace(/\D/g, '') || `${Date.now()}`}`;
    const userObj = { ...currentUser, uid: customUid, phone: phoneNumber };
    setCurrentUser(userObj);
    localStorage.setItem('cupid_current_user', JSON.stringify(userObj));
    localStorage.setItem('cupid_has_logged_in', 'true');
    return userObj;
  };

  // Logout
  const logoutUser = async () => {
    if (auth) {
      try {
        await signOut(auth);
      } catch (e) {
        console.warn("Firebase signOut error:", e);
      }
    }
    localStorage.removeItem('cupid_has_logged_in');
    localStorage.removeItem('cupid_current_user');
    window.location.reload();
  };

  // Delete User ID and permanently wipe all data from server, cache & feed
  const deleteUserAccount = async () => {
    const uidToDelete = currentUser?.uid || firebaseUser?.uid;
    const emailToDelete = currentUser?.email?.toLowerCase();
    const idToDelete = currentUser?.id;

    // 1. Blacklist ID & Email so it never resurfaces in discover feed, guest mode, or cache
    const deletedIds = JSON.parse(localStorage.getItem('cupid_deleted_user_ids') || '[]');
    if (uidToDelete && !deletedIds.includes(uidToDelete)) deletedIds.push(uidToDelete);
    if (idToDelete && !deletedIds.includes(idToDelete)) deletedIds.push(idToDelete);
    if (emailToDelete && !deletedIds.includes(emailToDelete)) deletedIds.push(emailToDelete);
    localStorage.setItem('cupid_deleted_user_ids', JSON.stringify(deletedIds));

    // 2. Remove from registered accounts map
    if (emailToDelete) {
      try {
        const registered = JSON.parse(localStorage.getItem('cupid_registered_accounts') || '{}');
        delete registered[emailToDelete];
        localStorage.setItem('cupid_registered_accounts', JSON.stringify(registered));
      } catch (e) {}
    }

    // 3. Immediately purge from profiles list
    setProfiles(prev => {
      const filtered = prev.filter(p => {
        if (uidToDelete && (p.uid === uidToDelete || p.id === uidToDelete)) return false;
        if (idToDelete && p.id === idToDelete) return false;
        if (emailToDelete && p.email?.toLowerCase() === emailToDelete) return false;
        return true;
      });
      localStorage.setItem('cupid_profiles', JSON.stringify(filtered));
      return filtered;
    });

    // 4. Wipe local storage keys
    localStorage.removeItem('cupid_has_logged_in');
    localStorage.removeItem('cupid_current_user');
    localStorage.removeItem('cupid_last_email');
    localStorage.removeItem('cupid_liked_ids');

    // 5. Broadcast removal across open tabs
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel('cupid_live_channel');
        channel.postMessage({ type: 'USER_DELETED', payload: { id: uidToDelete, email: emailToDelete } });
        channel.close();
      } catch (e) {}
    }

    // 6. Fast non-blocking server cleanup
    const serverCleanup = async () => {
      const tasks = [];
      if (isFirebaseConfigured && db && uidToDelete) {
        tasks.push(deleteDoc(doc(db, 'users', uidToDelete)).catch(err => console.warn("Firestore delete user notice:", err)));
      }
      if (auth && auth.currentUser) {
        tasks.push(deleteUser(auth.currentUser).catch(err => {
          console.warn("Firebase delete auth notice:", err);
          return signOut(auth).catch(() => {});
        }));
      }
      await Promise.allSettled(tasks);
    };

    const timeoutPromise = new Promise(resolve => setTimeout(resolve, 500));
    await Promise.race([serverCleanup(), timeoutPromise]);

    window.location.reload();
  };

  const removeProfileById = async (profileId) => {
    if (!profileId) return;

    // 1. Add to blacklist so it never returns
    const deletedIds = JSON.parse(localStorage.getItem('cupid_deleted_user_ids') || '[]');
    if (!deletedIds.includes(profileId)) {
      deletedIds.push(profileId);
      localStorage.setItem('cupid_deleted_user_ids', JSON.stringify(deletedIds));
    }

    // 2. Filter from profiles list
    setProfiles(prev => {
      const filtered = prev.filter(p => p.id !== profileId && p.uid !== profileId);
      localStorage.setItem('cupid_profiles', JSON.stringify(filtered));
      return filtered;
    });

    // 3. Broadcast removal across open tabs
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel('cupid_live_channel');
        channel.postMessage({ type: 'USER_DELETED', payload: { id: profileId } });
        channel.close();
      } catch (e) {}
    }

    // 4. Delete from Firestore if configured
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'users', profileId));
      } catch (err) {
        console.warn("Firestore delete profile notice:", err);
      }
    }
  };

  return (
    <UserContext.Provider value={{
      isFirebaseConfigured,
      saveFirebaseCredentials,
      isFirebaseSettingsOpen,
      setIsFirebaseSettingsOpen,
      firebaseUser,
      currentUser,
      signupWithEmail,
      loginWithEmail,
      loginWithPhone,
      logoutUser,
      deleteUserAccount,
      removeProfileById,
      updateProfile,
      isProfileModalOpen,
      setIsProfileModalOpen,
      profiles,
      likedIds,
      toggleLike,
      chats,
      sendMessage,
      activeChatUser,
      setActiveChatUser,
      wallPosts,
      addWallPost,
      likeWallPost
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
