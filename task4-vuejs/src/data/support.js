// Static demo content for the Support page. It exists to fill out the
// page the footer's Delivery Info / Returns / Contact Us links used to
// point at nothing.

export const FAQS = [
  {
    question: 'How long does delivery take?',
    answer: '3–5 business days for standard delivery, free on orders over $50.',
  },
  {
    question: "What's the return policy?",
    answer: 'Return anything within 14 days of delivery, unused and in its original packaging, for a full refund.',
  },
  {
    question: 'Which payment methods do you accept?',
    answer:
      "None. This is a demo storefront: the buy now and add to cart buttons only update the on-page cart, and nothing is actually charged.",
  },
  {
    question: 'Can I track my order?',
    answer:
      "There's nothing to track, since no real order gets placed. A live version of this store would email a tracking link once an order shipped.",
  },
  {
    question: 'Do you ship internationally?',
    answer: 'Not in this demo: the delivery estimates only cover domestic shipping.',
  },
  {
    question: 'How do I cancel an order?',
    answer: "Remove items from your cart any time before checkout. Since nothing here is a real transaction, there's no separate cancellation process.",
  },
  {
    question: 'Do I need an account to buy something?',
    answer: 'No. The Account page just stores a name and email for the session; browsing, the cart, and Saved items all work without one.',
  },
];

export const DELIVERY_OPTIONS = [
  { label: 'Standard delivery', detail: '3–5 business days, free on orders over $50, $4.99 otherwise' },
  { label: 'Express delivery', detail: '1–2 business days, $9.99' },
  { label: 'Same-day pickup', detail: 'Not available in this demo' },
];

export const RETURNS_POLICY = [
  'Returns are accepted within 14 days of delivery.',
  'Items must be unused and in their original packaging.',
  'Refunds are issued to the original payment method within 5–7 business days of the return being received.',
];

export const CONTACT = {
  email: 'support@tekkiech.market',
  phone: '+44 191 555 0139',
  hours: 'Monday–Friday, 9am–5pm GMT',
};
