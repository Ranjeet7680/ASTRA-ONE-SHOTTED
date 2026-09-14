// Authentication & Comprehensive Player Profile Manager
import { apiClient } from './apiClient.js';

export class AuthManager {
  constructor() {
    this.currentUser = this.loadUser();
    if (this.currentUser) {
      // Sync session with backend in background
      apiClient.loginGuest(this.currentUser.name || 'Operator').catch(() => {});
    }
  }

  generatePlayerId() {
    const randDigits = Math.floor(1000000000 + Math.random() * 9000000000);
    return `ASTRA-${randDigits}`;
  }

  loadUser() {
    try {
      const saved = localStorage.getItem('astra_user_profile');
      if (saved) {
        const u = JSON.parse(saved);
        if (!u.id || !u.id.startsWith('ASTRA-')) {
          u.id = this.generatePlayerId();
        }
        if (u.deaths === undefined) u.deaths = Math.floor(u.kills * 0.45) || 12;
        if (u.wins === undefined) u.wins = Math.floor(u.matches * 0.65) || 8;
        if (u.damageDealt === undefined) u.damageDealt = u.kills * 115 || 4200;
        if (u.xp === undefined) u.xp = 3450;
        if (u.xpToNextLevel === undefined) u.xpToNextLevel = 5000;
        if (u.highestStreak === undefined) u.highestStreak = 7;
        return u;
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
      id: this.generatePlayerId(),
      provider: 'google',
      name: 'Agent ' + Math.floor(100 + Math.random() * 900),
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=GoogleAgent' + Math.floor(Math.random() * 100),
      level: 42,
      xp: 3820,
      xpToNextLevel: 5000,
      rank: 'ACE DOMINATOR',
      bp: 5850,
      credits: 420,
      matches: 34,
      wins: 24,
      losses: 10,
      kills: 178,
      deaths: 46,
      headshots: 58,
      damageDealt: 21450,
      highestStreak: 11
    };
    this.saveUser(user);
    return user;
  }

  loginWithFacebook() {
    const user = {
      id: this.generatePlayerId(),
      provider: 'facebook',
      name: 'Rebel ' + Math.floor(100 + Math.random() * 900),
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=FacebookRebel' + Math.floor(Math.random() * 100),
      level: 31,
      xp: 2640,
      xpToNextLevel: 4000,
      rank: 'CROWN II',
      bp: 3400,
      credits: 220,
      matches: 26,
      wins: 17,
      losses: 9,
      kills: 114,
      deaths: 38,
      headshots: 36,
      damageDealt: 13900,
      highestStreak: 8
    };
    this.saveUser(user);
    return user;
  }

  loginAsGuest(customName = '') {
    const name = customName.trim() || ('Operator_' + Math.floor(1000 + Math.random() * 9000));
    const user = {
      id: this.generatePlayerId(),
      provider: 'guest',
      name: name,
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(name),
      level: 18,
      xp: 1850,
      xpToNextLevel: 3000,
      rank: 'DIAMOND III',
      bp: 1850,
      credits: 90,
      matches: 16,
      wins: 11,
      losses: 5,
      kills: 68,
      deaths: 22,
      headshots: 24,
      damageDealt: 8400,
      highestStreak: 6
    };
    this.saveUser(user);

    // Asynchronously authenticate with backend server
    apiClient.loginGuest(name).catch(e => console.warn('Guest login backend sync offline:', e.message));

    return user;
  }

  recordMatch(matchStats) {
    if (!this.currentUser) return;
    const u = this.currentUser;

    const kills = matchStats.kills || 0;
    const deaths = matchStats.deaths || 0;
    const headshots = matchStats.headshots || 0;
    const damage = matchStats.damage || (kills * 100);
    const isWin = !!matchStats.isWin;

    u.matches++;
    if (isWin) u.wins++;
    else u.losses = (u.losses || 0) + 1;

    u.kills += kills;
    u.deaths += deaths;
    u.headshots += headshots;
    u.damageDealt = (u.damageDealt || 0) + damage;
    if (kills > (u.highestStreak || 0)) {
      u.highestStreak = kills;
    }

    // EXP & BP Reward
    const xpGained = kills * 110 + headshots * 40 + (isWin ? 500 : 250);
    const bpGained = Math.floor(kills * 25 + (isWin ? 150 : 75));

    u.xp = (u.xp || 0) + xpGained;
    u.bp = (u.bp || 0) + bpGained;

    // Level up check
    while (u.xp >= (u.xpToNextLevel || 3000)) {
      u.xp -= u.xpToNextLevel;
      u.level++;
      u.xpToNextLevel = Math.round((u.xpToNextLevel || 3000) * 1.15);
      u.bp += 300; // Bonus level-up BP
    }

    // Dynamic Rank Update
    const kd = u.kills / Math.max(1, u.deaths);
    if (kd >= 3.5 && u.level >= 35) u.rank = 'ACE DOMINATOR';
    else if (kd >= 2.8 && u.level >= 25) u.rank = 'CROWN I';
    else if (kd >= 2.2 && u.level >= 15) u.rank = 'DIAMOND II';
    else if (kd >= 1.5) u.rank = 'PLATINUM IV';
    else u.rank = 'GOLD I';

    this.saveUser(u);

    // Asynchronously submit match telemetry to authoritative backend
    apiClient.submitEvents('match_client_local', [{
      event_type: isWin ? 'MATCH_VICTORY' : 'MATCH_DEFEAT',
      metadata: { kills, deaths, headshots, damage, isWin }
    }]).catch(() => {});

    return {
      xpGained,
      bpGained,
      user: u
    };
  }

  setCallsign(newName) {
    if (!this.currentUser || !newName.trim()) return;
    this.currentUser.name = newName.trim();
    this.currentUser.avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(newName.trim())}`;
    this.saveUser(this.currentUser);
  }

  getKD() {
    if (!this.currentUser) return '0.00';
    const kd = this.currentUser.kills / Math.max(1, this.currentUser.deaths);
    return kd.toFixed(2);
  }

  getWinRate() {
    if (!this.currentUser || !this.currentUser.matches) return '0.0%';
    const wr = (this.currentUser.wins / this.currentUser.matches) * 100;
    return wr.toFixed(1) + '%';
  }

  getHeadshotRate() {
    if (!this.currentUser || !this.currentUser.kills) return '0.0%';
    const hr = (this.currentUser.headshots / this.currentUser.kills) * 100;
    return hr.toFixed(1) + '%';
  }

  getAvgDamage() {
    if (!this.currentUser || !this.currentUser.matches) return 0;
    return Math.round((this.currentUser.damageDealt || 0) / this.currentUser.matches);
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('astra_user_profile');
    apiClient.logout();
  }

  isLoggedIn() {
    return !!this.currentUser;
  }
}
