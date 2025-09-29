// src/pages/VitePage.ts
import { setupCounter } from './counter.ts';
import typescriptLogo from '../typescript.svg';
import viteLogo from '/vite.svg';

export default class VitePage {
  // constructor(private id: string, private router: { navigate: (route: string) => void }) {}

  async render(): Promise<HTMLElement> {
    const container = document.createElement('div');

    container.innerHTML = `
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src="${viteLogo}" class="logo" alt="Vite logo" />
        </a>
        <a href="https://www.typescriptlang.org/" target="_blank">
          <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
        </a>
        <h1>TRANSENDANCEEEEE Vite + TypeScript</h1>
        <div class="card">
          <button id="counter" type="button"></button>
        </div>
        <p class="read-the-docs">
          Click on the Vite and TypeScript logos to learn more
        </p>
        <button class="bg-blue-500 text-white px-4 py-2 rounded">
          Tailwind Button
        </button>
      </div>
    `;

    // Wire up the counter button
    const counterBtn = container.querySelector<HTMLButtonElement>('#counter');
    if (counterBtn) {
      setupCounter(counterBtn);
    }

    return container;
  }
}
