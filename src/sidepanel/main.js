// src/sidepanel/main.js
import { initAuth } from './auth.js';
import { initUI } from './ui.js';
import { initChat, initActionListeners } from './chat.js';
import { initFiles } from './files.js';
import { carregarSkillsDinamicas } from './skills.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log("Inicializando o Side Panel Modularizado...");
    initUI();
    await carregarSkillsDinamicas();
    initAuth();
    initChat();
    initFiles();
    initActionListeners();
});
