import MobileNavbar from '../components/layout/MobileNavbar';
import SiteFooter from '../components/layout/SiteFooter';
import { PRIVACY_CONTROLLER } from '../lib/privacyReview';

const TERMS_VERSION = '2026-10-29';

const lastUpdated = new Date(`${TERMS_VERSION}T00:00:00Z`).toLocaleDateString('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

function Section({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mt-12 text-lg font-semibold tracking-[-0.01em] text-brand-ink">{title}</h2>
      <div className="mt-3 space-y-4">{children}</div>
    </section>
  );
}

function MailLink({ subject }) {
  const email = PRIVACY_CONTROLLER.privacyEmail;
  const href = `mailto:${email}?subject=${encodeURIComponent(subject)}`;

  return (
    <a className="whitespace-nowrap text-brand-ink underline underline-offset-4" href={href}>
      {email}
    </a>
  );
}

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-brand-ink">
      <MobileNavbar />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-24 pt-12 sm:px-6 sm:pt-20">
        <h1 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Terms of use</h1>
        <p className="mt-3 text-sm text-brand-secondary">Last updated {lastUpdated}</p>

        <div className="mt-10 space-y-4 text-[15px] leading-7 text-brand-ink/80">
          <p>
            Blau Tech helps you find tech events, hackathons and programs. It is operated by{' '}
            {PRIVACY_CONTROLLER.name}, {PRIVACY_CONTROLLER.postalAddress}. By using the site you agree to
            these terms.
          </p>

          <Section id="listings" title="Listings come from organisers">
            <p>
              We list events and programs run by other people. Blau Tech is not the organiser and is not a
              party to anything you sign up for. Dates, places and conditions can change, so check the
              organiser&apos;s own page before you register. That page is the one to rely on.
            </p>
            <p>
              Names, descriptions, logos and images belong to the organisers or other rights holders. Our
              selection and presentation of listings is our own work.
            </p>
          </Section>

          <Section id="automated-access" title="No automated access or data mining">
            <p>
              Without our written permission you may not use bots, crawlers, scrapers, spiders, automated
              query tools or similar software to access Blau Tech, and you may not systematically copy,
              extract or collect its listings or other content, in whole or in part. You also may not
              republish them or feed them into another database, directory or aggregator.
            </p>
            <p>
              Reading the site in a browser, sharing a link, and indexing by search engines under our{' '}
              <a className="text-brand-ink underline underline-offset-4" href="/robots.txt">robots.txt</a>{' '}
              are fine.
            </p>
            <p>
              We reserve the right to use our content for text and data mining under § 44b (3) of the German
              Copyright Act (UrhG), and we have made this reservation in machine-readable form through
              robots.txt, the <code className="text-[13px]">tdm-reservation</code> header and meta tag, and{' '}
              <code className="text-[13px]">/.well-known/tdmrep.json</code>. Text and data mining for
              scientific research under § 60d UrhG is not affected.
            </p>
            <p>
              If you want a feed, an API or a data partnership instead, ask us at{' '}
              <MailLink subject="Data access request" />. We are glad to talk.
            </p>
          </Section>

          <Section id="enforcement" title="If this is ignored">
            <p>
              We may block IP addresses and clients that access the site in ways these terms do not allow,
              and we reserve all legal claims, including for injunctive relief and damages.
            </p>
          </Section>

          <Section id="accuracy" title="No guarantees">
            <p>
              The site is provided as it is. We take care with listings but cannot promise that they are
              complete, current or error-free, or that an event will take place. If you spot a mistake,
              email <MailLink subject="Listing correction" /> and we will fix it.
            </p>
          </Section>

          <Section id="law" title="Governing law and changes">
            <p>
              German law applies, as far as the law allows. We may update these terms from time to time. The
              date at the top shows the latest version.
            </p>
          </Section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
