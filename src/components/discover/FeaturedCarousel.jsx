import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import SectionHeading from '../common/SectionHeading';

const DEFAULT_SPEED = 14;

export default function FeaturedCarousel({
  className = '',
  headingClassName = '',
  viewportClassName = '',
  headingId,
  headingLevel = 1,
  title,
  description,
  meta,
  items = [],
  loading = false,
  skeletonCount = 3,
  renderItem,
  renderSkeleton,
  getItemKey,
  fallback = null,
  speed = DEFAULT_SPEED,
}) {
  const viewportRef = useRef(null);
  const sequenceRef = useRef(null);
  const interactionRef = useRef({ focus: false, hover: false, pointer: false });
  const [duplicateCount, setDuplicateCount] = useState(1);
  const canLoop = items.length > 1;
  const showSkeletons = loading && items.length === 0;

  useLayoutEffect(() => {
    if (!canLoop) {
      setDuplicateCount(1);
      return undefined;
    }

    const viewport = viewportRef.current;
    const sequence = sequenceRef.current;
    if (!viewport || !sequence) return undefined;

    const updateDuplicateCount = () => {
      const sequenceWidth = sequence.getBoundingClientRect().width;
      if (!sequenceWidth) return;

      const requiredCopies = Math.max(1, Math.ceil(viewport.clientWidth / sequenceWidth) + 1);
      setDuplicateCount((currentCount) => (
        currentCount === requiredCopies ? currentCount : requiredCopies
      ));
    };

    updateDuplicateCount();
    const resizeObserver = new ResizeObserver(updateDuplicateCount);
    resizeObserver.observe(viewport);
    resizeObserver.observe(sequence);

    return () => resizeObserver.disconnect();
  }, [canLoop, items.length]);

  useEffect(() => {
    if (!canLoop || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    const viewport = viewportRef.current;
    const sequence = sequenceRef.current;
    if (!viewport || !sequence) return undefined;

    let previousTime = Date.now();
    const advance = () => {
      const time = Date.now();
      const elapsed = Math.min(time - previousTime, 64);
      previousTime = time;
      const interaction = interactionRef.current;
      const paused = interaction.focus || interaction.hover || interaction.pointer;

      if (!paused && document.visibilityState === 'visible') {
        viewport.scrollLeft += (speed * elapsed) / 1000;
        const sequenceWidth = sequence.getBoundingClientRect().width;
        if (sequenceWidth && viewport.scrollLeft >= sequenceWidth) {
          viewport.scrollLeft %= sequenceWidth;
        }
      }
    };

    const timer = window.setInterval(advance, 32);
    return () => window.clearInterval(timer);
  }, [canLoop, duplicateCount, speed]);

  const renderSequence = (copyIndex = 0) => (
    items.map((item, itemIndex) => (
      <div
        className="featured-carousel__item"
        key={`${getItemKey(item)}-${copyIndex}`}
      >
        {renderItem(item, itemIndex, { isDuplicate: copyIndex > 0 })}
      </div>
    ))
  );

  const handleBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      interactionRef.current.focus = false;
    }
  };

  return (
    <section
      className={`featured-carousel ${className}`.trim()}
      aria-labelledby={headingId}
    >
      <SectionHeading
        className={`featured-carousel__header ${headingClassName}`.trim()}
        titleId={headingId}
        headingLevel={headingLevel}
        title={title}
        description={description}
        accessory={meta ? <span>{meta}</span> : null}
      />

      <div className="featured-carousel__viewport-shell">
        <div
          ref={viewportRef}
          className={`featured-carousel__viewport ${viewportClassName}`.trim()}
          role="region"
          aria-label={`${title} carousel`}
          tabIndex={items.length > 0 ? 0 : undefined}
          onPointerEnter={() => { interactionRef.current.hover = true; }}
          onPointerLeave={() => {
            interactionRef.current.hover = false;
            interactionRef.current.pointer = false;
          }}
          onPointerDown={() => { interactionRef.current.pointer = true; }}
          onPointerUp={() => { interactionRef.current.pointer = false; }}
          onPointerCancel={() => { interactionRef.current.pointer = false; }}
          onFocus={() => { interactionRef.current.focus = true; }}
          onBlur={handleBlur}
        >
          {showSkeletons ? (
            <div className="featured-carousel__track">
              <div className="featured-carousel__sequence">
                {Array.from({ length: skeletonCount }, (_, index) => (
                  <div className="featured-carousel__item" key={index}>
                    {renderSkeleton(index)}
                  </div>
                ))}
              </div>
            </div>
          ) : items.length > 0 ? (
            <div className="featured-carousel__track">
              <div ref={sequenceRef} className="featured-carousel__sequence">
                {renderSequence()}
              </div>
              {canLoop
                ? Array.from({ length: duplicateCount }, (_, index) => (
                  <div
                    className="featured-carousel__sequence"
                    aria-hidden="true"
                    inert=""
                    key={index}
                  >
                    {renderSequence(index + 1)}
                  </div>
                ))
                : null}
            </div>
          ) : fallback}
        </div>
      </div>
    </section>
  );
}
