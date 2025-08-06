import React from 'react';
import { createPortal } from 'react-dom';

interface NicolePortalContainerProps {
  children: React.ReactNode;
  isVisible: boolean;
}

export const NicolePortalContainer: React.FC<NicolePortalContainerProps> = ({
  children,
  isVisible
}) => {
  // Get or create the portal container
  const getPortalContainer = () => {
    let container = document.getElementById('nicole-portal-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'nicole-portal-container';
      container.className = 'nicole-portal-container';
      
      // Find the main content area and insert Nicole container before it
      const mainElement = document.querySelector('main');
      if (mainElement && mainElement.parentNode) {
        mainElement.parentNode.insertBefore(container, mainElement);
      } else {
        // Fallback: append to body
        document.body.appendChild(container);
      }
    }
    return container;
  };

  if (!isVisible) {
    // Clean up portal container when not visible
    const container = document.getElementById('nicole-portal-container');
    if (container) {
      container.style.display = 'none';
    }
    return null;
  }

  const portalContainer = getPortalContainer();
  portalContainer.style.display = 'block';

  return createPortal(
    <div className="w-full bg-background border-b sticky top-[64px] z-40 shadow-sm">
      <div className="container mx-auto px-4 py-2">
        {children}
      </div>
    </div>,
    portalContainer
  );
};