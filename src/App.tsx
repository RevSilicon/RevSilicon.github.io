import { lazy, Suspense } from 'react';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { useLocation } from './router';

/**
 * Parked pages, kept in the tree but not routed:
 * - pages/AboutPage.tsx: the Team / officers page
 * - pages/ProjectsPageFull.tsx: the full Projects page (accelerator, inference brief, process flow)
 * - pages/HomePageClassic.tsx: the Home page before the dark circuit-field redesign
 */

const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const JoinPage = lazy(() => import('./pages/JoinPage'));
const SponsorPage = lazy(() => import('./pages/SponsorPage'));

function RouteFallback() {
  return <main className="route-fallback" aria-label="Loading page" />;
}

export default function App() {
  const location = useLocation();
  let page: React.ReactNode;

  switch (location.pathname) {
    case '/':
      page = <HomePage />;
      break;
    case '/projects':
      page = <ProjectsPage />;
      break;
    case '/join':
      page = <JoinPage />;
      break;
    case '/sponsor':
      page = <SponsorPage />;
      break;
    default:
      page = <HomePage />;
  }

  return (
    <Layout>
      <Suspense fallback={<RouteFallback />}>
        <div key={location.pathname}>{page}</div>
      </Suspense>
    </Layout>
  );
}
