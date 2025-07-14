import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";

i18n
  .use(HttpBackend) // Carrega traduções de um backend (nossos arquivos JSON)
  .use(initReactI18next) // Passa a instância do i18n para o react-i18next
  .init({
    fallbackLng: "pt", // Língua padrão caso a do navegador não seja encontrada
    debug: true, // Mostra logs no console, útil para desenvolvimento
    interpolation: {
      escapeValue: false, // React já protege contra XSS
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json', // Caminho para os arquivos de tradução
    },
  });

export default i18n;