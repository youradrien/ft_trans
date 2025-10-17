import Page from '../template/page.ts';

type Me = {
  id: number;
  username: string;
  created_at?: string;
  last_online?: string;
  level?: number;
  avatar_url?: string;
};

export default class Profile extends Page {
  async render(): Promise<HTMLElement> {
    const container = document.createElement('div');
    container.id = this.id;

    container.style.maxWidth = '720px';
    container.style.margin = '24px auto';
    container.style.padding = '20px';
    container.style.borderRadius = '12px';
    container.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)';
    container.style.background = '#fff';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '16px';

    container.innerHTML = `
      <h2 style="margin:0;font-size:1.6rem;color:#222;">My Profile</h2>
      <div id="status" style="color:#666;">Loading…</div>
      <div id="profile" style="display:none;">
        <div style="display:flex;align-items:center;gap:16px;">
          <img id="avatar" alt="avatar" width="72" height="72"
               style="border-radius:50%;object-fit:cover;background:#eee" />
          <div>
            <div id="username" style="font-weight:700;font-size:1.2rem;color:#111;"></div>
            <div id="level" style="color:#444;"></div>
          </div>
        </div>
        <div style="color:#555;">
          <div><strong>Joined:</strong> <span id="created"></span></div>
          <div><strong>Last online:</strong> <span id="lastOnline"></span></div>
          <div><strong>ID:</strong> <span id="userId"></span></div>
        </div>
        <div style="display:flex;gap:8px;margin-top:8px;">
          <label for="avatarUpload" id="uploadBtn" style="${btnUpload}" title="Upload avatar">
            Upload Avatar
            <input type="file" id="avatarUpload" accept="image/*" style="display:none;" />
          </label>
          <button id="homeBtn" style="${btnPrimary}">Home</button>
          <button id="logoutBtn" style="${btnDanger}">Logout</button>
        </div>
      </div>
    `;

    const statusEl = container.querySelector('#status') as HTMLElement;
    const profileEl = container.querySelector('#profile') as HTMLElement;

    const load = async () => {
      statusEl.textContent = 'Loading…';
      profileEl.style.display = 'none';
      try {
        const res = await fetch('http://localhost:3010/api/me', {
          credentials: 'include',
        });

        if (res.status === 401) {
          statusEl.innerHTML = `You are not logged in.`;
          // Optionally redirect:
          // this.router.navigate('/login');
          return;
        }

        if (!res.ok) {
          statusEl.textContent = `Error: ${res.status}`;
          return;
        }

  const me: Me = await res.json();

        // Fill UI
        (container.querySelector('#username') as HTMLElement).textContent = me.username ?? '';
        (container.querySelector('#level') as HTMLElement).textContent = `Level: ${me.level ?? 0}`;
        (container.querySelector('#created') as HTMLElement).textContent = me.created_at ?? '—';
        (container.querySelector('#lastOnline') as HTMLElement).textContent = me.last_online ?? '—';
        (container.querySelector('#userId') as HTMLElement).textContent = String(me.id);

        const avatar = container.querySelector('#avatar') as HTMLImageElement;
  avatar.src = `http://localhost:3010${me.avatar_url}` || 'https://dummyimage.com/72x72/262626/ffffff&text=42';

        statusEl.textContent = '';
        profileEl.style.display = 'block';
      } catch (e) {
        statusEl.textContent = 'Network error.';
      }
    };

    // Handle avatar upload
    const avatarInput = container.querySelector('#avatarUpload') as HTMLInputElement;
    avatarInput?.addEventListener('change', async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('avatar', file);

      try {
        statusEl.textContent = 'Uploading avatar…';
        const res = await fetch('http://localhost:3010/api/me/avatar', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (res.ok) {
          statusEl.textContent = 'Avatar uploaded!';
          await load(); // Reload profile to show new avatar
        } else {
          statusEl.textContent = 'Upload failed.';
        }
      } catch {
        statusEl.textContent = 'Network error during upload.';
      }
    });

    // Navigate to home
    container.querySelector('#homeBtn')?.addEventListener('click', () => {
      this.router.navigate('/');
    });

    await load();
    return container;
  }
}

const btnUpload = `
  padding: 8px 12px;
  background:#28a745;color:#fff;border:none;border-radius:6px;
  cursor:pointer;transition:filter .2s;
`;
const btnPrimary = `
  padding: 8px 12px;
  background:#007bff;color:#fff;border:none;border-radius:6px;
  cursor:pointer;transition:filter .2s;
`;
const btnDanger = `
  padding: 8px 12px;
  background:#dc3545;color:#fff;border:none;border-radius:6px;
  cursor:pointer;transition:filter .2s;
`;
