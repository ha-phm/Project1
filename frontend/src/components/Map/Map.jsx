import React from 'react';
import './Map.css';

const Map = React.forwardRef((props, ref) => {
  return <div ref={ref} className="map-container" />;
});

Map.displayName = 'Map';

export default Map;