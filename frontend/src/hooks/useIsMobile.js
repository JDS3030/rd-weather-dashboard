import { useState, useEffect } from 'react';

/**
 * Retorna true cuando el viewport es menor al breakpoint dado (default 768px).
 * SSR-safe — retorna false si window no existe.
 * Actualiza con debounce de 100ms en resize.
 */
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    let timer;
    function handleResize() {
      clearTimeout(timer);
      timer = setTimeout(() => setIsMobile(window.innerWidth < breakpoint), 100);
    }
    window.addEventListener('resize', handleResize);
    return () => { clearTimeout(timer); window.removeEventListener('resize', handleResize); };
  }, [breakpoint]);

  return isMobile;
}
