import { Suspense } from 'react';
import { BrowserRouter, useRoutes } from 'react-router-dom';
import { ProfileProvider } from './shell/ProfileProvider';
import { routes } from './routes';

function Routes() {
  return <Suspense fallback={<p className="visually-hidden" role="status">Loading</p>}>{useRoutes(routes)}</Suspense>;
}

export default function App() {
  return (
    <ProfileProvider>
      <BrowserRouter>
        <a className="skip-link" href="#main">Skip to content</a>
        <Routes />
      </BrowserRouter>
    </ProfileProvider>
  );
}
