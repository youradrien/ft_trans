import HomePage from './pages/home';
import { Router } from '../router';
import Play from './pages/play';
import NTFoundPage from './pages/404';
import AuthPage from './pages/auth';

export class App {
  private router = new Router('app');

  constructor() {
    this.setupRoutes();
  }

  private async check_authentication(): Promise<boolean>{
    try {
        const res = await fetch('http://localhost:3010/api/me', { credentials: 'include' });
        const data = await res.json();
        if (data && data.success)
          {
            return true ;
        }
        return false ;
    } catch {
        return false ;
    }
  }

  private setupRoutes(): void {
    this.router.addRoute('/', async () => {
    
          return this.renderPage(HomePage, 'main-page');
   
    });

    this.router.addRoute('/auth', async () => {
        return this.renderPage(AuthPage, 'auth-page');
    });

    this.router.addRoute('/play', async () => {
        return this.renderPage(Play, 'play-page');
    });
    // this.router.addRoute('/play', () => {
    //   return this.renderPage(PlayPage, 'play-page', false);
    // });


    // 🧱 catch-all fallback for unknown routes
    this.router.addRoute('*', async () => {
      return this.renderPage(NTFoundPage, 'not-found-page');
    });
    
    this.router.loadRoute();


  }


  private async renderPage<T extends new (id: string, router: any) => { render: () => Promise<HTMLElement> }>(
        PageClass: T, // any <T>
        id: string,
    ): Promise<void> 
    {
        // auth for each rendered page
        const isAuthenticated = await this.check_authentication();
        if (!isAuthenticated && !(id == 'login-page' || id == 'auth-page'))
        {
            this.router.navigate('/auth');
            return;
        }
        

        // complete DOM clear before every rendering
        const app = document.getElementById('app')!;
        while (app.firstChild) {
            app.removeChild(app.firstChild);
        }

        const page = new PageClass(id, {
          navigate: (route: string) => this.router.navigate(route)
        });
        const pageElement = await page.render();
        app.appendChild(pageElement);
    }
}

export default App;