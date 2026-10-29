import { NEWSLETTER_ENABLED } from '../lib/newsletter';
import MobileNavbar from '../components/layout/MobileNavbar';
import SiteFooter from '../components/layout/SiteFooter';
import { PRIVACY_CONTROLLER, PRIVACY_NOTICE_VERSION } from '../lib/privacyReview';

const lastUpdated = new Date(`${PRIVACY_NOTICE_VERSION}T00:00:00Z`).toLocaleDateString('en-GB', {
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

function Item({ id, title, children }) {
  return (
    <p id={id} className="scroll-mt-24">
      <strong className="font-semibold text-brand-ink">{title}.</strong> {children}
    </p>
  );
}

function MailLink({ subject, children }) {
  const email = PRIVACY_CONTROLLER.privacyEmail;
  const href = subject ? `mailto:${email}?subject=${encodeURIComponent(subject)}` : `mailto:${email}`;

  return (
    <a className="whitespace-nowrap text-brand-ink underline underline-offset-4" href={href}>
      {children ?? email}
    </a>
  );
}

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-brand-ink">
      <MobileNavbar />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-24 pt-12 sm:px-6 sm:pt-20">
        <h1 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Privacy policy</h1>
        <p className="mt-3 text-sm text-brand-secondary">Last updated {lastUpdated}</p>

        <div className="mt-10 space-y-4 text-[15px] leading-7 text-brand-ink/80">
          <p>
            You can use Blau Tech without an account: there are no user accounts or sign-in. We only receive
            personal data when you choose to send it to us, and we don&apos;t use analytics, advertising or
            tracking cookies.
          </p>
          <p>
            {PRIVACY_CONTROLLER.name}, {PRIVACY_CONTROLLER.postalAddress}, is responsible for this site. For
            anything privacy-related, email <MailLink />.
          </p>

          <Section id="data" title="What we collect and why">
            <Item title="Visiting the site">
              Like any website, our servers process your IP address and basic request information to deliver
              the site and keep it secure (Art. 6(1)(f) GDPR).
            </Item>
            <Item title="Settings in your browser">
              Your filter choices are saved on your device only and stay there until you clear your site
              data. This is strictly necessary for the feature you use (§ 25(2) TDDDG).
            </Item>
            {NEWSLETTER_ENABLED && (
              <Item id="newsletter" title="Newsletter">
                If you subscribe, we store your email address and a record of your consent. You only receive
                the newsletter after confirming by email (Art. 6(1)(a) GDPR). Every issue has an unsubscribe
                link, and you can withdraw consent at any time. We keep a minimal suppression record after an
                unsubscribe, bounce or complaint under our legitimate interest in preventing another send
                (Art. 6(1)(f) GDPR). You can object to that retention.
              </Item>
            )}
            <Item title="Feedback">
              When you send feedback, we store your name, email address and message so we can read it and
              reply (Art. 6(1)(b) and (f) GDPR).
            </Item>
            <Item title="Event submissions">
              When you submit an event, we receive the link and basic request information to review it and
              prevent abuse. Accepted events are published publicly (Art. 6(1)(b) and (f) GDPR).
            </Item>
            <Item title="Emailing us">
              If you write to us, we use your email address and message only to reply.
            </Item>
          </Section>

          <Section id="sharing" title="Who we share it with">
            <p>
              We don&apos;t sell or share your data with partners, organisers or advertisers. We use carefully
              selected service providers for hosting, data storage and email, who process data only on our
              behalf. Where a provider processes data outside the EU,
              appropriate safeguards such as the EU Standard Contractual Clauses apply.
            </p>
            <p>
              Some content, such as event images, is loaded from third-party servers, which receive your IP
              address. Links to other websites and platforms are subject to their own privacy policies.
            </p>
          </Section>

          <Section id="retention" title="How long we keep it">
            <p>
              We keep personal data only as long as needed for the purpose it was collected for.
              {NEWSLETTER_ENABLED && ' Unconfirmed newsletter requests are deleted after seven days. Active subscriptions are kept until you unsubscribe. The minimal suppression record is reviewed annually, kept while we operate the newsletter, and deleted three years after the service permanently ends unless a legal claim requires longer.'} Feedback is deleted
              after 12 months at the latest, and technical request data after a short period.
            </p>
          </Section>

          <Section id="rights" title="Your rights">
            <p>
              You can ask us for a copy of your data, or to correct, delete, restrict or export it. You can
              also object to processing and withdraw consent at any time. Email{' '}
              <MailLink subject="Privacy request" /> and we&apos;ll respond within one month. You also have
              the right to complain to a data protection authority.
            </p>
          </Section>

          <Section id="changes" title="Changes">
            <p>We may update this page from time to time. The date at the top shows the latest version.</p>
          </Section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
