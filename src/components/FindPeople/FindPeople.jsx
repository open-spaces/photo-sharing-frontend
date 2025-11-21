import React, { useState, useEffect } from 'react';
import './FindPeople.css';
import { getApiUrl } from '../../config/api';

const FaceCard = ({ person, onClick }) => {
  const { id, name, face_count, representative_face } = person;

  if (!representative_face) {
    return null;
  }

  const { bbox, photo_url } = representative_face;

  // Calculate the center of the face
  const faceCenterX = bbox.x + (bbox.w / 2);
  const faceCenterY = bbox.y + (bbox.h / 2);

  // Fixed circle size
  const circleSize = 150;

  return (
    <div className="face-card" onClick={() => onClick(person)}>
      <div className="face-thumbnail-container">
        <div className="face-thumbnail">
          <img
            src={photo_url}
            alt={name || `Person ${id}`}
            style={{
              objectPosition: `${faceCenterX}px ${faceCenterY}px`,
            }}
            onLoad={(e) => {
              // After image loads, calculate proper object-position as percentage
              const img = e.target;
              const naturalWidth = img.naturalWidth;
              const naturalHeight = img.naturalHeight;

              if (naturalWidth && naturalHeight) {
                // Convert pixel position to percentage
                const percentX = (faceCenterX / naturalWidth) * 100;
                const percentY = (faceCenterY / naturalHeight) * 100;

                img.style.objectPosition = `${percentX}% ${percentY}%`;
              }
            }}
          />
        </div>
      </div>
      <div className="face-info">
        <div className="face-name">
          {name || `Person ${id}`}
        </div>
        <div className="face-count">
          {face_count} {face_count === 1 ? 'photo' : 'photos'}
        </div>
      </div>
    </div>
  );
};

const FindPeople = ({ onPersonSelect }) => {
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API = getApiUrl();

  useEffect(() => {
    const fetchPersons = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/persons`);
        if (!res.ok) {
          throw new Error('Failed to fetch persons');
        }
        const data = await res.json();
        setPersons(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching persons:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPersons();
  }, [API]);

  const handlePersonClick = (person) => {
    if (onPersonSelect) {
      onPersonSelect(person);
    }
  };

  if (loading) {
    return (
      <div className="find-people-container">
        <div className="loading-message">Detecting faces...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="find-people-container">
        <div className="error-message">Error: {error}</div>
      </div>
    );
  }

  if (persons.length === 0) {
    return (
      <div className="find-people-container">
        <div className="empty-message">
          <p>No faces detected yet.</p>
          <p>Upload some photos with people to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="find-people-container">
      <div className="find-people-grid">
        {persons.map(person => (
          <FaceCard
            key={person.id}
            person={person}
            onClick={handlePersonClick}
          />
        ))}
      </div>
    </div>
  );
};

export default FindPeople;
