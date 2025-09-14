/**
 * Accessibility utilities and hooks
 * Addresses ARIA labels, keyboard navigation, and screen reader compatibility
 */

import { useRef, useEffect, useCallback, useState } from 'react';

/**
 * ARIA live regions for screen reader announcements
 */
export const AriaLiveRegion = {
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const liveRegion = document.getElementById(`aria-live-${priority}`) || 
      (() => {
        const region = document.createElement('div');
        region.id = `aria-live-${priority}`;
        region.setAttribute('aria-live', priority);
        region.setAttribute('aria-atomic', 'true');
        region.className = 'sr-only';
        region.style.cssText = `
          position: absolute !important;
          width: 1px !important;
          height: 1px !important;
          padding: 0 !important;
          margin: -1px !important;
          overflow: hidden !important;
          clip: rect(0,0,0,0) !important;
          white-space: nowrap !important;
          border: 0 !important;
        `;
        document.body.appendChild(region);
        return region;
      })();

    liveRegion.textContent = message;
    
    // Clear after announcement to allow repeated messages
    setTimeout(() => {
      liveRegion.textContent = '';
    }, 1000);
  }
};

/**
 * Hook for managing focus trap within a modal or dialog
 */
export const useFocusTrap = (isActive: boolean = true) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLElement | null>(null);
  const lastFocusableRef = useRef<HTMLElement | null>(null);

  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];

    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="checkbox"]:not([disabled])',
      '[role="radio"]:not([disabled])'
    ].join(', ');

    return Array.from(containerRef.current.querySelectorAll(focusableSelectors))
      .filter((element) => {
        const el = element as HTMLElement;
        return el.offsetWidth > 0 && el.offsetHeight > 0 && !el.hasAttribute('hidden');
      }) as HTMLElement[];
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isActive || event.key !== 'Tab') return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }, [isActive, getFocusableElements]);

  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (isActive && event.key === 'Escape') {
      event.preventDefault();
      // Focus back to the trigger element or close the modal
      if (firstFocusableRef.current) {
        firstFocusableRef.current.focus();
      }
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      firstFocusableRef.current = focusableElements[0];
      lastFocusableRef.current = focusableElements[focusableElements.length - 1];
      
      // Focus the first element
      focusableElements[0].focus();
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isActive, handleKeyDown, handleEscapeKey, getFocusableElements]);

  return containerRef;
};

/**
 * Hook for keyboard navigation in lists and grids
 */
export const useKeyboardNavigation = (
  items: any[],
  onSelect?: (index: number) => void,
  onEscape?: () => void
) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLElement>(null);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev => {
          const next = prev < items.length - 1 ? prev + 1 : 0;
          AriaLiveRegion.announce(`Item ${next + 1} of ${items.length}`);
          return next;
        });
        break;

      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => {
          const next = prev > 0 ? prev - 1 : items.length - 1;
          AriaLiveRegion.announce(`Item ${next + 1} of ${items.length}`);
          return next;
        });
        break;

      case 'Home':
        event.preventDefault();
        setFocusedIndex(0);
        AriaLiveRegion.announce('First item');
        break;

      case 'End':
        event.preventDefault();
        setFocusedIndex(items.length - 1);
        AriaLiveRegion.announce('Last item');
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        if (focusedIndex >= 0 && onSelect) {
          onSelect(focusedIndex);
        }
        break;

      case 'Escape':
        event.preventDefault();
        if (onEscape) {
          onEscape();
        }
        break;
    }
  }, [items.length, focusedIndex, onSelect, onEscape]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { containerRef, focusedIndex, setFocusedIndex };
};

/**
 * Hook for managing ARIA expanded state
 */
export const useAriaExpanded = (initialState: boolean = false) => {
  const [isExpanded, setIsExpanded] = useState(initialState);
  const triggerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLElement>(null);

  const toggle = useCallback(() => {
    setIsExpanded(prev => {
      const newState = !prev;
      AriaLiveRegion.announce(
        newState ? 'Section expanded' : 'Section collapsed',
        'polite'
      );
      return newState;
    });
  }, []);

  const expand = useCallback(() => {
    setIsExpanded(true);
    AriaLiveRegion.announce('Section expanded', 'polite');
  }, []);

  const collapse = useCallback(() => {
    setIsExpanded(false);
    AriaLiveRegion.announce('Section collapsed', 'polite');
  }, []);

  useEffect(() => {
    if (triggerRef.current) {
      triggerRef.current.setAttribute('aria-expanded', isExpanded.toString());
    }
  }, [isExpanded]);

  return {
    isExpanded,
    toggle,
    expand,
    collapse,
    triggerRef,
    contentRef,
    ariaProps: {
      'aria-expanded': isExpanded,
      'aria-controls': contentRef.current?.id
    }
  };
};

/**
 * Color contrast utilities
 */
