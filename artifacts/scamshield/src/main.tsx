import { createRoot } from 'react-dom/client';
import { setBaseUrl } from '@workspace/api-client-react';

import './i18n'; // must be imported before App so translations are ready
import { API_BASE_URL } from './lib/api-config';
import App from './App';
import './index.css';

// Point every auto-generated React Query hook at the correct backend.
// customFetch will prepend this to all relative /api/... paths.
setBaseUrl(API_BASE_URL);

createRoot(document.getElementById('root')!).render(<App />);
