import Page from '../template/page.ts';
import Profile from './profile.ts'; // adjust path as needed

type User = {
  username: string;
  avatar: string;
  wins: number;
  losses: number;
  // ...any other fields you need
};

export default class MainPage extends Page {
  async fetchOwnUser(): Promise<User | null> {
    try {
      const res = await fetch('http://localhost:3010/api/me-info', {
        credentials: 'include', // if your backend uses cookies/session
      });

      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      const user = await res.json();
      console.log(user);
      return user;
    } catch (err) {
      console.error('Error fetching user:', err);
      return null;
    }
  }

  async render(): Promise<HTMLElement> {
    const container = document.createElement('div');
    container.id = this.id;

    const content = document.createElement('div');
    content.style.width = '100%';

    // Fetch user and render their profile
    const user =null; // await this.fetchOwnUser();

    if (user || true == true) {
      const profilePage = new Profile('profile-page', this.router);
      const profileElement = await profilePage.render();
      content.appendChild(profileElement);
    } else {
      content.innerHTML = `<p style="color: red;">Could not load your profile.</p>`;
    }

    container.appendChild(content);
    return container;
  }
}