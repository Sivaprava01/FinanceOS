/**
 * Main App Component
 * Application root with routing and error boundary.
 */

import { useRoutes } from 'react-router-dom';
import { ErrorBoundary } from '@components/ErrorBoundary';
import { routes } from '@routes/index';

function App() {
  const element = useRoutes(routes);
  return <ErrorBoundary>{element}</ErrorBoundary>;
}

export default App;
