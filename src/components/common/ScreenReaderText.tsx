/**
 * Screen Reader Text Component
 * Provides text that is only visible to screen readers
 */

import React from 'react';

interface ScreenReaderTextProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Component that renders text only for screen readers
 */
export const ScreenReaderText: React.FC<ScreenReaderTextProps> = ({ 
  children, 
  className = '' 
}) => (
  <span 
    className={`sr-only ${className}`}
    style={{
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: 0,
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: 0
    }}
  >
    {children}
  </span>
);

/**
 * Component for announcing dynamic content to screen readers
 */
export const ScreenReaderAnnouncement: React.FC<{
  message: string;
  priority?: 'polite' | 'assertive';
  className?: string;
}> = ({ message, priority = 'polite', className = '' }) => (
  <div
    className={`sr-only ${className}`}
    aria-live={priority}
    aria-atomic="true"
    style={{
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: 0,
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: 0
    }}
  >
    {message}
  </div>
);

export default ScreenReaderText;