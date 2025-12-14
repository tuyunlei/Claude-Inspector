
import { useLayoutEffect, useEffect, useRef } from 'react';

export function useScrollToBottom(projectId: string | null, blocksLength: number) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollModeRef = useRef<'autoBottom' | 'user'>('autoBottom');
  const lastScrollHeightRef = useRef<number>(0);
  const lastClientHeightRef = useRef<number>(0);
  const prevProjectIdRef = useRef<string | null>(projectId);
  const BOTTOM_THRESHOLD = 64;

  // Logic 1: Initial Jump / Data Change / Project Switch
  useLayoutEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const isProjectSwitch = prevProjectIdRef.current !== projectId;
    prevProjectIdRef.current = projectId;

    if (isProjectSwitch) {
      scrollModeRef.current = 'autoBottom';
    }

    const { scrollHeight, clientHeight } = el;
    lastScrollHeightRef.current = scrollHeight;
    lastClientHeightRef.current = clientHeight;

    if (scrollModeRef.current === 'autoBottom') {
      el.scrollTop = Math.max(scrollHeight - clientHeight, 0);
    }
  }, [projectId, blocksLength]);

  // Logic 2: Scroll Event Listener
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const distanceToBottom = scrollHeight - (scrollTop + clientHeight);

      if (scrollModeRef.current === 'autoBottom' && distanceToBottom > BOTTOM_THRESHOLD) {
        scrollModeRef.current = 'user';
      }
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
    };
  }, [projectId]);

  // Logic 3: ResizeObserver
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      const target = entry.target as HTMLDivElement;

      const newScrollHeight = target.scrollHeight;
      const newClientHeight = target.clientHeight;
      
      const oldScrollHeight = lastScrollHeightRef.current || 0;
      
      const delta = newScrollHeight - oldScrollHeight;

      if (delta > 0 && scrollModeRef.current === 'autoBottom') {
        const prevMaxScrollTop = Math.max(oldScrollHeight - newClientHeight, 0);
        const distanceToBottomBefore = prevMaxScrollTop - target.scrollTop;

        if (distanceToBottomBefore <= BOTTOM_THRESHOLD) {
            target.scrollTop = Math.max(newScrollHeight - newClientHeight, 0);
        }
      }

      lastScrollHeightRef.current = newScrollHeight;
      lastClientHeightRef.current = newClientHeight;
    });

    resizeObserver.observe(el);
    return () => resizeObserver.disconnect();
  }, [projectId]);

  return { scrollContainerRef };
}