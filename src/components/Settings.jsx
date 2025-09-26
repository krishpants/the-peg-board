// ================================
// File: src/components/Settings.jsx
// ================================
import React from 'react';

const Settings = ({ courtCount, playerCount, onChange }) => {
  const clamp = (val, min, max) => {
    if (Number.isNaN(val)) return min;
    if (min !== undefined && val < min) return min;
    if (max !== undefined && val > max) return max;
    return val;
  };

  const handleNumberChange = (key) => (e) => {
    const raw = e.target.value;
    const num = clamp(parseInt(raw, 10), key === 'courtCount' ? 1 : 0, 999);
    onChange({ [key]: num });
  };

  const handleStep = (key, delta) => () => {
    const current = key === 'courtCount' ? courtCount : playerCount;
    const next = clamp(current + delta, key === 'courtCount' ? 1 : 0, 999);
    onChange({ [key]: next });
  };

  return (
    <div className="settings">
      <h2>Settings</h2>
      <div className="settings__row">
        <label htmlFor="courtCount">Courts</label>
        <div className="settings__control">
          <button type="button" onClick={handleStep('courtCount', -1)}>-</button>
          <input id="courtCount" type="number" min={1} value={courtCount} onChange={handleNumberChange('courtCount')} />
          <button type="button" onClick={handleStep('courtCount', 1)}>+</button>
        </div>
      </div>

      <div className="settings__row">
        <label htmlFor="playerCount">Players</label>
        <div className="settings__control">
          <button type="button" onClick={handleStep('playerCount', -1)}>-</button>
          <input id="playerCount" type="number" min={0} value={playerCount} onChange={handleNumberChange('playerCount')} />
          <button type="button" onClick={handleStep('playerCount', 1)}>+</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;