import Page from '../template/page.ts';
import SinglePong from '../component/singlePong.ts';

export default class PlayPage extends Page {
  async render(): Promise<HTMLElement> {
    const container = document.createElement('div');
    container.id = this.id;
    container.innerHTML = `
      <div id="play-content" style="
        width: 100%;
        height: 100vh;
        padding: 2rem;
        text-align: center;
        font-family: 'Press Start 2P', cursive;
        position: relative;
      ">
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">

        <h1>🎮 Play Pong</h1>
        <p style="margin-bottom: 0.2rem;" id="player-status">Looking for players...</p>
        <p style="margin-bottom: 0.2rem;" id="rooms-status">Looking for any rooms?...</p>
        <div id="active-games" style="margin-top: 3rem;
            min-width: 500px; 
            background-color: rgba(35, 35, 35, 0.5);
        ">
          <h2 style="margin-bottom: 1rem;">🏓 Active Games</h2>
          <div id="game-list" style="display: flex; flex-direction: column; gap: 1rem;"></div>
        </div>

        <div style="margin-top: 2rem; position: relative;">
          <button id="singleBtn" style="margin: 1rem;">🎯 SINGLE-Player</button>

          <div style="display: inline-block; position: relative;">
            <button id="multiBtn" style="margin: 1rem; position: relative;">
              🚀 Queue for Match
            </button>
            <span id="queue-count" style="
              position: absolute;
              top: -10px;
              right: -10px;
              background: #00ff00;
              color: black;
              font-size: 10px;
              padding: 4px 6px;
              border-radius: 10px;
              font-weight: bold;
              box-shadow: 0 0 6px rgba(0,0,0,0.4);
            ">0</span>
          </div>
        </div>
      </div>
    `;
    const p_st = container.querySelector('#player-status') as HTMLParagraphElement;
    const r_st = container.querySelector('#rooms-status') as HTMLParagraphElement;
    const q_btn = container.querySelector('#multiBtn') as HTMLButtonElement;

    // stats of current serv state
    // so : players in queue, rooms, total online plyr count
    try {
        const res = await fetch('http://localhost:3010/api/pong/status', {
          credentials: 'include'
        });
        const data = await res.json();
        const qc = container.querySelector('#queue-count') as HTMLSpanElement;
        const online = data?.data?.queuedPlayers ?? 0;
        if(data?.data?.joinedQueue)
        {
            q_btn.style.backgroundColor = '#00cc44';  // Green background
            q_btn.style.color = 'white';              // White text
            q_btn.innerText = '✅ Queued!';
        }
        r_st.innerText = `🔵 ${data?.data?.activeRooms} currently active pong room(s)...`;
        p_st.innerText = `🟢 ${online} player(s) in queue`;
        qc.innerText = String(online);
    } catch (err) {
        const p_st = container.querySelector('#player-status') as HTMLParagraphElement;
        p_st.innerText = '⚠️ Could not load player status';
    }

    // single player btn handler
    const s = container.querySelector('#singleBtn') as HTMLButtonElement;
    s.onclick = async () => {
      const sp = new SinglePong('single-player', this.router);
      const ss = await sp.render();
      container.innerHTML = '';
      container.appendChild(ss);
    };

    // whole func dedicated to update active games data
    const fetch_games = async () => {
        try {
        const res = await fetch('http://localhost:3010/api/pong/active-games', {
          credentials: 'include'
        });
        const data = await res.json();
        console.log(data);
        if (data.success) {
          const _gl = container.querySelector('#game-list') as HTMLDivElement;

          data.data.forEach((game: any) => {
                const _game_bx = document.createElement('div');
                _game_bx.style.padding = '1rem';
                _game_bx.style.border = '1px solid #444';
                _game_bx.style.borderRadius = '12px';
                _game_bx.style.backgroundColor = '#1e1e1e';
                _game_bx.style.color = '#f1f1f1';
                _game_bx.style.fontSize = '0.85rem';
                _game_bx.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
                _game_bx.style.display = 'flex';
                _game_bx.style.flexDirection = 'column';
                _game_bx.style.alignItems = 'center';
                _game_bx.style.justifyContent = 'center';
                _game_bx.style.minWidth = '220px';

                const idP = document.createElement('p');
                idP.style.margin = '0 0 0.5rem';
                idP.style.fontWeight = 'bold';
                idP.style.color = '#888';
                idP.textContent = `🏓 Game ID: ${game.id}`;

                const scoreP = document.createElement('p');
                scoreP.style.margin = '0';
                scoreP.style.fontSize = '0.95rem';
                scoreP.textContent = `${game.player1.username} [${game.player1.score}] vs ${game.player2.username} [${game.player2.score}]`;

                // Append to box
                _game_bx.appendChild(idP);
                _game_bx.appendChild(scoreP);

                // Add to game list
                _gl.appendChild(_game_bx);
          });
        }
      } catch (err) {
        console.error('Failed to fetch active games:', err);
      }
    }

    // (queue) btn handler
    q_btn.onclick = async () => {
      try {
        const socket = new WebSocket('ws://localhost:3010/api/pong/ws');

        socket.onmessage = async (msg) => {
            const data = JSON.parse(msg.data);
            // console.log(data);
            const qc = container.querySelector('#queue-count') as HTMLSpanElement;
            const queueBtn = container.querySelector('#multiBtn') as HTMLButtonElement;

            if(data?.queueLength >= 0){
              qc.innerText = String(data?.queueLength);
              p_st.innerText = `🟢 ${data?.queueLength} player(s) in queue`;
            }
            if(data?.type == "waiting")
            {
                queueBtn.style.backgroundColor = '#00cc44';  // Green background
                queueBtn.style.color = 'white';              // White text
                queueBtn.innerText = '✅ Queued!';
            }
            if(data?.type == "creating")
            {
                queueBtn.style.backgroundColor = '#1383e4ff';  // Green background
                queueBtn.style.color = 'white';              // White text
                queueBtn.innerText = '🔵 creating game...';
                r_st.innerText = `🔵 ${data?.roomsLength} currently active pong room(s)...`;
                qc.innerText = '';
                await fetch_games();  
            }
            if(data?.type == "waiting-update")
            {
                p_st.innerText = `🟢 ${data?.queueLength} player(s) in queue`;
                r_st.innerText = `🔵 ${data?.roomsLength} currently active pong room(s)...`;
                await fetch_games();
            }
            if(data?.type == "error")
            {
              alert(data.message);
            }
        };
      } catch (err) {
      }
    };

    return container;
  }
}
