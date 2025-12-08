import { useEffect, useRef, useState } from 'react';

interface Size {
  width: number;
  height: number;
}

export function useElementSize<T extends HTMLElement>(): {
  ref: React.RefObject<T | null>;
  size: Size;
} {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });

    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);

  return { ref, size };
}