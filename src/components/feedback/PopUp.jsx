import { useEffect, useId, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  getDialogFocusableElements,
  resolveDialogTabTargetIndex,
} from '../../lib/dialogFocus';

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-full mx-4',
};

/**
 * Reusable metadata row for detail modals.
 *
 *   <PopUp.Row icon={ClockIcon} label="Date & Time">
 *     January 15, 2026 at 18:00
 *   </PopUp.Row>
 */
const Row = ({ icon: Icon, label, children, iconClassName = '' }) => (
  <div className="popup-row">
    {Icon && <Icon className={`popup-row-icon ${iconClassName}`} aria-hidden />}
    <div className="min-w-0 flex-1">
      {label && <p className="popup-row-label">{label}</p>}
      <div className="popup-row-value">{children}</div>
    </div>
  </div>
);

/**
 * PopUp — central reusable modal for the whole app.
 *
 * Props
 * ──────────────────────────────────────────────
 * isOpen            boolean      controlled visibility
 * onClose           () => void
 * title             ReactNode    heading (string, JSX, or omit)
 * description       string       sub-text below title
 * children          ReactNode    scrollable body
 * footer            ReactNode    sticky action row
 * size              'sm'|'md'|'lg'|'xl'|'2xl'|'full'  (default 'md')
 * showCloseButton   boolean      (default true)
 * closeOnBackdrop   boolean      (default true)
 * className         string       extra classes on the panel
 *
 * Compound
 * ──────────────────────────────────────────────
 * PopUp.Row         icon+label+value metadata row
 */
const PopUp = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  headerImage,
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  className = '',
}) => {
  const panelRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  const previousBodyOverflowRef = useRef('');
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current = document.activeElement;
    const panel = panelRef.current;
    const animationFrame = window.requestAnimationFrame(() => {
      const initialTarget = getDialogFocusableElements(panel)[0] ?? panel;
      initialTarget?.focus({ preventScroll: true });
    });

    const handleKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current?.();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = getDialogFocusableElements(panel);
      const activeIndex = focusableElements.indexOf(document.activeElement);
      const targetIndex = resolveDialogTabTargetIndex({
        activeIndex,
        focusableCount: focusableElements.length,
        shiftKey: event.shiftKey,
      });

      if (targetIndex === null) return;

      event.preventDefault();
      const target = targetIndex === -1 ? panel : focusableElements[targetIndex];
      target?.focus({ preventScroll: true });
    };

    document.addEventListener('keydown', handleKey, true);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      document.removeEventListener('keydown', handleKey, true);

      const previousTarget = previouslyFocusedRef.current;
      if (previousTarget?.isConnected) {
        previousTarget.focus({ preventScroll: true });
      }
      previouslyFocusedRef.current = null;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    previousBodyOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflowRef.current;
    };
  }, [isOpen]);

  const hasHeader = !!title;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="popup-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="popup-backdrop fixed inset-0 z-50"
            aria-hidden="true"
            onClick={closeOnBackdrop ? onClose : undefined}
          />

          {/* Centering wrapper — scrollable when content overflows; click outside closes */}
          <div
            className="fixed inset-0 z-50 overflow-y-auto"
            onClick={closeOnBackdrop ? onClose : undefined}
            role="presentation"
          >
            <div className="flex min-h-full items-center justify-center p-3 sm:p-6">
              {/* Panel */}
              <motion.div
                key="popup-panel"
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                aria-describedby={description ? descriptionId : undefined}
                tabIndex={-1}
                initial={{ opacity: 0, scale: 0.985, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.985, y: 8 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className={[
                  'popup-panel relative flex max-h-[calc(100dvh-1.5rem)] w-full flex-col overflow-hidden',
                  sizeClasses[size] ?? sizeClasses.md,
                  className,
                ].join(' ')}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header image — full-bleed above content */}
                {headerImage && (
                  <div className="popup-header-image">
                    <img
                      src={headerImage}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                {/* Header */}
                {(hasHeader || showCloseButton) && (
                  <header className="popup-header">
                    <div className="popup-heading min-w-0 flex-1">
                      {hasHeader && (
                        typeof title === 'string' ? (
                          <h2 className="popup-title" id={titleId}>{title}</h2>
                        ) : (
                          <div className="popup-title" id={titleId}>{title}</div>
                        )
                      )}
                      {description && (
                        <p className="popup-description" id={descriptionId}>{description}</p>
                      )}
                    </div>
                    {showCloseButton && (
                      <button
                        type="button"
                        onClick={onClose}
                        className="popup-close"
                        aria-label="Close dialog"
                      >
                        <XMarkIcon className="h-4 w-4" aria-hidden />
                      </button>
                    )}
                  </header>
                )}

                {/* Body */}
                {children && (
                  <div className="popup-body">
                    {children}
                  </div>
                )}

                {/* Footer */}
                {footer && (
                  <footer className="popup-footer">
                    <div className="flex flex-col items-stretch gap-2 sm:ml-auto sm:flex-row sm:items-center">
                      {footer}
                    </div>
                  </footer>
                )}
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

PopUp.Row = Row;

export default PopUp;
