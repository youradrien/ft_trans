import Page from '../template/page.ts';


export default class SinglePong extends Page {
  private multiplayer: boolean;
  private socket?: WebSocket;


  constructor(id: string, router: { navigate: (path: string) => void }, options?: any) {
    super(id, router, options); // ✅ Pass required args
    this.multiplayer = options?.multiplayer ?? false;
    this.socket = options?.socket;
  }

  async render(): Promise<HTMLElement> {
    const CONTAINER = document.createElement('div');
    CONTAINER.id = this.id;

    const _score = document.createElement('div');
    _score.style.display = 'flex';
    _score.style.justifyContent = 'space-between';
    _score.style.width = '800px';
    _score.style.marginBottom = '1rem';
    _score.style.fontSize = '2rem';

    const p1 = document.createElement('span');
    p1.id = 'player1-score';
    p1.textContent = 'Player 1: 0';
    _score.appendChild(p1);

    const p2 = document.createElement('span');
    p2.id = 'player2-score';
    p2.textContent = 'Player 2: 0';
    _score.appendChild(p2);
    CONTAINER.appendChild(_score);
    const c = document.createElement('canvas');
    c.id = 'pongCanvas';
    c.width = 900;  // Set your desired width
    c.height = 600; // Set your desired height
    CONTAINER.appendChild(c);

    // Start button
    const startButton = document.createElement('button');
    startButton.textContent = 'Start Game';
    startButton.id = 'startGameBtn';
    CONTAINER.appendChild(startButton);

    this.initPong(c, startButton, p1, p2);
    return CONTAINER;
  }

