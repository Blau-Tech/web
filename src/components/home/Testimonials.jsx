import { motion, useReducedMotion } from 'framer-motion';
import { TestimonialsColumn } from './TestimonialsColumn';
import SectionHeading from '../common/SectionHeading';

const testimonials = [
  {
    text: 'I wanted to build a place where people in tech could find each other and grow together.',
    name: 'Flamur Maliqi',
    role: 'Co-founder',
    column: 0,
    featured: true,
    image: '/assets/testimonials/flamur.png',
    linkedin: 'https://www.linkedin.com/in/flamur-maliqi/',
  },
  {
    text: 'I have been on a hackathon team with Troy. The Blau Tech team is seriously talented, and I am excited to see what they build.',
    name: 'Duc Trung',
    role: 'EWOR Fellow',
    column: 0,
  },
  {
    text: 'I came for the event listings and stayed for the people. It is one of the few places that makes the tech community feel connected.',
    name: 'Hassan',
    role: 'Developer',
    column: 0,
  },
  {
    text: 'I found an event on Blau Tech, met the right people there, and that is where my startup began.',
    name: 'Kenny Nguyen',
    role: 'Founder',
    column: 1,
    linkedin: 'https://www.linkedin.com/in/kennynguye/',
  },
  {
    text: 'I found a fellowship that matched exactly what I wanted to work on. I would never have known it was open otherwise.',
    name: 'Aliza',
    role: 'Computer science student',
    column: 1,
  },
  {
    text: 'Yo bro, this is so cool!',
    name: 'Ino',
    role: 'TUM.ai',
    column: 1,
    linkedin: 'https://www.linkedin.com/in/inoussa-adouba/',
  },
  {
    text: 'It feels curated rather than crowded. I can quickly spot the events and programs that are actually relevant to me.',
    name: 'Farhan',
    role: 'Community member',
    column: 2,
  },
  {
    text: 'Hackathons and events are the fastest way to learn, meet people and build something real. Everyone should try one.',
    name: 'Troy',
    role: 'Co-founder',
    column: 2,
    featured: true,
    image: '/assets/testimonials/troy.jpg',
    linkedin: 'https://www.linkedin.com/in/troyriveravolk/',
  },
  {
    text: 'The weekly roundup keeps me connected without making me search five different places. I always find one event worth showing up for.',
    name: 'Maya',
    role: 'Startup operator',
    column: 2,
  },
  {
    text: 'Blau Tech helps us reach students and motivated young builders. For anyone running events, it is a genuinely useful channel.',
    name: 'Melinda',
    role: 'n8n',
    column: 3,
    company: {
      name: 'n8n',
      href: 'https://n8n.io/',
      logo: '/assets/testimonials/n8n-mark.svg',
    },
  },
  {
    text: 'Blau Tech gave me a clear view of the local ecosystem when I was changing careers and did not know where to start.',
    name: 'Sana',
    role: 'Career switcher',
    column: 3,
  },
];

const testimonialColumns = Array.from({ length: 4 }, (_, columnIndex) => {
  const columnTestimonials = testimonials.filter((testimonial, testimonialIndex) => (
    (testimonial.column ?? testimonialIndex % 4) === columnIndex
  ));

  if (columnIndex !== 2) return columnTestimonials;

  const regularTestimonials = columnTestimonials.filter(({ featured }) => !featured);
  const featuredTestimonial = columnTestimonials.find(({ featured }) => featured);

  if (!featuredTestimonial) return regularTestimonials;

  return [
    ...regularTestimonials.slice(0, 1),
    featuredTestimonial,
    ...regularTestimonials.slice(1),
  ];
});

// Phones only get one column, so it carries both founders with a
// community card between them.
const mobileColumnNames = ['Flamur Maliqi', 'Duc Trung', 'Troy', 'Kenny Nguyen', 'Melinda'];
const mobileColumn = mobileColumnNames.map((name) => (
  testimonials.find((testimonial) => testimonial.name === name)
));

const columnDurations = [28, 34, 44, 37];
const columnClassNames = [
  'testimonials-column--tablet',
  'testimonials-column--tablet',
  'testimonials-column--desktop',
  'testimonials-column--wide',
];

const Testimonials = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="testimonials-section" aria-labelledby="testimonials-title">
      <div className="testimonials-section__inner">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, amount: 0.5 }}
          className="testimonials-section__intro"
        >
          <SectionHeading
            titleId="testimonials-title"
            title={<>Words from our{' '}<span className="brand-highlight">community</span></>}
            description="Real Blau Tech members, in their own words."
            align="center"
          />
        </motion.div>

        <div className="testimonials-stage">
          <TestimonialsColumn
            testimonials={mobileColumn}
            className="testimonials-column--mobile"
            duration={columnDurations[0]}
          />
          {testimonialColumns.map((column, columnIndex) => (
            <TestimonialsColumn
              key={columnIndex}
              testimonials={column}
              className={columnClassNames[columnIndex]}
              duration={columnDurations[columnIndex]}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
