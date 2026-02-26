
import { useEffect, useState } from 'react';

/**
 * Listens to visualViewport resize events and sets a CSS custom property
 * --keyboard-viewport-height on <html> so fixed-position drawers/modals
 * can shrink when the iOS keyboard opens.
 */
export function useIOSKeyboardResize() {
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const ratio = vv.height / window.innerHeight;
      const isOpen = ratio < 0.75;
      setKeyboardOpen(isOpen);

      if (isOpen) {
        document.documentElement.style.setProperty(
          '--keyboard-viewport-height',
          `${vv.height - 16}px`
        );
      } else {
        document.documentElement.style.setProperty(
          '--keyboard-viewport-height',
          '90vh'
        );
      }
    };

    vv.addEventListener('resize', update);
    return () => {
      vv.removeEventListener('resize', update);
      document.documentElement.style.removeProperty('--keyboard-viewport-height');
    };
  }, []);

  return { keyboardOpen };
}
