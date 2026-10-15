import type { ReactNode } from 'react';
import { Reveal } from './Reveal';

export type SpecRow = {
  readonly key: string;
  readonly title: string;
  readonly detail: ReactNode;
  readonly extra?: ReactNode;
};

/** Ruled rows (title, then detail) in place of boxed card grids. */
export function SpecRows({ rows }: { readonly rows: readonly SpecRow[] }) {
  return (
    <ol className="spec-rows">
      {rows.map((row, index) => (
        <li key={row.key} className="spec-row">
          <Reveal delay={index * 70} className="spec-row-inner">
            <h3>{row.title}</h3>
            <div className="spec-row-detail">
              <p>{row.detail}</p>
              {row.extra}
            </div>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}
