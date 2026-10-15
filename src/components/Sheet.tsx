import { type PropsWithChildren, type ReactNode, useId } from 'react';
import { Reveal } from './Reveal';

type SheetProps = PropsWithChildren<{
  readonly title: ReactNode;
  readonly id?: string;
  readonly className?: string;
  /** Content that runs the full container width below the body, such as a large visual. */
  readonly wide?: ReactNode;
}>;

/** A page section: a heading, its content, and an optional full-width visual. */
export function Sheet({ title, id, className = '', wide, children }: SheetProps) {
  const headingId = useId();

  return (
    <section id={id} className={`sheet ${className}`.trim()} aria-labelledby={headingId}>
      <div className="container">
        <Reveal>
          <h2 id={headingId} className="sheet-title">{title}</h2>
        </Reveal>
        {children}
        {wide ? <div className="sheet-wide">{wide}</div> : null}
      </div>
    </section>
  );
}
