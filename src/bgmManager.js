// Background Music Manager for ASTRA: One Shotted
// Manages playback of thematic and Indian soundtrack tracks with smooth crossfading,
// playlist cycling, volume controls, and user interaction unlocking.

export const BGM_TRACKS = [
  {
    id: 'astra',
    title: 'ASTRA (Main Theme)',
    hindiTitle: 'एस्ट्रा (थीम म्यूजिक)',
    artist: 'ASTRA Soundworks',
    file: '/audio/astra.mp3'
  },
  {
    id: 'antim_mauka',
    title: 'Antim Mauka (Last Chance)',
    hindiTitle: 'अंतिम मौका',
    artist: 'Warzone Studio',
    file: '/audio/antim_mauka.mp3'
  },
  {
    id: 'ek_hi_waar',
    title: 'Ek Hi Waar (One Strike)',
    hindiTitle: 'एक ही वार',
    artist: 'Warzone Studio',
    file: '/audio/ek_hi_waar.mp3'
  },
  {
    id: 'aakhri_nishana',
    title: 'Aakhri Nishana (Final Target)',
    hindiTitle: 'आखिरी निशाना',
    artist: 'Warzone Studio',
    file: '/audio/aakhri_nishana.mp3'
  },
  {
    id: 'aakhri_nishana_alt',
    title: 'Aakhri Nishana (Tactical Mix)',
    hindiTitle: 'आखिरी निशाना (रीमिक्स)',
    artist: 'Warzone Studio',
    file: '/audio/aakhri_nishana_alt.mp3'
  }
];

export class BgmManager {
  constructor(game) {
    this.game = game;
    this.tracks = BGM_TRACKS;
    this.currentIndex = 0;
    this.isPlaying = false;
    this.isMuted = false;
    this.targetVolume = 0.55;
    this.currentVolume = 0.55;
    this.fadeInterval = null;
    this.unlocked = false;

    // Load saved settings
    const savedVol = localStorage.getItem('astra_bgm_volume');
    if (savedVol !== null) {
      this.targetVolume = parseFloat(savedVol);
      this.currentVolume = this.targetVolume;
    }
    const savedMute = localStorage.getItem('astra_bgm_muted');
    if (savedMute !== null) {
      this.isMuted = savedMute === 'true';
    }

    // Audio element
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.audio.volume = this.isMuted ? 0 : this.currentVolume;

    this.audio.addEventListener('ended', () => {
      this.nextTrack();
    });

    this.audio.addEventListener('error', (e) => {
      console.warn('BGM playback error on track:', this.getCurrentTrack().title, e);
    });

    // Auto-unlock on first user interaction anywhere
    this.setupUserInteractionUnlock();
  }

