/**
 * Main App Component
 * Application root with routing.
 */

import { useRoutes } from 'react-router-dom';
import { routes } from '@routes/index';

function App() {
  const element = useRoutes(routes);
  return element;
}

export default App;
