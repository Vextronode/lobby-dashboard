import { assertNever } from '@lobby/core';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MobileScreen } from './mobile/MobileScreen';
import { routeFor, type Route } from './route';
import { TvScreen } from './tv/TvScreen';

function Screen({ route }: { route: Route }) {
  switch (route) {
    case 'tv':
      return <TvScreen />;
    case 'mobile':
      return <MobileScreen />;
    default:
      return assertNever(route);
  }
}

const rootElement = document.getElementById('root');
if (rootElement === null) throw new Error('Missing #root element in index.html');

createRoot(rootElement).render(
  <StrictMode>
    <Screen route={routeFor(window.location.pathname)} />
  </StrictMode>,
);
