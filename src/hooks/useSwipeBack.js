import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function useSwipeBack(threshold = 80) {
  const navigate = useNavigate();
  const startX = useRef(null);
  const startY = useRef(null);

  useEffect(() => {
    const handleTouchStart = (e) => {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
    };
    const handleTouchEnd = (e) => {
      if (startX.current === null || startY.current === null) return;
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - startX.current;
      const deltaY = Math.abs(endY - startY.current);

      // Only trigger if swipe is clearly horizontal (not a vertical scroll)
      if (deltaX > threshold && deltaX > deltaY * 1.5) {
        navigate(-1);
      }
      startX.current = null;
      startY.current = null;
    };
    const handleMouseDown = (e) => {
      startX.current = e.clientX;
      startY.current = e.clientY;
    };
    const handleMouseUp = (e) => {
      if (startX.current === null || startY.current === null) return;
      const endX = e.clientX;
      const endY = e.clientY;
      const deltaX = endX - startX.current;
      const deltaY = Math.abs(endY - startY.current);

      // Only trigger if swipe is clearly horizontal (not a vertical scroll)
      if (deltaX > threshold && deltaX > deltaY * 1.5) {
        navigate(-1);
      }
      startX.current = null;
      startY.current = null;
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