  private initPong(canvas: HTMLCanvasElement, startButton: HTMLButtonElement, p1ScoreEl: HTMLElement, p2ScoreEl: HTMLElement): void {
    const ctx = canvas.getContext('2d')!;
    if (!ctx) {
      console.error('Could not get 2D rendering context');
      return;
    }

    // Game constants
    const PADDLE_WIDTH = 10;
    const PADDLE_HEIGHT = 80;
    const PADDLE_SPEED = 5;
    const BALL_RADIUS = 10;
    const DEFAULT_BALL_SPEED = 5;

    // Game state
    let gameStarted = false;
    const gameState = {
      ball: { x: canvas.width / 2, y: canvas.height / 2, speedX: DEFAULT_BALL_SPEED, speedY: DEFAULT_BALL_SPEED },
      paddles: { player1Y: canvas.height / 2 - PADDLE_HEIGHT / 2, player2Y: canvas.height / 2 - PADDLE_HEIGHT / 2 },
      score: { player1: 0, player2: 0 },
      keys: { w: false, s: false, ArrowUp: false, ArrowDown: false, ' ': false },
    };

    const PONG_ART = 
      `██████╗ ███████╗███╗   ██╗ ██████╗ 
      ██╔══██╗██║   ██║████╗  ██║██╔════╝ 
      ██████╔╝██║   ██║██╔██╗ ██║██║  ███╗
      ██╔═══╝ ██║   ██║██║╚██╗██║██║   ██║
      ██║     ╚██████╔╝██║ ╚████║╚██████╔╝
      ╚═╝      ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝`;

    startButton.addEventListener('click', () => {
      if (!gameStarted) {
        gameStarted = true;
        reset_ball(true);
      }
    });

    const reset_ball = (initialReset = false) => {
      gameState.ball.x = canvas.width / 2;
      gameState.ball.y = canvas.height / 2;
      // Alternate starting direction
      gameState.ball.speedX = initialReset ? DEFAULT_BALL_SPEED : -gameState.ball.speedX;
      gameState.ball.speedY = DEFAULT_BALL_SPEED;
    };

    const update = () => {
      if (!gameStarted) return;

      // Move ball
      gameState.ball.x += gameState.ball.speedX;
      gameState.ball.y += gameState.ball.speedY;

      // Move paddles
      if (gameState.keys.w) gameState.paddles.player1Y -= PADDLE_SPEED;
      if (gameState.keys.s) gameState.paddles.player1Y += PADDLE_SPEED;
      if (gameState.keys.ArrowUp) gameState.paddles.player2Y -= PADDLE_SPEED;
      if (gameState.keys.ArrowDown) gameState.paddles.player2Y += PADDLE_SPEED;

      // Clamp paddles to canvas
      gameState.paddles.player1Y = Math.max(0, Math.min(gameState.paddles.player1Y, canvas.height - PADDLE_HEIGHT));
      gameState.paddles.player2Y = Math.max(0, Math.min(gameState.paddles.player2Y, canvas.height - PADDLE_HEIGHT));

      // Ball collision with top/bottom walls
      if (gameState.ball.y + BALL_RADIUS > canvas.height || gameState.ball.y - BALL_RADIUS < 0) {
        gameState.ball.speedY = -gameState.ball.speedY;
      }

      // Ball collision with paddles
      _paddle_collision(gameState.paddles.player1Y, 20 + PADDLE_WIDTH, 1);
      _paddle_collision(gameState.paddles.player2Y, canvas.width - 30, -1);

      // Score detection
      if (gameState.ball.x + BALL_RADIUS > canvas.width) {
        gameState.score.player1++;
        p1ScoreEl.textContent = `Player 1: ${gameState.score.player1}`;
        gameStarted = false;
        reset_ball();
      } else if (gameState.ball.x - BALL_RADIUS < 0) {
        gameState.score.player2++;
        p2ScoreEl.textContent = `Player 2: ${gameState.score.player2}`;
        gameStarted = false;
        reset_ball();
      }
    };

    const _paddle_collision = (paddleY: number, paddleX: number, direction: 1 | -1) => {
      const ball = gameState.ball;
      const paddleCollision =
        direction === 1
          ? ball.x - BALL_RADIUS < paddleX
          : ball.x + BALL_RADIUS > paddleX;

      if (paddleCollision && ball.y > paddleY && ball.y < paddleY + PADDLE_HEIGHT) {
        const relativeIntersectY = paddleY + PADDLE_HEIGHT / 2 - ball.y;
        const normalizedIntersectY = relativeIntersectY / (PADDLE_HEIGHT / 2);
        const bounceAngle = normalizedIntersectY * (Math.PI / 3); // Max 60 degrees

        ball.speedX = DEFAULT_BALL_SPEED * Math.cos(bounceAngle) * direction;
        ball.speedY = DEFAULT_BALL_SPEED * -Math.sin(bounceAngle);

        // Increase speed slightly on hit
        ball.speedX *= 1.05;
        ball.speedY *= 1.05;
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // field
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 5;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);

      // PONG title with transparency
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = 'white';
      ctx.font = '32px "Courier New", Courier, monospace';
      ctx.textAlign = 'center';
      const lines = PONG_ART.split('\n');
      const lineHeight = 35;
      const startY = (canvas.height - (lines.length * lineHeight)) / 2 + lineHeight;
      lines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, startY + (index * lineHeight));
      });
      ctx.restore();
      // ball
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(gameState.ball.x, gameState.ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      // paddles
      ctx.fillRect(20, gameState.paddles.player1Y, PADDLE_WIDTH, PADDLE_HEIGHT);
      ctx.fillRect(canvas.width - 30, gameState.paddles.player2Y, PADDLE_WIDTH, PADDLE_HEIGHT);
    };

    const gameLoop = () => {
      update();
      draw();
      requestAnimationFrame(gameLoop);
    };

    // Event Listeners
    const handleKeyEvent = (e: KeyboardEvent, isDown: boolean) => {
      if (e.key === ' ' && isDown && !gameStarted) {
        e.preventDefault(); // Prevent scrolling
        gameStarted = true;
        reset_ball(true);
      }
      // Check for movement keys
      else if (e.key === 'w' || e.key === 's' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        (gameState.keys as any)[e.key] = isDown;
      }
    };
    document.addEventListener('keydown', (e) => handleKeyEvent(e, true));
    document.addEventListener('keyup', (e) => handleKeyEvent(e, false));

    gameLoop();
  }
}