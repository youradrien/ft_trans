export class Router {
  private routes: Record<string, () => HTMLElement | void | Promise<HTMLElement | void>> = {};
  private outletId: string;

  constructor(outletId: string) {
    this.outletId = outletId;

    const outlet = document.getElementById(this.outletId);
    if (!outlet) {
      throw new Error(`Outlet with id "${this.outletId}" not found.`);
    }

    // Handle back/forward browser buttons
    window.addEventListener('popstate', () => this.loadRoute());

    // Initial load
    window.addEventListener('DOMContentLoaded', () => this.loadRoute());

    // Delegated click handler for links
    document.body.addEventListener('click', (e: MouseEvent) => {
      if (!e) {
        console.warn('Click event is null or undefined');
        return;
      }

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Find closest anchor tag in case event target is nested inside
      const anchor = target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (
        href &&
        // href.startsWith('/') &&
        !href.startsWith('//') &&
        !href.startsWith('/#')
      ) {
        e.preventDefault();
        this.navigate(href);
      }
    });
  }

  addRoute(path: string, renderFn: () => HTMLElement | void | Promise<HTMLElement | void>): void {
    this.routes[path] = renderFn;
  }

  navigate(path: string) {
    history.pushState(null, '', path);
    this.loadRoute();
  }

  async loadRoute(): Promise<void> {
    console.log('loadRoute triggered, path:', window.location.pathname);
    const path = window.location.pathname || '/';
    const outlet = document.getElementById(this.outletId);
    if (!outlet) {
      console.error(`Outlet with id "${this.outletId}" not found on route load.`);
      return;
    }

    const renderFn = this.routes[path] || this.routes['*'];
    outlet.innerHTML = '';

    if (renderFn) {
      try {
        const element = await renderFn();
        if (element instanceof HTMLElement) {
          outlet.appendChild(element);
        }
      } catch (err) {
        console.error('Error rendering route:', err);
      }
    } else {
      console.warn(`No route found for path: ${path}`);
    }
  }
}