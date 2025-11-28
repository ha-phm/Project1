import React from 'react';
import './AlgorithmSelector.css';

const ALGORITHMS = [
  { id: 'astar', name: 'A* (A-Star)', description: 'Nhanh nhưng vẫn đảm bảo chính xác' },
  { id: 'dijkstra', name: 'Dijkstra', description: 'Đảm bảo đường đi ngắn nhất' },
  { id: 'greedyBestFirstSearch', name: 'Greedy Best-First Search', description: 'Nhanh nhưng không đảm bảo ngắn nhất' },
];

const AlgorithmSelector = ({ selectedAlgorithm, onChange, disabled }) => {
  return (
    <div className="algorithm-selector">
      <label className="algorithm-label">Chọn thuật toán:</label>
      <div className="algorithm-options">
        {ALGORITHMS.map((algo) => (
          <div
            key={algo.id}
            className={`algorithm-option ${selectedAlgorithm === algo.id ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
            onClick={() => !disabled && onChange(algo.id)}
          >
            <div className="radio-button">
              <div className={`radio-inner ${selectedAlgorithm === algo.id ? 'active' : ''}`} />
            </div>
            <div className="algorithm-info">
              <div className="algorithm-name">{algo.name}</div>
              <div className="algorithm-description">{algo.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlgorithmSelector;