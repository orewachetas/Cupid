import React from 'react';
import { Icon, Avatar } from './FigmaIcons';
import { useUser } from '../context/UserContext';

export default function RedesignedTopbar({ title, subtitle, onFilter, onAvatarClick }) {
  const { currentUser } = useUser();
  const userName = currentUser?.name || 'Student';
  const userPhoto = currentUser?.photoUrl || currentUser?.photo || null;

  return (
    <header className="app-topbar">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="top-actions">
        <button className="icon-button" aria-label="Notifications" type="button">
          <Icon name="bell" size={19} />
          <i />
        </button>
        {onFilter && (
          <button className="filter-button" onClick={onFilter} type="button">
            <Icon name="filter" size={18} /> Filters
          </button>
        )}
        <div onClick={onAvatarClick} style={{ cursor: onAvatarClick ? 'pointer' : 'default' }}>
          <Avatar src={userPhoto} name={userName} />
        </div>
      </div>
    </header>
  );
}

