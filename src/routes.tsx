import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { NotFound } from './shell/Placeholders';

// Lazy so Leaflet and each worker's screens stay out of the main bundle.
// Workers replace the default export of their own files; this table stays untouched.
const Welcome = lazy(() => import('./shell/Welcome'));
const Find = lazy(() => import('./screens/find/FindScreen'));
const Results = lazy(() => import('./screens/find/ResultsScreen'));
const ResultsMap = lazy(() => import('./screens/find/MapScreen'));
const ClinicDetail = lazy(() => import('./screens/clinic/ClinicDetailScreen'));
const RequestForm = lazy(() => import('./screens/clinic/RequestFormScreen'));
const Letter = lazy(() => import('./screens/clinic/LetterScreen'));
const Ask = lazy(() => import('./screens/ask/AskScreen'));
const Profile = lazy(() => import('./screens/profile/ProfileScreen'));
const NeedsEdit = lazy(() => import('./screens/profile/NeedsEditScreen'));
const LocationEdit = lazy(() => import('./screens/profile/LocationEditScreen'));

export const routes: RouteObject[] = [
  { path: '/', element: <Navigate to="/find" replace /> },
  { path: '/welcome', element: <Welcome /> }, // 01: shell placeholder, onboarding deferred
  { path: '/find', element: <Find /> }, // 04: C
  { path: '/results', element: <Results /> }, // 05 / 07: C
  { path: '/results/map', element: <ResultsMap /> }, // 06: C
  { path: '/clinic/:id', element: <ClinicDetail /> }, // 08: B
  { path: '/clinic/:id/request', element: <RequestForm /> }, // 09: B
  { path: '/clinic/:id/letter', element: <Letter /> }, // 10: B
  { path: '/ask', element: <Ask /> }, // 11: D
  { path: '/profile', element: <Profile /> }, // 12: A
  { path: '/profile/needs', element: <NeedsEdit /> }, // 02 edit: A
  { path: '/profile/location', element: <LocationEdit /> }, // 03 edit: A
  { path: '*', element: <NotFound /> },
];
