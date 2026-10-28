export const privacyReview = Object.freeze({
  noticeVersion: '2026-09-29',
  approved: false,
  reviewedAt: null,
  reviewedBy: null,
  signedReviewReference: null,
  processorAgreementsVerifiedAt: null,
  operationalControlsVerifiedAt: null,
  accessControlsVerifiedAt: null,
  controller: Object.freeze({
    name: 'Flamur Maliqi',
    postalAddress: 'Isabella-Braun-Straße 2, 86633 Neuburg an der Donau, Germany',
    privacyEmail: 'partner@blau-tech.de',
  }),
  processors: Object.freeze({
    supabase: Object.freeze({
      agreementStatus: 'pending',
      region: 'eu-north-1 (Stockholm)',
    }),
    vercel: Object.freeze({
      agreementStatus: 'pending',
      region: 'global edge network',
    }),
    resend: Object.freeze({
      agreementStatus: 'accepted',
      acceptedAt: '2026-09-29',
      acceptedBy: 'Flamur Maliqi',
      region: 'Amazon SES eu-west-1 mail stream; other processing provider-managed',
    }),
    n8nHosting: Object.freeze({
      agreementStatus: 'pending',
      region: 'AWS eu-west-1 (Ireland)',
    }),
    mailbox: Object.freeze({
      agreementStatus: 'pending',
      region: null,
    }),
  }),
});
