const headingTags = Object.freeze({
  1: 'h1',
  2: 'h2',
  3: 'h3',
  4: 'h4',
  5: 'h5',
  6: 'h6',
});

const alignments = Object.freeze({
  start: 'section-heading--start',
  center: 'section-heading--center',
  end: 'section-heading--end',
});

const layouts = Object.freeze({
  stacked: 'section-heading--stacked',
  split: 'section-heading--split',
});

const tones = Object.freeze({
  default: 'section-heading--default',
  light: 'section-heading--light',
});

const contentWidths = Object.freeze({
  default: 'section-heading--width-default',
  narrow: 'section-heading--width-narrow',
  full: 'section-heading--width-full',
});

export default function SectionHeading({
  as: Root = 'header',
  title,
  description,
  titleId,
  headingLevel = 2,
  align = 'start',
  layout = 'stacked',
  tone = 'default',
  contentWidth = 'default',
  accessory,
  className = '',
}) {
  const Heading = headingTags[headingLevel] || headingTags[2];
  const rootClassName = [
    'section-heading',
    alignments[align] || alignments.start,
    layouts[layout] || layouts.stacked,
    tones[tone] || tones.default,
    contentWidths[contentWidth] || contentWidths.default,
    className,
  ].filter(Boolean).join(' ');

  return (
    <Root className={rootClassName}>
      <div className="section-heading__copy">
        <Heading id={titleId} className="section-heading__title">{title}</Heading>
        {description ? <p className="section-heading__description">{description}</p> : null}
      </div>
      {accessory ? <div className="section-heading__accessory">{accessory}</div> : null}
    </Root>
  );
}
