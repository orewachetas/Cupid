import React, { useState } from 'react';
import { Icon } from './FigmaIcons';
import RedesignedTopbar from './RedesignedTopbar';
import { useUser } from '../context/UserContext';

export default function RedesignedProfile() {
  const { currentUser, updateProfile } = useUser();
  const [editing, setEditing] = useState(false);

  // Form states initialized with currentUser data
  const [name, setName] = useState(currentUser?.name || 'Alex Morgan');
  const [age, setAge] = useState(currentUser?.age || 22);
  const [bio, setBio] = useState(currentUser?.bio || 'Film student, amateur cook, and always up for finding a new corner of the city.');
  const [college, setCollege] = useState(currentUser?.college || 'Northbridge University');
  const [major, setMajor] = useState(currentUser?.major || 'Media Studies');
  const [year, setYear] = useState(currentUser?.year || 'Year 4');
  const [interests, setInterests] = useState(
    Array.isArray(currentUser?.interests) && currentUser.interests.length > 0
      ? currentUser.interests
      : ['Film photography', 'Cooking', 'Running']
  );
  const [newInterest, setNewInterest] = useState('');
  const [showAddInterest, setShowAddInterest] = useState(false);
  const [promptKey, setPromptKey] = useState(currentUser?.promptKey || 'ideal');
  const [promptAnswer, setPromptAnswer] = useState(
    currentUser?.promptAnswer || 'A bookstore, something good to eat, and a walk with no destination.'
  );
  const [photoUrl, setPhotoUrl] = useState(
    currentUser?.photoUrl || currentUser?.photo || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=900&q=86'
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleToggleEdit = async () => {
    if (editing) {
      // Save changes
      if (updateProfile) {
        await updateProfile({
          name,
          age: Number(age) || 20,
          bio,
          college,
          major,
          year,
          interests,
          promptKey,
          promptAnswer,
          photoUrl
        });
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
    setEditing(!editing);
  };

  const handleRemoveInterest = (interestToRemove) => {
    setInterests(interests.filter(i => i !== interestToRemove));
  };

  const handleAddInterest = (e) => {
    e.preventDefault();
    if (!newInterest.trim()) return;
    if (!interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
    }
    setNewInterest('');
    setShowAddInterest(false);
  };

  // Calculate profile completion percentage
  const strength = Math.min(100, Math.round(
    (name ? 20 : 0) +
    (bio ? 20 : 0) +
    (major ? 15 : 0) +
    (interests.length >= 3 ? 20 : 10) +
    (promptAnswer ? 15 : 0) +
    (photoUrl ? 10 : 0)
  ));

  return (
    <div className="screen-content">
      <RedesignedTopbar
        title="My profile"
        subtitle="Make a great first impression."
      />

      <div className="profile-page">
        {/* Left Column: Preview Card */}
        <section className="profile-preview">
          <div className="completion">
            <span>Profile strength</span>
            <strong>{strength}%</strong>
            <div>
              <i style={{ width: `${strength}%` }} />
            </div>
            <p>{strength >= 90 ? "Your profile looks amazing!" : "Add one more prompt to stand out."}</p>
          </div>

          <article>
            <img src={photoUrl} alt={name} />
            <div>
              <h2>
                {name}, {age}
                <span>
                  <Icon name="check" size={10} />
                </span>
              </h2>
              <p>{major} · {year}</p>
            </div>
          </article>

          {editing && (
            <div style={{ marginTop: '16px', padding: '12px', background: 'white', borderRadius: '12px', border: '1px solid var(--line)' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: '6px' }}>
                Profile Photo URL
              </label>
              <input
                type="text"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                style={{ width: '100%', padding: '8px 10px', fontSize: '11px', borderRadius: '8px', border: '1px solid var(--line)' }}
              />
            </div>
          )}
        </section>

        {/* Right Column: Edit Profile Details */}
        <section className="edit-profile">
          <div className="edit-head">
            <div>
              <h2>Profile details</h2>
              <p>This is how others see you on Cupid.</p>
              {savedSuccess && (
                <span style={{ color: 'var(--green)', fontSize: '11px', fontWeight: 600, display: 'inline-block', marginTop: '4px' }}>
                  ✓ Changes saved successfully!
                </span>
              )}
            </div>
            <button onClick={handleToggleEdit} type="button">
              {editing ? "Save changes" : "Edit profile"}
            </button>
          </div>

          <div className="profile-fields">
            <div>
              <label>
                Full Name
                <input
                  disabled={!editing}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label>
                Age
                <input
                  type="number"
                  disabled={!editing}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </label>
            </div>

            <label>
              About me
              <textarea
                disabled={!editing}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
              />
            </label>

            <div>
              <label>
                College
                <input
                  disabled={!editing}
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                />
              </label>
              <label>
                Major
                <input
                  disabled={!editing}
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                />
              </label>
            </div>

            <label>
              My interests
              <div className="interest-picker">
                {interests.map((interest) => (
                  <span key={interest}>
                    {interest}
                    {editing && (
                      <button type="button" onClick={() => handleRemoveInterest(interest)}>
                        ×
                      </button>
                    )}
                  </span>
                ))}
                {editing && !showAddInterest && (
                  <button type="button" onClick={() => setShowAddInterest(true)}>
                    + Add interest
                  </button>
                )}
              </div>
              {editing && showAddInterest && (
                <form
                  onSubmit={handleAddInterest}
                  style={{ display: 'flex', gap: '8px', marginTop: '8px' }}
                >
                  <input
                    type="text"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    placeholder="New interest tag..."
                    style={{ flex: 1, padding: '6px 10px', fontSize: '11px', borderRadius: '8px', border: '1px solid var(--line)' }}
                    autoFocus
                  />
                  <button
                    type="submit"
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      background: 'var(--coral)',
                      color: 'white',
                      border: 0,
                      fontWeight: 600,
                      fontSize: '11px'
                    }}
                  >
                    Add
                  </button>
                </form>
              )}
            </label>

            <label>
              My prompt
              <select
                disabled={!editing}
                value={promptKey}
                onChange={(e) => setPromptKey(e.target.value)}
              >
                <option value="ideal">My perfect first date</option>
                <option value="sunday">My ideal Sunday</option>
                <option value="win">The way to win me over</option>
                <option value="together">Together we could</option>
                <option value="along">We'll get along if</option>
              </select>
              <textarea
                disabled={!editing}
                value={promptAnswer}
                onChange={(e) => setPromptAnswer(e.target.value)}
                rows={3}
              />
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}

