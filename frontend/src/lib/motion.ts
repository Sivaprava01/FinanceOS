/**
 * Motion System Configuration for FinanceOS
 * 
 * Defines easing functions and animation variants following ui.md spec:
 * - Primary easing: cubic-bezier(0.16, 1, 0.3, 1)
 * - Durations: Fast (200ms), Normal (300ms), Slow (400ms)
 */

// Primary easing function from ui.md spec
export const EASING = {
  primary: [0.16, 1, 0.3, 1],
  easeInOut: [0.4, 0, 0.2, 1],
  easeOut: [0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
}

// Animation durations
export const DURATION = {
  fast: 0.2, // 200ms
  normal: 0.3, // 300ms
  slow: 0.4, // 400ms
}

// Page transition variants
export const pageVariants = {
  initial: {
    opacity: 0,
    y: 24,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.normal,
      ease: EASING.primary,
    },
  },
  exit: {
    opacity: 0,
    y: -24,
    transition: {
      duration: DURATION.fast,
      ease: EASING.primary,
    },
  },
}

// Card hover variants
export const cardVariants = {
  initial: {
    y: 0,
  },
  hover: {
    y: -4,
    transition: {
      duration: DURATION.fast,
      ease: EASING.primary,
    },
  },
}

// Button interaction variants
export const buttonVariants = {
  initial: {
    scale: 1,
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: DURATION.fast,
      ease: EASING.primary,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: DURATION.fast,
      ease: EASING.primary,
    },
  },
}

// Fade in variants
export const fadeInVariants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: DURATION.normal,
      ease: EASING.easeOut,
    },
  },
}

// Scale in variants (for modals, dropdowns)
export const scaleInVariants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: DURATION.normal,
      ease: EASING.primary,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: DURATION.fast,
      ease: EASING.primary,
    },
  },
}

// Slide in variants (for sidebars, drawers)
export const slideInVariants = {
  initial: {
    x: -100,
    opacity: 0,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      duration: DURATION.normal,
      ease: EASING.primary,
    },
  },
  exit: {
    x: -100,
    opacity: 0,
    transition: {
      duration: DURATION.fast,
      ease: EASING.primary,
    },
  },
}

// Stagger container (for lists, grids)
export const containerVariants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

// Stagger child item
export const itemVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.normal,
      ease: EASING.primary,
    },
  },
}

// Rotate variants (for loading spinners)
export const rotateVariants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
}

// Pulse variants (for badges, notifications)
export const pulseVariants = {
  animate: {
    opacity: [1, 0.5, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

export default {
  EASING,
  DURATION,
  pageVariants,
  cardVariants,
  buttonVariants,
  fadeInVariants,
  scaleInVariants,
  slideInVariants,
  containerVariants,
  itemVariants,
  rotateVariants,
  pulseVariants,
}
