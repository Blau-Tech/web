import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { EnvelopeIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useCity } from '../../lib/city/cityContext';
import { hasPrograms } from '../../lib/city/cityConfig';
import {
  hasActiveModal,
  MODAL_OPEN_REQUEST_EVENT,
  requestModalOwnership,
} from '../../lib/modalCoordination';
import { NEWSLETTER_ENABLED, NEWSLETTER_PATH, openNewsletter } from '../../lib/newsletter';
import { useLocation } from '../../lib/router';

const ALERT_DISMISSED_KEY = 'blau-tech-alert-dismissed';
const ALERT_DELAY_MS = 60000;
const MODAL_RETRY_DELAY_MS = 5000;

export default function TimedAlert() {
  const { pathname } = useLocation();
  const { city, enabledSections } = useCity();
  const isCompact = city.communityAlertDensity === 'compact';
  const isNewsletterPage = pathname === NEWSLETTER_PATH;
  const programsEnabled = hasPrograms(enabledSections);
  const [isVisible, setIsVisible] = useState(false);
  const [suppressExit, setSuppressExit] = useState(false);
  const channelBase = 'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent-lite';
  const primaryChannelClass = `${channelBase} bg-white text-brand-ground hover:bg-brand-wash ${
    isCompact ? 'min-h-10 px-4 text-sm' : 'min-h-14 px-4 text-sm'
  }`;
  const secondaryChannelClass = `${channelBase} bg-white/10 text-white hover:bg-white/15 ${
    isCompact ? 'min-h-10 whitespace-nowrap px-3 text-[13px]' : 'min-h-12 px-4 text-sm'
  }`;

  useEffect(() => {
    if (isNewsletterPage) {
      setIsVisible(false);
      return undefined;
    }

    const wasDismissed = localStorage.getItem(ALERT_DISMISSED_KEY);
    if (wasDismissed) return undefined;

    let timer;
    const showWhenModalFree = () => {
      if (hasActiveModal()) {
        timer = setTimeout(showWhenModalFree, MODAL_RETRY_DELAY_MS);
        return;
      }

      requestModalOwnership();
      setSuppressExit(false);
      setIsVisible(true);
    };

    timer = setTimeout(showWhenModalFree, ALERT_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isNewsletterPage]);

  useEffect(() => {
    const releaseModal = () => {
      setSuppressExit(true);
      setIsVisible(false);
    };
    window.addEventListener(MODAL_OPEN_REQUEST_EVENT, releaseModal);
    return () => window.removeEventListener(MODAL_OPEN_REQUEST_EVENT, releaseModal);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(ALERT_DISMISSED_KEY, 'true');
  };

  if (isNewsletterPage || suppressExit) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={handleDismiss}
            className="fixed inset-0 z-[45] bg-brand-ink/40 backdrop-blur-[2px]"
          />

          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            id="community-alert-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="community-alert-title"
            aria-describedby="community-alert-description"
          >
            <div className={isCompact ? 'w-full max-w-[23rem]' : 'w-full max-w-md'}>
              <div className={`relative max-h-[calc(100svh-2rem)] overflow-x-hidden overflow-y-auto rounded-[1.625rem] bg-brand-ground font-brand text-white ${
                isCompact ? 'p-4 sm:p-5' : 'p-5 sm:p-6'
              }`}>
                <div>
                  <div className={`flex items-start justify-between gap-4 ${isCompact ? 'mb-2' : 'mb-3'}`}>
                    <h3
                      id="community-alert-title"
                      className={`font-medium tracking-[-0.02em] text-white ${
                        isCompact ? 'text-2xl leading-[1.15]' : 'text-[1.75rem] leading-[1.1]'
                      }`}
                    >
                      Never miss <span className="text-brand-accent-lite">what&apos;s happening.</span>
                    </h3>

                    <button
                      type="button"
                      onClick={handleDismiss}
                      className="-mr-2 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent-lite"
                      aria-label="Close community updates"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <p
                    id="community-alert-description"
                    className={`text-white/70 ${isCompact ? 'mb-4 text-sm leading-snug' : 'mb-5 text-base leading-snug'}`}
                  >
                    Fresh {programsEnabled ? 'events, hackathons, and programs' : 'events and hackathons'} from the Blau Tech community, straight to your favorite channel.
                  </p>

                  <div className={`grid sm:grid-cols-2 ${isCompact ? 'gap-2' : 'gap-2.5'}`}>
                    {NEWSLETTER_ENABLED && (
                      <button
                        type="button"
                        onClick={() => { handleDismiss(); openNewsletter(); }}
                        className={`${primaryChannelClass} sm:col-span-2`}
                      >
                        <EnvelopeIcon className="h-5 w-5 shrink-0" />
                        Get the newsletter
                      </button>
                    )}

                    {city.whatsappUrl && (
                      <a
                        href={city.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${secondaryChannelClass}${city.linkedinUrl ? '' : ' sm:col-span-2'}`}
                      >
                        <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        Join WhatsApp
                      </a>
                    )}

                    {city.linkedinUrl && (
                      <a
                        href={city.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${secondaryChannelClass}${city.whatsappUrl ? '' : ' sm:col-span-2'}`}
                      >
                        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.729 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                        Follow on LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
