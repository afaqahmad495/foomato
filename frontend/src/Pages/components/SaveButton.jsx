import React, { useState, useEffect } from 'react';
import { FaBookmark } from 'react-icons/fa';
import axios from 'axios';
import { useParams } from 'react-router-dom';



/**
 * SaveButton
 * Props:
 * - initialSaved: boolean (optional)
 * - onToggle: function(isSaved) (optional)
 * - disabled: boolean (optional)
 */
const SaveButton = ({ initialSaved = false, onToggle = () => {}, disabled = false, foodId = null }) => {
  const [saved, setSaved] = useState(initialSaved);

  useEffect(() => {
    setSaved(initialSaved);
  }, [initialSaved]);

  const handleClick = async (e) => {
    if (disabled) return;
    // Optimistic UI
    const next = !saved;
    setSaved(next);
    onToggle(next);

    if (!foodId) return;

    try {
      // call backend to toggle saved state
      await axios.post(`http://localhost:3000/api/food/save/${foodId}`, {}, { withCredentials: true });
    } catch (err) {
      console.error('Error toggling save:', err);
      // revert optimistic update on error
      setSaved(!next);
      onToggle(!next);
    }
  };



  return (
    <button
      onClick={handleClick}
      aria-pressed={saved}
      disabled={disabled}
      title={saved ? 'Saved' : 'Save for later'}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '44px',
        height: '44px',
        borderRadius: '999px',
        border: 'none',
        background: saved ? 'linear-gradient(135deg,#ff7a7a,#ff5a9e)' : 'rgba(255,255,255,0.08)',
        color: saved ? 'white' : 'rgba(255,255,255,0.9)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: saved ? '0 6px 18px rgba(255,90,95,0.18)' : 'none',
        transition: 'transform 0.12s ease, background 0.12s ease, box-shadow 0.12s ease',
        zIndex: 2,
      }}
    >
      <FaBookmark style={{ transform: saved ? 'scale(1.05)' : 'scale(1)', transition: 'transform 0.12s',fontSize: '24px' }} />
    </button>
  );
};

export default SaveButton;
