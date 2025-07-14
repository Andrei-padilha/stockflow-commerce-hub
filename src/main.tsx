import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { Suspense } from 'react';

// Esta linha é a mais importante, ela inicializa o i18next
import './i18n';

// O Suspense é necessário para aguardar o carregamento do JSON de tradução
createRoot(document.getElementById("root")!).render(
  <Suspense fallback="Carregando...">
    <App />
  </Suspense>
);