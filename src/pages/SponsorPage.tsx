import { CircuitField } from '../components/CircuitField';
import { Sheet } from '../components/Sheet';
import { SpecRows } from '../components/SpecRows';
import { Wafer } from '../components/Wafer';
import { contact } from '../data/site';

const support = [
  {
    title: 'Access',
    detail: 'Fund the software, compute, lab hardware, and fabrication runs that a student chip requires.',
  },
  {
    title: 'Experience',
    detail: 'Bring mentorship, design reviews, and industry workflows most students have never seen.',
  },
  {
    title: 'Opportunity',
    detail: 'Send more Aggies into semiconductor careers with real design work already behind them.',
  },
] as const;

const partnershipMail = `mailto:${contact.email}?subject=Sponsoring%20Rev%20Silicon`;

export default function SponsorPage() {
  return (
    <main id="main-content" className="inner-page sponsor-page fx-page">
      <CircuitField />

      <section className="fx-page-hero" aria-labelledby="sponsor-heading">
        <div className="container fx-split">
          <div className="fx-page-hero-copy">
            <h1 id="sponsor-heading">
              <span className="fx-line">Sponsor hands&#8209;on</span>
              <span className="fx-line fx-line-accent">chip design</span>
            </h1>
            <p className="fx-lede">
              We partner with organizations that believe engineers are made by building. We give Aggies the tools,
              mentors, and project experience to prove it.
            </p>
            <div className="fx-actions">
              <a className="fx-button" href={partnershipMail}>Start a partnership <span aria-hidden="true">↗</span></a>
              <a className="fx-text-link" href={`mailto:${contact.email}`}>{contact.email}</a>
            </div>
          </div>
          <div className="fx-page-hero-visual">
            <Wafer />
          </div>
        </div>
      </section>

      <Sheet title="What your support unlocks.">
        <SpecRows rows={support.map((item) => ({ key: item.title, title: item.title, detail: item.detail }))} />
      </Sheet>
    </main>
  );
}
