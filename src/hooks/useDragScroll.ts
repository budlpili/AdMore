import { useRef, useCallback } from 'react';

export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const state = useRef({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
  });

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    state.current.isDown = true;
    state.current.startX = e.pageX - (ref.current?.offsetLeft || 0);
    state.current.scrollLeft = ref.current?.scrollLeft || 0;
    document.body.style.userSelect = 'none';
  }, []);

  const onMouseLeave = useCallback(() => {
    state.current.isDown = false;
    document.body.style.userSelect = '';
  }, []);

  const onMouseUp = useCallback(() => {
    state.current.isDown = false;
    document.body.style.userSelect = '';
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!state.current.isDown) return;
    e.preventDefault();
    const x = e.pageX - (ref.current?.offsetLeft || 0);
    const walk = x - state.current.startX;
    if (ref.current) ref.current.scrollLeft = state.current.scrollLeft - walk;
  }, []);

  return {
    ref,
    onMouseDown,
    onMouseLeave,
    onMouseUp,
    onMouseMove,
  };
} 