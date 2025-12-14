// NOTE: This hook is currently unused because scrolling is handled inline in ProjectTimelineHomePage 
// to avoid "dispatcher is null" errors caused by potential "Two Reacts" issues with new file imports.

import React, { useEffect, useRef } from 'react';

/**
 * A custom hook that creates a ref for a scrollable element and automatically
 * scrolls it to the bottom whenever the provided dependencies change.
 * 
 * @param deps Dependency list that triggers the scroll (e.g. [messages.length])
 * @returns A React ref object to be attached to the scrollable container
 */
export function useAutoScrollToBottom<T extends HTMLElement>(deps: React.DependencyList) {
  const scrollRef = useRef<T>(null);

  useEffect(() => {
    if (scrollRef.current) {
      // Use requestAnimationFrame to ensure we run after layout paint
      // This helps when content size changes right before the effect
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });
    }
  }, deps);

  return scrollRef;
}