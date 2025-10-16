import Page from '../template/page.ts';

export default class Header extends Page {
  async render(): Promise<HTMLElement> {
    const container = document.createElement('div');
    container.id = this.id;

    // Add styles directly to container
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.padding = '20px';
    // container.style.backgroundColor = '#f8f9fa';
    container.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    container.style.position = 'sticky';
    container.style.top = '0';
    container.style.zIndex = '1000';

    // Inject inner HTML
    container.innerHTML = `
      <h1 style="
        margin: 0;
        font-size: 2.2rem;
        font-weight: 700;
        color: #333;
        transition: color 0.3s ease;
      ">Transcendance</h1>

      <h2 style="
        margin: 5px 0 15px 0;
        font-size: 1.2rem;
        font-weight: 400;
        color: #666;
      ">Home</h2>

      <div style="
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        justify-content: center;
      ">
        <button id="playBtn" style="${buttonStyle}">Play</button>
        <button id="leaderboardBtn" style="${buttonStyle}">Leaderboard</button>
        <button id="friendsBtn" style="${buttonStyle}">Friends</button>
        <button id="profileBtn" style="${buttonStyle}">Profile</button>
      </div>
    `;

    // Button event handlers
    container.querySelector('#leaderboardBtn')?.addEventListener('click', () => {
      this.router.navigate('/leaderboard');
    });
    container.querySelector('#playBtn')?.addEventListener('click', () => {
      this.router.navigate('/play');
    });
    container.querySelector('#friendsBtn')?.addEventListener('click', () => {
      this.router.navigate('/friends');
    });
    container.querySelector('#profileBtn')?.addEventListener('click', () => {
      this.router.navigate('/profile');
    });

    return container;
  }
}

// Reusable button styles
const buttonStyle = `
  padding: 10px 18px;
  font-size: 1rem;
  font-weight: 500;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
}
button:hover {
  background-color: #0056b3;
  transform: translateY(-2px);
}
`;