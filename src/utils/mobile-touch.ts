
/**
 * Enhanced mobile touch utilities for better UX
 */

// Touch gesture detection
export interface TouchGesture {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  direction: 'left' | 'right' | 'up' | 'down' | null;
  distance: number;
  duration: number;
}

export class TouchGestureHandler {
  private startTime: number = 0;
  private startX: number = 0;
  private startY: number = 0;
  private threshold: number = 50;

  constructor(threshold: number = 50) {
    this.threshold = threshold;
  }

  handleTouchStart = (e: TouchEvent): void => {
    const touch = e.touches[0];
    this.startTime = Date.now();
    this.startX = touch.clientX;
    this.startY = touch.clientY;
  };

  handleTouchEnd = (e: TouchEvent, callbacks: {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
    onTap?: () => void;
  }): void => {
    const touch = e.changedTouches[0];
    const endTime = Date.now();
    const deltaX = touch.clientX - this.startX;
    const deltaY = touch.clientY - this.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = endTime - this.startTime;

    // Quick tap
    if (distance < 10 && duration < 300) {
      callbacks.onTap?.();
      return;
    }

    // Swipe gestures
    if (distance > this.threshold) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX > absY) {
        // Horizontal swipe
        if (deltaX > 0) {
          callbacks.onSwipeRight?.();
        } else {
          callbacks.onSwipeLeft?.();
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          callbacks.onSwipeDown?.();
        } else {
          callbacks.onSwipeUp?.();
        }
      }
    }
  };
}

// Smooth scroll utility for mobile
export const smoothScrollTo = (element: HTMLElement, top: number, duration: number = 300) => {
  const startTop = element.scrollTop;
  const distance = top - startTop;
  const startTime = performance.now();

  const animateScroll = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function for smooth animation
    const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    
    element.scrollTop = startTop + distance * easeInOutCubic(progress);
    
    if (progress < 1) {
      requestAnimationFrame(animateScroll);
    }
  };

  requestAnimationFrame(animateScroll);
};

// Prevent iOS bounce scrolling
export const preventBounceScroll = (element: HTMLElement) => {
  let startY = 0;
  
  element.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
  });
  
  element.addEventListener('touchmove', (e) => {
    const currentY = e.touches[0].clientY;
    const isScrollingUp = currentY > startY;
    const isScrollingDown = currentY < startY;
    
    if ((element.scrollTop === 0 && isScrollingUp) || 
        (element.scrollTop === element.scrollHeight - element.clientHeight && isScrollingDown)) {
      e.preventDefault();
    }
  });
};

// Enhanced button press feedback
export const addButtonFeedback = (button: HTMLButtonElement) => {
  const addActiveState = () => {
    button.style.transform = 'scale(0.96)';
    button.style.transition = 'transform 0.1s ease';
  };
  
  const removeActiveState = () => {
    button.style.transform = 'scale(1)';
  };
  
  button.addEventListener('touchstart', addActiveState);
  button.addEventListener('touchend', removeActiveState);
  button.addEventListener('touchcancel', removeActiveState);
  
  // Cleanup function
  return () => {
    button.removeEventListener('touchstart', addActiveState);
    button.removeEventListener('touchend', removeActiveState);
    button.removeEventListener('touchcancel', removeActiveState);
  };
};

// Keyboard avoidance for mobile inputs
export const handleKeyboardAvoidance = (input: HTMLInputElement) => {
  const scrollIntoViewWithOffset = () => {
    setTimeout(() => {
      const rect = input.getBoundingClientRect();
      const isKeyboardVisible = window.innerHeight < document.documentElement.clientHeight;
      
      if (isKeyboardVisible && rect.bottom > window.innerHeight * 0.5) {
        input.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 300); // Wait for keyboard animation
  };
  
  input.addEventListener('focus', scrollIntoViewWithOffset);
  
  return () => {
    input.removeEventListener('focus', scrollIntoViewWithOffset);
  };
};
