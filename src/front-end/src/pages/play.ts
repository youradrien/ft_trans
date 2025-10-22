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
        <p id="player-status">Looking for players...</p>
        <p id="rooms-status">Looking for any rooms?...</p>

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

    // stats of current serv state
    // so : players in queue, rooms, total online plyr count
    try {
        const res = await fetch('http://localhost:3010/api/pong/status', {
          credentials: 'include'
        });
        const data = await res.json();
        // console.log(data);
        const sss = container.querySelector('#player-status') as HTMLParagraphElement;
        const qc = container.querySelector('#queue-count') as HTMLSpanElement;
        const online = data?.data?.queuedPlayers ?? 0;
        if(data?.data?.joinedQueue)
        {
            const q_btn = container.querySelector('#multiBtn') as HTMLButtonElement;
            q_btn.style.backgroundColor = '#00cc44';  // Green background
            q_btn.style.color = 'white';              // White text
            q_btn.innerText = '✅ Queued!';
        }
        sss.innerText = `🟢 ${online} player(s) in queue`;
        qc.innerText = String(online);
    } catch (err) {
        const sss = container.querySelector('#player-status') as HTMLParagraphElement;
        sss.innerText = '⚠️ Could not load player status';
    }

    // single player btn handler
    const s = container.querySelector('#singleBtn') as HTMLButtonElement;
    s.onclick = async () => {
      const sp = new SinglePong('single-player', this.router);
      const ss = await sp.render();
      container.innerHTML = '';
      container.appendChild(ss);
    };

    // (queue) btn handler
    const queue_btn = container.querySelector('#multiBtn') as HTMLButtonElement;
    queue_btn.onclick = async () => {
      try {
        const socket = new WebSocket('ws://localhost:3010/api/pong/ws');

        socket.onmessage = (msg) => {
            const data = JSON.parse(msg.data);
            // console.log(data);
            const sss = container.querySelector('#player-status') as HTMLParagraphElement;
            const qc = container.querySelector('#queue-count') as HTMLSpanElement;
            const queueBtn = container.querySelector('#multiBtn') as HTMLButtonElement;

            if(data?.queueLength >= 0){
              qc.innerText = String(data?.queueLength);
              sss.innerText = `🟢 ${data?.queueLength} player(s) in queue`;
            }
            if(data?.type == "waiting")
            {
                queueBtn.style.backgroundColor = '#00cc44';  // Green background
                queueBtn.style.color = 'white';              // White text
                queueBtn.innerText = '✅ Queued!';
            }
            if(data?.type == "waiting-update")
            {
                sss.innerText = `🟢 ${data?.queueLength} player(s) in queue`;
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
