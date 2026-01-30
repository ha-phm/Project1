import { metersToKm, secondsToMinutes } from '../utils/helpers';

const BACKEND_API_URL = 'http://localhost:5000/api/route';

export const findRoute = async (startPoint, endPoint, algorithm = 'astar') => {
  if (!startPoint || !endPoint) {
    throw new Error('Vui lòng chọn cả điểm bắt đầu và điểm kết thúc');
  }

  console.log('Sending to backend:', {
    start: { lat: startPoint[0], lng: startPoint[1] },
    end: { lat: endPoint[0], lng: endPoint[1] },
    algorithm
  });

  try {
    const response = await fetch(BACKEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start: {
          lat: startPoint[0],
          lng: startPoint[1]
        },
        end: {
          lat: endPoint[0],
          lng: endPoint[1]
        },
        algorithm: algorithm,
      })
    });

    const data = await response.json();
    console.log(' Response from backend:', data);

    if (!response.ok) {
      throw new Error(data.error || 'Không thể kết nối đến dịch vụ tìm đường');
    }

    if (!data.path || data.path.length === 0) {
      throw new Error('Không tìm thấy đường đi. Vui lòng thử lại với các điểm khác.');
    }

    return {
      coordinates: data.path,
      distance: metersToKm(data.distance),
      duration: secondsToMinutes(data.duration),
      elapsedTime: data.elapsedTime,
      algorithm: data.algorithm,
      steps: data.steps,
      raw: data
    };
  } catch (error) {
    console.error(' Route finding error:', error);
    throw error;
  }
};