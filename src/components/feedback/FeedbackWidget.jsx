import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ChatBubbleLeftRightIcon, XMarkIcon } from '@heroicons/react/24/outline';

import {
  FEEDBACK_LIMITS,
  submitProductFeedback,
  validateFeedbackDraft,
} from '../../lib/feedback';
import { requestModalOwnership } from '../../lib/modalCoordination';
import { supabase } from '../../lib/supabase';
import '../../styles/feedback.css';

const EMPTY_DRAFT = Object.freeze({
  name: '',
  email: '',
  feedback: '',
  website: '',
});

export default function FeedbackWidget({ isVisible = true }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPanelMounted, setIsPanelMounted] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const widgetRef = useRef(null);
  const triggerRef = useRef(null);
  const triggerShellRef = useRef(null);
  const panelRef = useRef(null);
  const feedbackRef = useRef(null);
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const sendAnotherRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  const closePanel = useCallback(({ restoreFocus = false } = {}) => {
    if (!isOpen) return;
    setIsOpen(false);
    if (restoreFocus) triggerRef.current?.focus({ preventScroll: true });
  }, [isOpen]);

  useGSAP((_, contextSafe) => {
    if (!isPanelMounted || !panelRef.current || !triggerShellRef.current) return undefined;

    const panel = panelRef.current;
    const trigger = triggerShellRef.current;
    const finishClosing = contextSafe(() => setIsPanelMounted(false));
    const panelBounds = panel.getBoundingClientRect();
    const triggerBounds = trigger.getBoundingClientRect();
    const targetX = triggerBounds.left + (triggerBounds.width / 2)
      - panelBounds.left - (panelBounds.width / 2);
    const targetY = triggerBounds.top + (triggerBounds.height / 2)
      - panelBounds.top - (panelBounds.height / 2);
    const targetScaleX = triggerBounds.width / panelBounds.width;
    const targetScaleY = triggerBounds.height / panelBounds.height;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const openDuration = reduceMotion ? 0 : 0.3;
    const closeDuration = reduceMotion ? 0 : 0.22;

    if (isOpen) {
      gsap.set(panel, {
        autoAlpha: 0,
        x: targetX,
        y: targetY,
        scaleX: targetScaleX,
        scaleY: targetScaleY,
        rotation: -0.5,
        transformOrigin: 'center center',
      });
      gsap.set(trigger, { autoAlpha: 1, scale: 1, rotation: 0 });

      gsap.timeline()
        .to(trigger, {
          autoAlpha: 0,
          scale: 0.96,
          duration: openDuration * 0.46,
          ease: 'power2.out',
          overwrite: 'auto',
        }, 0)
        .to(panel, {
          autoAlpha: 1,
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          rotation: 0,
          duration: openDuration,
          ease: 'power3.out',
          overwrite: 'auto',
        }, openDuration * 0.06);
      return undefined;
    }

    gsap.set(trigger, { autoAlpha: 0, scale: 0.96, rotation: 0 });
    gsap.set(panel, { transformOrigin: 'center center' });

    gsap.timeline({ onComplete: finishClosing })
      .to(panel, {
        autoAlpha: 0,
        x: targetX,
        y: targetY,
        scaleX: targetScaleX,
        scaleY: targetScaleY,
        rotation: -0.5,
        duration: closeDuration,
        ease: 'power3.inOut',
        overwrite: 'auto',
      }, 0)
      .to(trigger, {
        autoAlpha: 1,
        scale: 1,
        rotation: 0,
        duration: closeDuration * 0.58,
        ease: 'power2.out',
        overwrite: 'auto',
      }, closeDuration * 0.58);
    return undefined;
  }, {
    dependencies: [isOpen, isPanelMounted],
    scope: widgetRef,
    revertOnUpdate: true,
  });

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!widgetRef.current?.contains(event.target)) closePanel();
    };
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      closePanel({ restoreFocus: true });
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closePanel, isOpen]);

  const handleOpen = () => {
    if (isOpen) {
      closePanel({ restoreFocus: true });
      return;
    }

    requestModalOwnership();
    setIsPanelMounted(true);
    setIsOpen(true);
    window.requestAnimationFrame(() => feedbackRef.current?.focus({ preventScroll: true }));
  };

  const updateField = (field) => (event) => {
    const value = event.target.value;
    setDraft((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
    if (status === 'error') setStatus('idle');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (status === 'submitting') return;

    const validation = validateFeedbackDraft(draft);
    if (!validation.ok) {
      setErrors(validation.errors);
      const firstInvalidField = ['name', 'email', 'feedback'].find((field) => validation.errors[field]);
      ({ name: nameRef, email: emailRef, feedback: feedbackRef }[firstInvalidField]?.current)
        ?.focus({ preventScroll: true });
      return;
    }

    setErrors({});
    setStatus('submitting');
    const pagePath = `${window.location.pathname}${window.location.search}`;
    const result = await submitProductFeedback(supabase, draft, pagePath);

    if (result.ok) {
      setStatus('success');
      setDraft((current) => ({ ...current, feedback: '', website: '' }));
      window.requestAnimationFrame(() => sendAnotherRef.current?.focus({ preventScroll: true }));
      return;
    }

    setStatus(result.code === 'rate_limited' ? 'rate_limited' : 'error');
  };

  const handleSendAnother = () => {
    setStatus('idle');
    window.requestAnimationFrame(() => feedbackRef.current?.focus({ preventScroll: true }));
  };

  if (!isVisible) return null;

  const isSent = status === 'success';

  return (
    <div className="feedback-widget feedback-widget--visible" ref={widgetRef}>
      {isPanelMounted ? (
        <section
          ref={panelRef}
          className="feedback-widget__panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          aria-hidden={!isOpen}
          inert={isOpen ? undefined : ''}
        >
          <header className="feedback-widget__header">
            {isSent ? (
              <div role="status">
                <h2 className="feedback-widget__title" id={titleId}>Thanks, it&apos;s with us</h2>
                <p className="feedback-widget__description" id={descriptionId}>
                  We may email you to learn a little more.
                </p>
                <button
                  ref={sendAnotherRef}
                  type="button"
                  className="feedback-widget__again"
                  onClick={handleSendAnother}
                >
                  Send another thought
                </button>
              </div>
            ) : (
              <div>
                <h2 className="feedback-widget__title" id={titleId}>Share feedback</h2>
                <p className="feedback-widget__description" id={descriptionId}>
                  Any ideas or thoughts on how we could improve? We&apos;d love to hear them.
                </p>
              </div>
            )}
            <button
              type="button"
              className="feedback-widget__close"
              onClick={() => closePanel({ restoreFocus: true })}
              aria-label="Close feedback form"
            >
              <XMarkIcon aria-hidden="true" />
            </button>
          </header>

          {isSent ? null : (
            <form className="feedback-widget__form" onSubmit={handleSubmit} noValidate>
              <div className="feedback-widget__row">
                <div className="feedback-widget__field">
                  <label className="sr-only" htmlFor="feedback-name">Name</label>
                  <input
                    ref={nameRef}
                    id="feedback-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Name"
                    value={draft.name}
                    maxLength={FEEDBACK_LIMITS.name}
                    onChange={updateField('name')}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? 'feedback-name-error' : undefined}
                    required
                  />
                  {errors.name ? <p className="feedback-widget__field-error" id="feedback-name-error">{errors.name}</p> : null}
                </div>
                <div className="feedback-widget__field">
                  <label className="sr-only" htmlFor="feedback-email">Email address</label>
                  <input
                    ref={emailRef}
                    id="feedback-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="Email address"
                    value={draft.email}
                    maxLength={FEEDBACK_LIMITS.email}
                    onChange={updateField('email')}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'feedback-email-error' : undefined}
                    required
                  />
                  {errors.email ? <p className="feedback-widget__field-error" id="feedback-email-error">{errors.email}</p> : null}
                </div>
              </div>

              <div className="feedback-widget__field">
                <label className="sr-only" htmlFor="feedback-message">Feedback</label>
                <textarea
                  ref={feedbackRef}
                  id="feedback-message"
                  name="feedback"
                  placeholder="What should we improve?"
                  value={draft.feedback}
                  maxLength={FEEDBACK_LIMITS.feedback}
                  onChange={updateField('feedback')}
                  aria-invalid={Boolean(errors.feedback)}
                  aria-describedby={errors.feedback ? 'feedback-message-error' : undefined}
                  required
                />
                {errors.feedback ? <p className="feedback-widget__field-error" id="feedback-message-error">{errors.feedback}</p> : null}
              </div>

              <div className="feedback-widget__honeypot" aria-hidden="true">
                <label htmlFor="feedback-website">Website</label>
                <input
                  id="feedback-website"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={draft.website}
                  onChange={updateField('website')}
                />
              </div>

              {status === 'error' || status === 'rate_limited' ? (
                <p className="feedback-widget__submit-error" role="alert">
                  {status === 'rate_limited'
                    ? 'That is plenty for now — please try again a little later.'
                    : 'We couldn’t send that. Please try again.'}
                </p>
              ) : null}

              <button
                type="submit"
                className="feedback-widget__submit"
                disabled={status === 'submitting'}
                aria-busy={status === 'submitting'}
              >
                {status === 'submitting' ? 'Sending…' : 'Send feedback'}
              </button>
            </form>
          )}
        </section>
      ) : null}

      <div className="feedback-widget__trigger-shell" ref={triggerShellRef}>
        <button
          ref={triggerRef}
          type="button"
          className="feedback-widget__trigger"
          onClick={handleOpen}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
        >
          <ChatBubbleLeftRightIcon aria-hidden="true" />
          <span>Feedback</span>
        </button>
      </div>
    </div>
  );
}
