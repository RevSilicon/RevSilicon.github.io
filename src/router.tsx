import {
  createContext,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { appBasePath } from './paths';

type RouterContextValue = {
  readonly pathname: string;
  readonly navigate: (to: string) => void;
};

const RouterContext = createContext<RouterContextValue | null>(null);
const validPaths = new Set(['/', '/about', '/projects', '/join', '/sponsor']);
const appBasePathWithoutTrailingSlash = appBasePath.replace(/\/$/, '');

function normalizePath(pathname: string) {
  const trimmed = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return validPaths.has(trimmed) ? trimmed : '/';
}

function stripBasePath(pathname: string) {
  if (appBasePath === '/') return pathname;
  if (pathname === appBasePathWithoutTrailingSlash) return '/';
  if (!pathname.startsWith(appBasePath)) return '/';
  return `/${pathname.slice(appBasePath.length).replace(/^\/+/, '')}`;
}

function hrefForPath(pathname: string) {
  const normalized = normalizePath(pathname);
  if (normalized === '/') return appBasePath;
  return `${appBasePath}${normalized.slice(1)}/`;
}

export function RouterProvider({ children }: PropsWithChildren) {
  const [pathname, setPathname] = useState(() => normalizePath(stripBasePath(window.location.pathname)));

  const navigate = useCallback((to: string) => {
    const nextPath = normalizePath(to);
    const href = hrefForPath(nextPath);
    if (href === window.location.pathname) return;
    window.history.pushState(null, '', href);
    setPathname(nextPath);
  }, []);

  useEffect(() => {
    const handlePopState = () => setPathname(normalizePath(stripBasePath(window.location.pathname)));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const normalized = normalizePath(stripBasePath(window.location.pathname));
    const href = hrefForPath(normalized);
    if (href !== window.location.pathname) {
      window.history.replaceState(null, '', href);
    }
  }, []);

  const value = useMemo(() => ({ pathname, navigate }), [pathname, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useLocation() {
  const router = useContext(RouterContext);
  if (!router) throw new Error('useLocation must be used inside RouterProvider.');
  return { pathname: router.pathname } as const;
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  readonly to: string;
};

export function Link({ to, onClick, children, ...props }: LinkProps) {
  const router = useContext(RouterContext);
  if (!router) throw new Error('Link must be used inside RouterProvider.');

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    router.navigate(to);
  };

  return <a href={hrefForPath(to)} onClick={handleClick} {...props}>{children}</a>;
}

export function NavLink({ to, className = '', ...props }: LinkProps) {
  const { pathname } = useLocation();
  const active = pathname === normalizePath(to);
  return <Link to={to} className={`${className} ${active ? 'active' : ''}`.trim()} aria-current={active ? 'page' : undefined} {...props} />;
}