export const ColorContrast = {
  /**
   * Calculate relative luminance
   */
  getLuminance: (hex: string): number => {
    const rgb = hex.match(/\w\w/g);
    if (!rgb) return 0;

    const [r, g, b] = rgb.map(x => {
      const c = parseInt(x, 16) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  },

  /**
   * Calculate contrast ratio between two colors
   */
  getContrastRatio: (color1: string, color2: string): number => {
    const lum1 = ColorContrast.getLuminance(color1);
    const lum2 = ColorContrast.getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  },

  /**
   * Check if contrast meets WCAG standards
   */
  meetsWCAG: (color1: string, color2: string, level: 'AA' | 'AAA' = 'AA'): boolean => {
    const ratio = ColorContrast.getContrastRatio(color1, color2);
    return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
  },

  /**
   * Get accessible text color for background
   */
  getAccessibleTextColor: (backgroundColor: string): string => {
    const whiteContrast = ColorContrast.getContrastRatio(backgroundColor, '#ffffff');
    const blackContrast = ColorContrast.getContrastRatio(backgroundColor, '#000000');
    
    return whiteContrast > blackContrast ? '#ffffff' : '#000000';
  }
};

/**
 * ARIA attributes builder
 */
export const AriaBuilder = {
  /**
   * Build ARIA props for form fields
   */
  formField: (
    labelId?: string,
    errorId?: string,
    helpTextId?: string,
    required: boolean = false
  ) => ({
    'aria-labelledby': labelId,
    'aria-describedby': [errorId, helpTextId].filter(Boolean).join(' ') || undefined,
    'aria-required': required || undefined,
    'aria-invalid': errorId ? 'true' : undefined
  }),

  /**
   * Build ARIA props for buttons
   */
  button: (
    label: string,
    pressed?: boolean,
    expanded?: boolean,
    controls?: string
  ) => ({
    'aria-label': label,
    'aria-pressed': pressed !== undefined ? pressed.toString() : undefined,
    'aria-expanded': expanded !== undefined ? expanded.toString() : undefined,
    'aria-controls': controls
  }),

  /**
   * Build ARIA props for dialogs
   */
  dialog: (
    labelledBy: string,
    describedBy?: string,
    modal: boolean = true
  ) => ({
    role: 'dialog',
    'aria-modal': modal.toString(),
    'aria-labelledby': labelledBy,
    'aria-describedby': describedBy
  }),

  /**
   * Build ARIA props for lists
   */
  list: (itemCount: number, multiselectable: boolean = false) => ({
    role: 'list',
    'aria-multiselectable': multiselectable || undefined,
    'aria-setsize': itemCount.toString()
  }),

  /**
   * Build ARIA props for list items
   */
  listItem: (index: number, selected: boolean = false) => ({
    role: 'listitem',
    'aria-posinset': (index + 1).toString(),
    'aria-selected': selected || undefined
  })
};

/**
 * Screen reader utilities
 */
export const ScreenReader = {
  /**
   * Hide content from screen readers
   */
  hide: (element: HTMLElement) => {
    element.setAttribute('aria-hidden', 'true');
  },

  /**
   * Show content to screen readers
   */
  show: (element: HTMLElement) => {
    element.removeAttribute('aria-hidden');
  },

  /**
   * Create screen reader only text
   */
  onlyText: (text: string) => {
    // This is a utility function that returns JSX, but since this is a TS file,
    // we'll return the props instead and let the component handle the JSX
    return {
      className: "sr-only",
      children: text,
      "aria-hidden": false
    };
  },

  /**
   * Announce text to screen readers
   */
  announce: AriaLiveRegion.announce
};

/**
 * Keyboard event utilities
 */
export const KeyboardUtils = {
  /**
   * Check if key is actionable (Enter or Space)
   */
  isActionKey: (event: KeyboardEvent): boolean => {
    return event.key === 'Enter' || event.key === ' ';
  },

  /**
   * Check if key is navigation key
   */
  isNavigationKey: (event: KeyboardEvent): boolean => {
    return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key);
  },

  /**
   * Check if key should close component
   */
  isCloseKey: (event: KeyboardEvent): boolean => {
    return event.key === 'Escape';
  },

  /**
   * Prevent default for specific keys
   */
  preventDefaultFor: (keys: string[]) => (event: KeyboardEvent) => {
    if (keys.includes(event.key)) {
      event.preventDefault();
    }
  }
};

/**
 * Focus management utilities
 */
export const FocusManager = {
  /**
   * Move focus to element by selector
   */
  moveTo: (selector: string): boolean => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
      return true;
    }
    return false;
  },

  /**
   * Restore focus to previously focused element
   */
  restore: (() => {
    let previouslyFocused: HTMLElement | null = null;

    return {
      save: () => {
        previouslyFocused = document.activeElement as HTMLElement;
      },
      restore: () => {
        if (previouslyFocused) {
          previouslyFocused.focus();
          previouslyFocused = null;
        }
      }
    };
  })(),

  /**
   * Check if element is focusable
   */
  isFocusable: (element: HTMLElement): boolean => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])'
    ];

    return focusableSelectors.some(selector => element.matches(selector)) &&
           element.offsetWidth > 0 && 
           element.offsetHeight > 0 &&
           !element.hasAttribute('hidden');
  }
};

export default {
  AriaLiveRegion,
  useFocusTrap,
  useKeyboardNavigation,
  useAriaExpanded,
  ColorContrast,
  AriaBuilder,
  ScreenReader,
  KeyboardUtils,
  FocusManager
};