import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n'; // Importe o arquivo de configuração que criamos
import { Suspense } from 'react';

// Envolvemos o App com Suspense para aguardar o carregamento dos arquivos de tradução
createRoot(document.getElementById("root")!).render(
  <Suspense fallback="Carregando...">
    <App />
  </Suspense>
);