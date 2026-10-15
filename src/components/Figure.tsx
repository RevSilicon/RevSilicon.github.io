import type { PropsWithChildren } from 'react';

/** A quiet panel that holds an illustration. */
export function Figure({ className = '', children }: PropsWithChildren<{ readonly className?: string }>) {
  return <div className={`figure ${className}`.trim()}>{children}</div>;
}
