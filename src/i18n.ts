import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    // Define o idioma padrão caso o do navegador não seja encontrado
    fallbackLng: "pt", 

    // Ativamos o modo de depuração para ver o que está acontecendo no console
    debug: true, 

    interpolation: {
      escapeValue: false, // React já nos protege contra XSS
    },

    backend: {
      // Caminho para os arquivos de tradução na pasta 'public'
      // Esta linha é crucial e deve estar correta.
      loadPath: '/locales/{{lng}}/{{ns}}.json', 
    },
  });

export default i18n;