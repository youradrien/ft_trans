import Page from '../template/page.ts';
import Header from './header.ts';

export default class MainPage extends Page {
  async render(): Promise<HTMLElement> {
    const container = document.createElement('div');
    container.id = this.id;

    // Add header if authenticated
    if (true === true /* isAuthenticated && this.id !== 'auth-page' */) {
      const header = new Header('header', this.router);
      const headerElement = await header.render();
      container.appendChild(headerElement);
    }

    // Create a separate div for page content
    const content = document.createElement('div');
    content.innerHTML = `<button>brrr</button>`;
    container.appendChild(content);

    return container;
  }
}