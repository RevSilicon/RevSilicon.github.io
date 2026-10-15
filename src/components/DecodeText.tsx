import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../motion';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&$@';
/** Characters that never scramble, so the word's shape is legible from the first frame. */
const FIXED = new Set(['.', ' ', '·']);

type DecodeTextProps = {
  readonly text: string;
  readonly className?: string;
  /** Total time for the last character to lock in. */
  readonly duration?: number;
};

/**
 * Scrambles a word into place the first time it scrolls into view. Each
 * character is width-locked to its final glyph, so the line never jitters, and
 * screen readers only ever get the real text.
 */
export function DecodeText({ text, className = '', duration = 1300 }: DecodeTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  // Hidden (but still laid out) until the scramble starts, so a busy main thread never shows placeholder glyphs.
  const [waiting, setWaiting] = useState(() => !prefersReducedMotion());
  const [glyphs, setGlyphs] = useState<readonly (string | null)[]>(() => text.split('').map(() => null));

  useEffect(() => {
    const element = ref.current;
    if (!element || prefersReducedMotion()) return;
    let frame = 0;
    let last = 0;

    const run = () => {
      const characters = text.split('');
      const scramble = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]!;
      // Seed scrambled glyphs in the same update that unhides it, so the final word never flashes first.
      setGlyphs(characters.map((character) => (FIXED.has(character) ? null : scramble())));
      setWaiting(false);
      const start = performance.now();
      const tick = (now: number) => {
        const progress = (now - start) / duration;
        if (now - last > 45 || progress >= 1) {
          last = now;
          setGlyphs(characters.map((character, index) => {
            if (FIXED.has(character)) return null;
            const lockAt = 0.25 + (index / characters.length) * 0.75;
            return progress >= lockAt ? null : scramble();
          }));
        }
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      run();
    }, { threshold: 0.6 });
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [text, duration]);

  return (
    <span ref={ref} className={`decode-text ${waiting ? 'is-waiting' : ''} ${className}`.replace(/\s+/g, ' ').trim()}>
      <span className="visually-hidden">{text}</span>
      <span aria-hidden="true">
        {text.split('').map((character, index) => {
          const glyph = glyphs[index];
          return (
            <span key={index} className={`decode-char ${glyph ? 'is-scrambled' : ''}`.trim()}>
              <span className="decode-final">{character}</span>
              {glyph ? <span className="decode-glyph">{glyph}</span> : null}
            </span>
          );
        })}
      </span>
    </span>
  );
}
