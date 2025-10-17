import Page from '../template/page.ts';

type Player = {
  username: string;
  avatar: string;
  elo: number;
};

export default class LeaderboardPage extends Page {
  constructor(id: string, router: any) {
    super(id, router);
  }

  async FETCH_PLAYERS(): Promise<Player[]> {
    try {
      const response = await fetch('http://localhost:3010/api/leaderboard', {
        credentials: 'include'
      });
      if (!response.ok)
        throw new Error(`API error: ${response.status} + ${response.json()}`);

      const data = await response.json();
      console.log(data);
      return data?.users; // Adjust this depending on how your API sends data
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      return [];
    }
  }

  async render(): Promise<HTMLElement> {
    const players = await this.FETCH_PLAYERS();
    const container = document.createElement('div');
    container.id = this.id;
    Object.assign(container.style, {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px',
      backgroundColor: '#111',
      color: 'white',
      fontFamily: '"Press Start 2P", cursive',
      minHeight: '70vh',
      maxHeight: '70vh',
    });
    container.innerHTML = `
      <h1 style="font-size: 24px; margin-bottom: 30px;">LEADERBOARD</h1>
      <div id="leaderboard" style="
        width: 100%;
        max-width: 700px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        cursor: crosshair;
      ">
        ${players.length === 0 ? '<div>No players found.</div>' : ''}
      </div>
    `;

    const list = container.querySelector('#leaderboard') as HTMLElement;
    const sortedPlayers = [...players].sort((a, b) => b.elo - a.elo);
    sortedPlayers.forEach((player, index) => {
      const card = document.createElement('div');
      card.style.display = 'flex';
      card.style.alignItems = 'center';
      card.style.justifyContent = 'space-between';
      card.style.padding = '16px';
      card.style.background = '#1c1c1c';
      card.style.border = '2px solid #333';
      card.style.borderRadius = '6px';
      card.style.boxShadow = '0 0 8px rgba(0, 255, 0, 0.1)';
      card.style.transition = 'transform 0.2s ease';
      card.innerHTML = `
        <div style="display: flex; align-items: center; gap: 16px; cursor: crosshair;">
          <div style="font-size: 12px; color: lime; cursor: crosshair;">#${index + 1}</div>
          <img src="${player.avatar}" alt="${player.username}" style="
            width: 48px;
            height: 48px;
            border-radius: 50%;
            border: 2px solid white;
          " />
          <div style="font-size: 12px;">${player.username}</div>
        </div>
        <div style="font-size: 12px; color: #0f0; cursor: crosshair;">${player.elo}</div>
      `;

      card.addEventListener('click', () => {
        this.router.navigate(`/profile/${player.username}`);
      });
      list.appendChild(card);
    });

    return container;
  }
}