  setupUserInteractionUnlock() {
    const unlockAudio = () => {
      if (!this.unlocked) {
        this.unlocked = true;
        if (!this.isPlaying && this.game && this.game.stateManager && this.game.stateManager.currentState === 'LOBBY') {
          this.play();
        }
      }
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };

    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });
  }

  getCurrentTrack() {
    return this.tracks[this.currentIndex];
  }

  playTrack(index) {
    if (index < 0 || index >= this.tracks.length) return;
    this.currentIndex = index;
    const track = this.tracks[this.currentIndex];
    
    this.audio.src = track.file;
    this.audio.currentTime = 0;
    this.audio.volume = this.isMuted ? 0 : this.currentVolume;
    
    const playPromise = this.audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.isPlaying = true;
          this.updateUI();
        })
        .catch(err => {
          console.warn('BGM autoplay waiting for interaction:', err.message);
          this.isPlaying = false;
          this.updateUI();
        });
    }
  }

  play() {
    if (!this.audio.src || this.audio.src === '' || this.audio.ended) {
      this.playTrack(this.currentIndex);
    } else {
      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.isPlaying = true;
            this.updateUI();
          })
          .catch(() => {
            this.isPlaying = false;
            this.updateUI();
          });
      }
    }
  }

  pause() {
    this.audio.pause();
    this.isPlaying = false;
    this.updateUI();
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  nextTrack() {
    this.currentIndex = (this.currentIndex + 1) % this.tracks.length;
    this.playTrack(this.currentIndex);
  }

  prevTrack() {
    this.currentIndex = (this.currentIndex - 1 + this.tracks.length) % this.tracks.length;
    this.playTrack(this.currentIndex);
  }

  setVolume(vol) {
    this.targetVolume = Math.max(0, Math.min(1, vol));
    this.currentVolume = this.targetVolume;
    localStorage.setItem('astra_bgm_volume', this.targetVolume.toString());
    if (!this.isMuted) {
      this.audio.volume = this.currentVolume;
    }
    this.updateUI();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('astra_bgm_muted', this.isMuted.toString());
    this.audio.volume = this.isMuted ? 0 : this.currentVolume;
    this.updateUI();
  }

  // Smooth fade out (when match starts)
  fadeOut(duration = 1000) {
    if (!this.isPlaying) return;
    if (this.fadeInterval) clearInterval(this.fadeInterval);

    const stepMs = 50;
    const steps = duration / stepMs;
    const startVol = this.audio.volume;
    let currentStep = 0;

    this.fadeInterval = setInterval(() => {
      currentStep++;
      const ratio = 1 - (currentStep / steps);
      this.audio.volume = Math.max(0, startVol * ratio);

      if (currentStep >= steps) {
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
        this.pause();
        this.audio.volume = this.isMuted ? 0 : this.currentVolume;
      }
    }, stepMs);
  }

  // Smooth fade in (when entering lobby)
  fadeIn(duration = 1200) {
    if (this.fadeInterval) clearInterval(this.fadeInterval);
    if (!this.audio.src) {
      this.playTrack(this.currentIndex);
    } else {
      this.audio.volume = 0;
      this.play();
    }

    const stepMs = 50;
    const steps = duration / stepMs;
    const targetVol = this.isMuted ? 0 : this.currentVolume;
    let currentStep = 0;

    this.fadeInterval = setInterval(() => {
      currentStep++;
      const ratio = currentStep / steps;
      this.audio.volume = Math.min(targetVol, targetVol * ratio);

      if (currentStep >= steps) {
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
        this.audio.volume = targetVol;
      }
    }, stepMs);
  }

  updateUI() {
    const track = this.getCurrentTrack();
    const trackTitleEl = document.getElementById('bgm-track-title');
    const trackHindiEl = document.getElementById('bgm-track-hindi');
    const playBtn = document.getElementById('bgm-btn-play');
    const visualizer = document.getElementById('bgm-visualizer');
    const muteBtn = document.getElementById('bgm-btn-mute');
    const volSlider = document.getElementById('bgm-volume-slider');

    if (trackTitleEl) {
      trackTitleEl.textContent = track.title;
    }
    if (trackHindiEl) {
      trackHindiEl.textContent = track.hindiTitle;
    }
    if (playBtn) {
      playBtn.innerHTML = this.isPlaying ? '⏸' : '▶';
      playBtn.setAttribute('title', this.isPlaying ? 'Pause Music' : 'Play Music');
    }
    if (visualizer) {
      if (this.isPlaying && !this.isMuted) {
        visualizer.classList.add('active');
      } else {
        visualizer.classList.remove('active');
      }
    }
    if (muteBtn) {
      muteBtn.innerHTML = this.isMuted || this.currentVolume === 0 ? '🔇' : '🔊';
    }
    if (volSlider) {
      volSlider.value = Math.round((this.isMuted ? 0 : this.currentVolume) * 100);
    }

    // Highlight active item in tracklist modal if open
    const trackItems = document.querySelectorAll('.bgm-tracklist-item');
    trackItems.forEach((el, idx) => {
      if (idx === this.currentIndex) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  }
}
