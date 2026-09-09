import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function useSwipeBack(threshold = 80) {
  const navigate = useNavigate();
  const startX = useRef(null);

  useEffect(() => {
    const handleTouchStart = (e) => {
      startX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e) => {
      if (startX.current === null) return;
      const endX = e.changedTouches[0].clientX;
      if (endX - startX.current > threshold) {
        navigate(-1);
      }
      startX.current = null;
    };
    const handleMouseDown = (e) => {
      startX.current = e.clientX;
    };
    const handleMouseUp = (e) => {
      if (startX.current === null) return;
      const endX = e.clientX;
      if (endX - startX.current > threshold) {
        navigate(-1);
      }
      startX.current = null;
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [navigate, threshold]);
}