import React, { useRef, useState } from 'react';
import Map from './components/Map';
import Controls from './components/Controls';
import RouteInfo from './components/RouteInfo';
import AlgorithmSelector from './components/AlgorithmSelector';
import { useMap } from './hooks/useMap';
import { findRoute } from './services/routeService';
import './App.css';

function App() {
  const mapContainerRef = useRef(null);
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('astar');

  const {
    startPoint,
    endPoint,
    setStartPoint,
    setEndPoint,
    selectingPoint,
    setSelectingPoint,
    displayRoute,
    resetMap
  } = useMap(mapContainerRef);

  const handleFindRoute = async () => {
    setLoading(true);
    setError(null);
    setRoute(null);

    try {
      const routeData = await findRoute(
        startPoint, 
        endPoint, 
        selectedAlgorithm
      );
      if (routeData.startPoint) {
      // Cập nhật state startPoint bằng tọa độ của node đã snap
      setStartPoint([routeData.startPoint.lat, routeData.startPoint.lon]);
    }
    if (routeData.endPoint) {
      // Cập nhật state endPoint bằng tọa độ của node đã snap
      setEndPoint([routeData.endPoint.lat, routeData.endPoint.lon]);
    }
      setRoute(routeData);
      displayRoute(routeData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setRoute(null);
    setError(null);
    resetMap();
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Tìm Đường Đi - Hai Bà Trưng, Hà Nội</h1>
        
        <AlgorithmSelector
          selectedAlgorithm={selectedAlgorithm}
          onChange={setSelectedAlgorithm}
          disabled={loading}
        />

        <Controls
          startPoint={startPoint}
          endPoint={endPoint}
          selectingPoint={selectingPoint}
          loading={loading}
          onSelectStart={() => setSelectingPoint('start')}
          onSelectEnd={() => setSelectingPoint('end')}
          onFindRoute={handleFindRoute}
          onReset={handleReset}
        />

        <RouteInfo
          route={route}
          error={error}
          selectingPoint={selectingPoint}
        />
      </header>

      <main className="app-main">
        <Map ref={mapContainerRef} />
      </main>
    </div>
  );
}

export default App;