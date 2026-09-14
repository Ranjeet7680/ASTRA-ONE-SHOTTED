// Authentication Manager: Google, Facebook, Guest Profiles with Local Persistence
export class AuthManager {
  constructor() {
    this.currentUser = this.loadUser();
  }

  loadUser() {
    try {
      const saved = localStorage.getItem('astra_user_profile');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not load user profile', e);
    }
    return null;
  }

  saveUser(user) {
    this.currentUser = user;
    try {
      localStorage.setItem('astra_user_profile', JSON.stringify(user));
    } catch (e) {
      console.warn('Could not save user profile', e);
    }
  }

  loginWithGoogle() {
    const user = {
      id: 'g_' + Math.floor(Math.random() * 100000),
      provider: 'google',
      name: 'Agent ' + Math.floor(100 + Math.random() * 900),
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=GoogleAgent' + Math.floor(Math.random() * 100),
      level: 38,
      rank: 'DIAMOND II',
      bp: 4850,
      credits: 320,
      kills: 142,
      matches: 28
    };
    this.saveUser(user);
    return user;
  }

  loginWithFacebook() {
    const user = {
      id: 'fb_' + Math.floor(Math.random() * 100000),
      provider: 'facebook',
      name: 'Rebel ' + Math.floor(100 + Math.random() * 900),
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=FacebookRebel' + Math.floor(Math.random() * 100),
      level: 26,
      rank: 'PLATINUM IV',
      bp: 2640,
      credits: 150,
      kills: 88,
      matches: 19
    };
    this.saveUser(user);
    return user;
  }

  loginAsGuest(customName = '') {
    const name = customName.trim() || ('Guest_' + Math.floor(1000 + Math.random() * 9000));
    const user = {
      id: 'guest_' + Math.floor(Math.random() * 100000),
      provider: 'guest',
      name: name,
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=' + name,
      level: 14,
      rank: 'GOLD I',
      bp: 1200,
      credits: 60,
      kills: 45,
      matches: 11
    };
    this.saveUser(user);
    return user;
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('astra_user_profile');
  }

  isLoggedIn() {
    return !!this.currentUser;
  }
}
