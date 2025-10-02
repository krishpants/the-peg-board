import React, { useState, useEffect } from 'react';

const formatDuration = (milliseconds) => {
  const minutes = Math.floor(milliseconds / 60000);

  if (minutes === 0) {
    return '< 1 min';
  } else if (minutes === 1) {
    return '1 min';
  }
  return `${minutes} mins`;
};

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';

  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);

  if (minutes === 0) {
    return 'Just now';
  } else if (minutes === 1) {
    return '1 min ago';
  } else if (minutes < 60) {
    return `${minutes} mins ago`;
  } else {
    const hours = Math.floor(minutes / 60);
    if (hours === 1) {
      return '1 hour ago';
    }
    return `${hours} hours ago`;
  }
};

const TimeDisplay = ({ startTime, format = 'duration' }) => {
  const [displayTime, setDisplayTime] = useState('');

  useEffect(() => {
    if (!startTime) {
      setDisplayTime('');
      return;
    }

    const updateTime = () => {
      const now = Date.now();
      const diff = now - startTime;

      if (format === 'duration') {
        setDisplayTime(formatDuration(diff));
      } else {
        setDisplayTime(formatTimeAgo(startTime));
      }
    };

    updateTime(); // Initial update
    const interval = setInterval(updateTime, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [startTime, format]);

  if (!displayTime) return null;

  return <span className="time-display">{displayTime}</span>;
};

export default TimeDisplay;