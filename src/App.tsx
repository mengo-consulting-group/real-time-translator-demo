import React from "react";
import Transcript from "@/components/Transcript";
import { theme } from "@/config/theme";
import "./App.css";

const App: React.FC = () => {
  return (
    <div className="app-container">
      <header className="app-header">
        <img
          src={theme.logoUrl}
          alt={theme.clientName}
          className="app-logo"
        />
        <h1 className="app-title">{theme.clientName}</h1>
        <div className="rec-indicator">
          <span className="rec-dot"></span>
          <span className="rec-text">Recording / Grabando</span>
        </div>
      </header>
      <Transcript />
      <footer className="app-footer">
        <div className="language-hint">
          🗣️ To add a language, say: <strong>"Hey Translator, add [language]"</strong> — To remove it: <strong>"Hey Translator, remove"</strong>
          <br />
          🗣️ Para agregar un idioma, diga: <strong>"Hey Traductor, agregar [idioma]"</strong> — Para quitarlo: <strong>"Hey Traductor, quitar"</strong>
        </div>
        <div>
          Powered by: <a href="https://proxy4.ai" target="_blank" rel="noopener noreferrer">proxy4.ai</a>
        </div>
      </footer>
    </div>
  );
};

export default App;