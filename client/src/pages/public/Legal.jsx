import { SITE } from '../../config/site';

// PLACEHOLDER TEXT — replace with policies reviewed by a lawyer before launch.
const CONTENT = {
  terms: {
    title: 'Terms & Conditions',
    sections: [
      ['Bookings', 'A booking is a request for a technician visit. The starting price covers inspection. Repair work starts only after you accept a written quotation.'],
      ['Cancellations', 'You can cancel a booking from your dashboard while it is pending or assigned. Once work has started it cannot be cancelled online.'],
      ['Payments', 'You can pay online through Razorpay or in cash to the technician. An invoice is issued for every completed job.'],
      ['Warranty', 'Write your real service warranty terms here (duration, what is covered, what is not).'],
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    sections: [
      ['What we collect', 'Your name, phone number, email, service addresses, booking history and payment records.'],
      ['Why we collect it', 'To verify your account, schedule technicians, send invoices and provide support.'],
      ['Who sees it', 'The technician assigned to your booking sees your name, phone and address for that job. We do not sell your data.'],
      ['Payments', 'Card and UPI details are handled by Razorpay. We never store them on our servers.'],
      ['Contact', `Email ${SITE.email} to ask for a copy of your data or to delete your account.`],
    ],
  },
};

export default function Legal({ type }) {
  const page = CONTENT[type];
  return (
    <div className="container py-5 legal" style={{ maxWidth: 800 }}>
      <h1 className="h3 fw-bold">{page.title}</h1>
      <div className="alert alert-warning small">Placeholder text. Replace it with your reviewed legal policy before going live.</div>
      {page.sections.map(([h, p]) => (
        <section key={h}>
          <h2>{h}</h2>
          <p>{p}</p>
        </section>
      ))}
    </div>
  );
}
