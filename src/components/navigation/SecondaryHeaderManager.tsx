import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface SecondaryHeaderManagerProps {
  children: React.ReactNode;
  priority: number; // Lower number = higher priority in stacking
  className?: string;
  enableSticky?: boolean;
}

// Global registry for managing secondary header stack
class SecondaryHeaderRegistry {
  private static instance: SecondaryHeaderRegistry;
  private headers: Map<number, { height: number; element: HTMLElement }> = new Map();
  private subscribers: Set<() => void> = new Set();

  static getInstance() {
    if (!SecondaryHeaderRegistry.instance) {
      SecondaryHeaderRegistry.instance = new SecondaryHeaderRegistry();
    }
    return SecondaryHeaderRegistry.instance;
  }

  register(priority: number, height: number, element: HTMLElement) {
    this.headers.set(priority, { height, element });
    this.updatePositions();
  }

  unregister(priority: number) {
    this.headers.delete(priority);
    this.updatePositions();
  }

  updateHeight(priority: number, height: number) {
    const header = this.headers.get(priority);
    if (header) {
      header.height = height;
      this.updatePositions();
    }
  }

  private updatePositions() {
    let cumulativeHeight = 80; // Start after main header (80px)
    
    // Sort by priority (lower number = higher priority = closer to top)
    const sortedHeaders = Array.from(this.headers.entries())
      .sort(([a], [b]) => a - b);
    
    sortedHeaders.forEach(([priority, { height, element }]) => {
      element.style.top = `${cumulativeHeight}px`;
      cumulativeHeight += height;
    });

    this.notifySubscribers();
  }

  subscribe(callback: () => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback());
  }

  getOffsetForPriority(priority: number): number {
    let offset = 80; // Main header height
    
    const sortedHeaders = Array.from(this.headers.entries())
      .sort(([a], [b]) => a - b)
      .filter(([p]) => p < priority);
    
    sortedHeaders.forEach(([, { height }]) => {
      offset += height;
    });
    
    return offset;
  }
}

const SecondaryHeaderManager: React.FC<SecondaryHeaderManagerProps> = ({
  children,
  priority,
  className,
  enableSticky = true
}) => {
  const [topOffset, setTopOffset] = useState(80);
  const elementRef = useRef<HTMLDivElement>(null);
  const registry = SecondaryHeaderRegistry.getInstance();

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enableSticky) return;

    // Observe element height changes
    const resizeObserver = new ResizeObserver(entries => {
      const height = entries[0].contentRect.height;
      registry.updateHeight(priority, height);
    });

    resizeObserver.observe(element);

    // Initial registration
    const height = element.offsetHeight;
    registry.register(priority, height, element);

    // Subscribe to position updates
    const unsubscribe = registry.subscribe(() => {
      const newOffset = registry.getOffsetForPriority(priority);
      setTopOffset(newOffset);
    });

    return () => {
      resizeObserver.disconnect();
      registry.unregister(priority);
      unsubscribe();
    };
  }, [priority, enableSticky]);

  return (
    <div
      ref={elementRef}
      className={cn(
        enableSticky && "sticky transition-all duration-300 ease-out",
        className
      )}
      style={enableSticky ? { 
        top: `${topOffset}px`,
        zIndex: 50 - priority // Higher priority = higher z-index
      } : undefined}
    >
      {children}
    </div>
  );
};

export default SecondaryHeaderManager;