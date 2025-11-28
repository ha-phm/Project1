import React from 'react';
import { MapPin, Navigation, X, Loader2 } from 'lucide-react';
import './Controls.css';

const Controls = ({
  startPoint,
  endPoint,
  selectingPoint,
  loading,
  onSelectStart,
  onSelectEnd,
  onFindRoute,
  onReset
}) => {
  return (
    <div className="controls">
      <button
        onClick={onSelectStart}
        disabled={loading}
        className={`control-btn ${selectingPoint === 'start' ? 'active start' : 'start'}`}
      >
        <MapPin size={20} />
        {startPoint ? 'Đổi điểm A' : 'Chọn điểm A'}
      </button>

      <button
        onClick={onSelectEnd}
        disabled={loading}
        className={`control-btn ${selectingPoint === 'end' ? 'active end' : 'end'}`}
      >
        <MapPin size={20} />
        {endPoint ? 'Đổi điểm B' : 'Chọn điểm B'}
      </button>

      <button
        onClick={onFindRoute}
        disabled={!startPoint || !endPoint || loading}
        className="control-btn find"
      >
        {loading ? (
          <>
            <Loader2 size={20} className="spinner" />
            Đang tìm...
          </>
        ) : (
          <>
            <Navigation size={20} />
            Tìm đường
          </>
        )}
      </button>

      <button
        onClick={onReset}
        disabled={loading}
        className="control-btn reset"
      >
        <X size={20} />
        Làm mới
      </button>
    </div>
  );
};

export default Controls;