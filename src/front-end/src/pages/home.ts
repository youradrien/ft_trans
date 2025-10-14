// src/main/index.ts (main page of trans)
import Page from '../template/page.ts';

export default class MainPage extends Page {
  async render(): Promise<HTMLElement> 
  {
    const container = document.createElement('div');
    container.id = this.id;
    container.innerHTML = `
      <h1>Transcendance</h1>
      <h2>Home</h2>
      <button id="playBtn">Play</button>
      <button id="leaderboardBtn">Leaderboard</button>
      <button id="friendsBtn">Friends</button>
    `;

    container.querySelector('#playBtn')?.addEventListener('click', () => {
      this.router.navigate('/play');
    });
    container.querySelector('#leaderboardBtn')?.addEventListener('click', () => {
      this.router.navigate('/leaderboard');
    });
    container.querySelector('#friendsBtn')?.addEventListener('click', () => {
      this.router.navigate('/friends');
    });

    return container;
  }
}
