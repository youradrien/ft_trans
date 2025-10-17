import Page from '../template/page.ts';
import SinglePong from '../component/singlePong.ts'; // Your component-based page

export default class PlayPage extends Page {
  async render(): Promise<HTMLElement> {
    const container = document.createElement('div');
    container.id = this.id;

    const content = document.createElement('div');
    content.style.width = '100%';
    content.style.height = '100vh';
    content.style.padding = '2rem';
    content.style.textAlign = 'center';

    const header = document.createElement('h2');
    header.innerText = '🎮 Play Pong';
    content.appendChild(header);

    // 🟢 Searching players display
    const statusParagraph = document.createElement('p');
    statusParagraph.innerText = 'Looking for players...';
    content.appendChild(statusParagraph);

    // Fetch number of players searching for games
    try {
      const res = await fetch('http://localhost:3010/api/pong/status', {
        credentials: 'include'
      });
      const { searchingPlayers } = await res.json();
      console.log(searchingPlayers);
      statusParagraph.innerText = `🟢 ${searchingPlayers} player(s) searching for a game`;
    } catch (err) {
      statusParagraph.innerText = '⚠️ Could not load player status';
    }

    // 🎯 Single Player Button
    const singleBtn = document.createElement('button');
    singleBtn.innerText = '🎯 SINGLE-Player';
    singleBtn.style.margin = '1rem';
    singleBtn.onclick = async () => {
      const singlePage = new SinglePong('single-player', this.router);
      const singleElement = await singlePage.render();

      // Replace current content with single player game
      container.innerHTML = '';
      container.appendChild(singleElement);
    };
    content.appendChild(singleBtn);

    // 🎮 Multiplayer Button
    const multiBtn = document.createElement('button');
    multiBtn.innerText = '🎮 Multiplayer';
    multiBtn.style.margin = '1rem';
    multiBtn.onclick = () => {
      this.router.navigate('/pong/multiplayer');
    };
    content.appendChild(multiBtn);

    container.appendChild(content);
    return container;
  }
}