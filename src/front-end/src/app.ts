import HomePage from './pages/home';
import { Router } from '../router';
import VitePage from './pages/vitepage';
import NTFoundPage from './pages/404';

export class App {
  private router = new Router('app');

  constructor() {
    this.setupRoutes();
  }

  private async check_authentication(): Promise<boolean>{
    return true;
    try {
        const res = await fetch('/api/me', { credentials: 'include' });
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

    // this.router.addRoute('/login', async () => {
    //   const auth = await this.ensureAuthenticated();
    //   if (auth.success) {
    //     this.router.navigate('/dashboard');
    //   } else {
    //     await this.renderPage(LoginPage, 'login-page', false);
    //   }
    // });

    // this.router.addRoute('/play', () => {
    //   return this.renderPage(PlayPage, 'play-page', false);
    // });

    this.router.addRoute('/vite-demo', async () => {
      return this.renderPage(VitePage, 'vite-demo-page');
    });

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
        if (!isAuthenticated && !(id == 'login-page' || id == 'register-page'))
        {
            this.router.navigate('/home');
            return;
        }
        console.log("rendering " + id );

        // complete DOM clear before every rendering
        const app = document.getElementById('app')!;
        while (app.firstChild) {
            app.removeChild(app.firstChild);
        }

        // header for every page
        // const headerContainer = document.createElement('div');
        // headerContainer.innerHTML = createHeader();
        // app.appendChild(headerContainer.firstElementChild as HTMLElement);

        const page = new PageClass(id, {
          navigate: (route: string) => this.router.navigate(route)
        });
        const pageElement = await page.render();
        app.appendChild(pageElement);
    }
}

export default App;