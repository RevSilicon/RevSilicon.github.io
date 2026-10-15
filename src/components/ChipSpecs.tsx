import { site } from '../data/site';

/** The chip's public spec, laid out as a ruled datasheet table. Unreleased values render redacted. */
export function ChipSpecs({ className = '' }: { readonly className?: string }) {
  return (
    <dl className={`chip-specs ${className}`.trim()}>
      {site.teaser.specs.map((spec) => (
        <div key={spec.label}>
          <dt>{spec.label}</dt>
          <dd>
            {spec.value === null ? (
              <span className="spec-redacted" role="img" aria-label="Classified until the reveal" />
            ) : (
              <span className={spec.live ? 'spec-live' : undefined}>{spec.value}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
