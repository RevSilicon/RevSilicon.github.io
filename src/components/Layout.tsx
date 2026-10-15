import { type PropsWithChildren, useEffect, useId, useState } from 'react';
import { revsiliconLogoUrl } from '../assets';
import { contact, site } from '../data/site';
import { Link, NavLink, useLocation } from '../router';

function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const menuId = useId();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to="/" aria-label="Rev Silicon home" onClick={() => setOpen(false)}>
          <span className="brand-mark-wrap">
            <img src={revsiliconLogoUrl} alt="" className="brand-mark" />
          </span>
          <span className="brand-name">REV SILICON</span>
        </Link>

        <button
          className="menu-toggle"
          type="button"
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          onClick={() => setOpen((value) => !value)}
        >
          <span />
          <span />
        </button>

        <nav id={menuId} className={`primary-nav ${open ? 'is-open' : ''}`} aria-label="Primary navigation">
          {site.nav.map((item) => (
            <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

function SocialLinks() {
  return (
    <div className="social-links">
      <a href={contact.instagram.url} target="_blank" rel="noreferrer noopener">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4.1" />
          <circle className="social-dot" cx="17.4" cy="6.6" r="1.15" />
        </svg>
        <span>{contact.instagram.handle}</span>
      </a>
      <a href={contact.linkedin.url} target="_blank" rel="noreferrer noopener">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle className="social-dot" cx="7.6" cy="7.4" r="1.15" />
          <path d="M7.6 10.4v7M11.6 17.4v-7M11.6 13.3c0-1.8 1.1-2.9 2.5-2.9s2.4 1 2.4 3v4" />
        </svg>
        <span>{contact.linkedin.handle}</span>
      </a>
    </div>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-trace" aria-hidden="true"><span /></div>
      <div className="container footer-main">
        <div className="footer-brand">
          <Link className="footer-logo" to="/">
            <img src={revsiliconLogoUrl} alt="" />
            <span>REV SILICON</span>
          </Link>
          <p>Texas A&amp;M students taking a chip from architecture to tapeout.</p>
        </div>

        <nav className="footer-links" aria-label="Footer navigation">
          {site.nav.map((item) => <Link key={item.to} to={item.to}>{item.label}</Link>)}
        </nav>

        <div className="footer-reach">
          <a className="footer-email" href={`mailto:${contact.email}`}>{contact.email}</a>
          <SocialLinks />
        </div>
      </div>
      <div className="container footer-fine">
        <p>© 2026 Rev Silicon · Texas A&amp;M University</p>
      </div>
    </footer>
  );
}

export function Layout({ children }: PropsWithChildren) {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Header />
      {children}
      <Footer />
    </>
  );
}
