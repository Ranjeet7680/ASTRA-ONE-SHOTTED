// Tactical Multi-Language Voice Chat & Radio Wheel (<kbd>V</kbd>)
// Supports Hindi, Bhojpuri, Tamil, Bengali, Punjabi, Telugu, and English with procedural Web Speech API TTS synthesis

export const LANGUAGE_DICTIONARY = {
  hi: {
    name: 'हिन्दी (Hindi)',
    flag: '🇮🇳',
    code: 'hi-IN',
    callouts: [
      { id: 'enemies', label: 'दुश्मन सामने है!', sub: 'ENEMIES AHEAD', scriptText: 'दुश्मन सामने है! गोली चलाओ!', phonetic: 'Dushman samne hai! Goli chalao!', pingType: 'danger', icon: '⚠️' },
      { id: 'backup', label: 'मदद चाहिए भाई!', sub: 'NEED BACKUP', scriptText: 'मदद चाहिए भाई, बैकअप दो!', phonetic: 'Madad chahiye bhai, backup do!', pingType: 'assist', icon: '🛡️' },
      { id: 'defend', label: 'पोजीशन संभालो!', sub: 'DEFEND POSITION', scriptText: 'इस जगह को बचाओ! पोजीशन संभालो!', phonetic: 'Is jagah ko bachao! Position sambhalo!', pingType: 'defend', icon: '📍' },
      { id: 'hold', label: 'आवाज मत करो!', sub: 'HOLD FIRE / SNEAK', scriptText: 'गोली मत चलाना, चुपके से चलो!', phonetic: 'Goli mat chalana, chupke se chalo!', pingType: 'stealth', icon: '🤫' },
      { id: 'roger', label: 'समझ गया भाई!', sub: 'AFFIRMATIVE / ROGER', scriptText: 'समझ गया भाई, आगे बढ़ रहे हैं!', phonetic: 'Samajh gaya bhai, aage badh rahe hain!', pingType: 'status', icon: '👍' },
      { id: 'cover', label: 'कवरिंग फायर!', sub: 'COVERING FIRE', scriptText: 'कवरिंग फायर दे रहा हूँ, निकलो!', phonetic: 'Covering fire de raha hoon, niklo!', pingType: 'combat', icon: '🔥' }
    ],
    botReplies: [
      { script: 'समझ गया भाई, बैकअप आ रहा है!', phonetic: 'Samajh gaya bhai, backup aa raha hai!' },
      { script: 'निशाना साध लिया है, तुम आगे बढ़ो!', phonetic: 'Nishana saadh liya hai, tum aage badho!' },
      { script: 'कवर कर रहा हूँ, बेफिक्र रहो!', phonetic: 'Cover kar raha hoon, befikra raho!' }
    ]
  },
  bhoj: {
    name: 'भोजपुरी (Bhojpuri)',
    flag: '🇮🇳',
    code: 'hi-IN',
    callouts: [
      { id: 'enemies', label: 'दुश्मन सोझा बा!', sub: 'ENEMIES IN FRONT', scriptText: 'अरे दुश्मन सोझा बा! मार साला के!', phonetic: 'Are dushman sojha ba! Maar saala ke!', pingType: 'danger', icon: '⚠️' },
      { id: 'backup', label: 'मदद चाहीं जल्दी!', sub: 'NEED BACKUP NOW', scriptText: 'अरे भइया मदद चाहीं, जल्दी आवा!', phonetic: 'Are bhaiya madad chaahin, jaldi aawa!', pingType: 'assist', icon: '🛡️' },
      { id: 'defend', label: 'ई जगा छोड़ब ना!', sub: 'HOLD GROUND', scriptText: 'ई जगा छोड़ के कतहीं ना जाए के बा!', phonetic: 'Ee jagah chhod ke kataheen na jaaye ke ba!', pingType: 'defend', icon: '📍' },
      { id: 'hold', label: 'चुपचाप चला!', sub: 'BE QUIET', scriptText: 'चुपचाप चला, आवाज मत करा!', phonetic: 'Chupchaap chala, aawaaj mat kara!', pingType: 'stealth', icon: '🤫' },
      { id: 'roger', label: 'समझ गइनी भइया!', sub: 'UNDERSTOOD', scriptText: 'हाँ भइया, एकदम समझ गइनी!', phonetic: 'Haan bhaiya, ekdam samajh gaini!', pingType: 'status', icon: '👍' },
      { id: 'cover', label: 'धुआँधार गोली!', sub: 'HEAVY SUPPRESSION', scriptText: 'हम धुआँधार गोली चलावत बानी, तू भागा!', phonetic: 'Hum dhuandhar goli chalawat baani, tu bhaaga!', pingType: 'combat', icon: '🔥' }
    ],
    botReplies: [
      { script: 'हाँ भइया, हम आ गइनी, चिंता मत करऽ!', phonetic: 'Haan bhaiya, hum aa gaini, chinta mat kara!' },
      { script: 'मार साला के, हम पाछे खड़ा बानी!', phonetic: 'Maar saala ke, hum paache khada baani!' },
      { script: 'एकदम गर्दा उड़ा दिहल जाई!', phonetic: 'Ekdam garda uda dihal jaai!' }
    ]
  },
  ta: {
    name: 'தமிழ் (Tamil)',
    flag: '🇮🇳',
    code: 'ta-IN',
    callouts: [
      { id: 'enemies', label: 'எதிரி முன்னாடி!', sub: 'ENEMIES AHEAD', scriptText: 'எதிரி முன்னாடி இருக்கான்! சுடுங்க!', phonetic: 'Ethiri munnadi irukkaan! Sudunga!', pingType: 'danger', icon: '⚠️' },
      { id: 'backup', label: 'உதவி வேணும்!', sub: 'NEED ASSIST', scriptText: 'உதவி வேணும், சீக்கிரம் வாங்க!', phonetic: 'Uthavi venum, seekkiram vaanga!', pingType: 'assist', icon: '🛡️' },
      { id: 'defend', label: 'பாதுகாக்கவும்!', sub: 'DEFEND AREA', scriptText: 'இந்த இடத்தை பாதுகாக்கவும்!', phonetic: 'Intha idathai paathukaakkavum!', pingType: 'defend', icon: '📍' },
      { id: 'hold', label: 'மெதுவா போங்க!', sub: 'STEALTH SILENT', scriptText: 'சத்தம் போடாதீங்க, மெதுவா போங்க!', phonetic: 'Satham podatheenga, methuva ponga!', pingType: 'stealth', icon: '🤫' },
      { id: 'roger', label: 'சரி தோழா!', sub: 'ROGER THAT', scriptText: 'சரி தோழா, புரிஞ்சது!', phonetic: 'Sari thozha, purinjathu!', pingType: 'status', icon: '👍' },
      { id: 'cover', label: 'கவர் பயர்!', sub: 'COVERING FIRE', scriptText: 'நான் கவர் கொடுக்கிறேன், முன்னேறுங்க!', phonetic: 'Naan cover kodukkiren, munnerunga!', pingType: 'combat', icon: '🔥' }
    ],
    botReplies: [
      { script: 'சரி தோழா, நான் உதவிக்கு வருகிறேன்!', phonetic: 'Sari thozha, naan uthavikku varugiren!' },
      { script: 'இலக்கு தெரியுது, நான் சுடுகிறேன்!', phonetic: 'Ilakku theriyuthu, naan sudugiren!' },
      { script: 'தைரியமா போங்க, நான் கவர் பண்றேன்!', phonetic: 'Dhairiyamaa ponga, naan cover panren!' }
    ]
  },
  bn: {
    name: 'বাংলা (Bengali)',
    flag: '🇮🇳',
    code: 'bn-IN',
    callouts: [
      { id: 'enemies', label: 'শত্রু সামনে!', sub: 'ENEMIES AHEAD', scriptText: 'শত্রু সামনে আছে! গুলি চালাও!', phonetic: 'Shotru shamne aache! Goli chalao!', pingType: 'danger', icon: '⚠️' },
      { id: 'backup', label: 'সাহায্য চাই!', sub: 'NEED BACKUP', scriptText: 'সাহায্য চাই ভাই, জলদি ব্যাকআপ দাও!', phonetic: 'Shahajjo chai bhai, joldi backup dao!', pingType: 'assist', icon: '🛡️' },
      { id: 'defend', label: 'জায়গা বাঁচাও!', sub: 'HOLD LOCATION', scriptText: 'এই জায়গা ধরে রাখো, ছাড়বে না!', phonetic: 'Ei jaayga dhore raakho, chharbe na!', pingType: 'defend', icon: '📍' },
      { id: 'hold', label: 'চুপচাপ চলো!', sub: 'STEALTH SILENT', scriptText: 'শব্দ কোরো না, লুকিয়ে চলো!', phonetic: 'Shobdo koro na, lukiye cholo!', pingType: 'stealth', icon: '🤫' },
      { id: 'roger', label: 'বুঝে গেছি ভাই!', sub: 'ROGER UNDERSTOOD', scriptText: 'ঠিক আছে ভাই, বুঝে গেছি!', phonetic: 'Thik aache bhai, bujhe gechi!', pingType: 'status', icon: '👍' },
      { id: 'cover', label: 'কভার ফায়ার!', sub: 'COVERING FIRE', scriptText: 'আমি কভারিং ফায়ার দিচ্ছি, এগোও!', phonetic: 'Aami covering fire dichhi, egoo!', pingType: 'combat', icon: '🔥' }
    ],
    botReplies: [
      { script: 'বুঝেছি ভাই, আমি কভার দিচ্ছি!', phonetic: 'Bujhechi bhai, aami cover dichhi!' },
      { script: 'টার্গেট দেখা যাচ্ছে, আক্রমণ করো!', phonetic: 'Target dekha jacche, aakromon koro!' },
      { script: 'চিন্তা নেই, আমরা সাথে আছি!', phonetic: 'Chinta nei, aamra saathe aachi!' }
    ]
  },
  pa: {
    name: 'ਪੰਜਾਬੀ (Punjabi)',
    flag: '🇮🇳',
    code: 'pa-IN',
    callouts: [
      { id: 'enemies', label: 'ਦੁਸ਼ਮਣ ਮੂਹਰੇ ਖੜ੍ਹਾ!', sub: 'HOSTILES AHEAD', scriptText: 'ਦੁਸ਼ਮਣ ਮੂਹਰੇ ਖੜ੍ਹਾ ਏ! ਠੋਕੋ ਇਹਨੂੰ!', phonetic: 'Dushman moohre khadha ae! Thoko ehnu!', pingType: 'danger', icon: '⚠️' },
      { id: 'backup', label: 'ਮਦਦ ਚਾਹੀਦੀ ਆ!', sub: 'ASSIST SQUAD', scriptText: 'ਓਏ ਵੀਰੇ ਮਦਦ ਚਾਹੀਦੀ ਆ, ਛੇਤੀ ਆਓ!', phonetic: 'Oye veere madad chahidi aa, chheti aao!', pingType: 'assist', icon: '🛡️' },
      { id: 'defend', label: 'ਪੁਜ਼ੀਸ਼ਨ ਸੰਭਾਲੋ!', sub: 'HOLD DEFENSE', scriptText: 'ਇਹ ਪੁਜ਼ੀਸ਼ਨ ਸੰਭਾਲੋ, ਹਿੱਲਣਾ ਨਈਂ!', phonetic: 'Eh position sambhalo, hillna naee!', pingType: 'defend', icon: '📍' },
      { id: 'hold', label: 'ਚੁੱਪ-ਚਾਪ ਚੱਲੋ!', sub: 'STEALTH SILENCE', scriptText: 'ਚੁੱਪ-ਚਾਪ ਚੱਲੋ, ਰੌਲਾ ਨਾ ਪਾਓ!', phonetic: 'Chup-chaap challo, raula na pao!', pingType: 'stealth', icon: '🤫' },
      { id: 'roger', label: 'ਬਿਲਕੁਲ ਰੈਡੀ!', sub: 'ROGER READY', scriptText: 'ਹਾਂਜੀ ਵੀਰੇ, ਬਿਲਕੁਲ ਰੈਡੀ ਆਂ!', phonetic: 'Haanji veere, bilkul ready aan!', pingType: 'status', icon: '👍' },
      { id: 'cover', label: 'ਕਵਰ ਫ਼ਾਇਰ ਠੋਕੋ!', sub: 'SUPPRESS FIRE', scriptText: 'ਮੈਂ ਕਵਰ ਫ਼ਾਇਰ ਦੇ ਰਿਹਾ ਆਂ, ਚੜ੍ਹਾਈ ਕਰੋ!', phonetic: 'Main cover fire de riha aan, charhayi karo!', pingType: 'combat', icon: '🔥' }
    ],
    botReplies: [
      { script: 'ਚੱਕ ਤੇ ਫੱਟੇ! ਆ ਰਹੇ ਆਂ ਵੀਰੇ!', phonetic: 'Chak te phatte! Aa rahe aan veere!' },
      { script: 'ਮੈਂ ਵੇਖ ਲਿਆ ਉਹਨੂੰ, ਹੁਣੇ ਠੋਕਦਾਂ!', phonetic: 'Main vekh leya ohnu, hune thokdaan!' },
      { script: 'ਖਿੱਚ ਕੇ ਰੱਖੋ ਕੰਮ, ਪੂਰਾ ਕਵਰ ਆ!', phonetic: 'Khich ke rakho kamm, poora cover aa!' }
    ]
  },
  te: {
    name: 'తెలుగు (Telugu)',
    flag: '🇮🇳',
    code: 'te-IN',
    callouts: [
      { id: 'enemies', label: 'శత్రువులు ముందున్నారు!', sub: 'ENEMIES AHEAD', scriptText: 'శత్రువులు ముందున్నారు! కాల్చండి!', phonetic: 'Shatruvulu mundunnaru! Kaalchandi!', pingType: 'danger', icon: '⚠️' },
      { id: 'backup', label: 'సాయం కావాలి!', sub: 'NEED BACKUP', scriptText: 'సాయం కావాలి బ్రదర్, త్వరగా రండి!', phonetic: 'Saayam kaavaali brother, twaragaa randi!', pingType: 'assist', icon: '🛡️' },
      { id: 'defend', label: 'స్థానం కాపాడండి!', sub: 'DEFEND POINT', scriptText: 'ఈ స్థానాన్ని కాపాడండి, కదలకండి!', phonetic: 'Ee sthaananni kaapaadandi, kadalakandi!', pingType: 'defend', icon: '📍' },
      { id: 'hold', label: 'నిశ్శబ్దంగా వెళ్ళండి!', sub: 'STEALTH SILENCE', scriptText: 'శబ్దం చేయకండి, నెమ్మదిగా వెళ్ళండి!', phonetic: 'Shabdam cheyakandi, nemmadigaa vellandi!', pingType: 'stealth', icon: '🤫' },
      { id: 'roger', label: 'అర్థమైంది బ్రదర్!', sub: 'ROGER UNDERSTOOD', scriptText: 'సరే అన్నా, అర్థమైంది!', phonetic: 'Sare anna, arthamaindi!', pingType: 'status', icon: '👍' },
      { id: 'cover', label: 'కవర్ ఫైర్ ఇస్తున్నా!', sub: 'COVERING FIRE', scriptText: 'నేను కవర్ ఫైర్ ఇస్తున్నా, వెళ్ళండి!', phonetic: 'Nenu cover fire isthunnaa, vellandi!', pingType: 'combat', icon: '🔥' }
    ],
    botReplies: [
      { script: 'వస్తున్నా బ్రదర్, ధైర్యంగా ఉండు!', phonetic: 'Vasthunna brother, dhairyangaa undu!' },
      { script: 'టార్గెట్ కనిపిస్తుంది, కాల్చేస్తున్నా!', phonetic: 'Target kanipisthundi, kaalchesthunnaa!' },
      { script: 'ఫుల్ కవర్ ఇస్తున్నా, ముందుకు వెళ్ళు!', phonetic: 'Full cover isthunnaa, munduku vellu!' }
    ]
  },
  en: {
    name: 'English (US/UK)',
    flag: '🌐',
    code: 'en-US',
    callouts: [
      { id: 'enemies', label: 'ENEMIES AHEAD!', sub: 'HOSTILES SPOTTED', scriptText: 'Enemies ahead! Open fire!', phonetic: 'Enemies ahead! Open fire!', pingType: 'danger', icon: '⚠️' },
      { id: 'backup', label: 'NEED BACKUP!', sub: 'ASSIST REQUEST', scriptText: 'Need backup! Assist me now!', phonetic: 'Need backup! Assist me now!', pingType: 'assist', icon: '🛡️' },
      { id: 'defend', label: 'DEFEND POSITION!', sub: 'HOLD PERIMETER', scriptText: 'Defend this position! Hold the line!', phonetic: 'Defend this position! Hold the line!', pingType: 'defend', icon: '📍' },
      { id: 'hold', label: 'HOLD FIRE / SNEAK!', sub: 'STEALTH REPOSITION', scriptText: 'Hold fire! Move in stealth!', phonetic: 'Hold fire! Move in stealth!', pingType: 'stealth', icon: '🤫' },
      { id: 'roger', label: 'AFFIRMATIVE / ROGER!', sub: 'ORDERS ACKNOWLEDGED', scriptText: 'Affirmative, orders understood!', phonetic: 'Affirmative, orders understood!', pingType: 'status', icon: '👍' },
      { id: 'cover', label: 'COVERING FIRE!', sub: 'LAYING SUPPRESSION', scriptText: 'Suppressing fire! Move up now!', phonetic: 'Suppressing fire! Move up now!', pingType: 'combat', icon: '🔥' }
    ],
    botReplies: [
      { script: 'Roger that Operator, moving in to assist!', phonetic: 'Roger that Operator, moving in to assist!' },
      { script: 'Target acquired, engaging now!', phonetic: 'Target acquired, engaging now!' },
      { script: 'Covering your flank, keep pushing!', phonetic: 'Covering your flank, keep pushing!' }
    ]
  }
};

export class VoiceChatSystem {
  constructor(game) {
    this.game = game;
    this.isOpen = false;
    this.micState = 'TEAM'; // 'ALL', 'TEAM', 'MUTE'
    this.speakerState = 'ON';
    this.currentLanguage = 'hi'; // Default to Hindi

    this.wheelModal = document.getElementById('modal-voice-wheel');
    this.radioBanner = document.getElementById('radio-chatter-banner');
    this.radioText = document.getElementById('radio-chatter-text');
    this.radioSender = document.getElementById('radio-chatter-sender');

    this.setupListeners();
    this.refreshWheelLanguageUI();
  }

  setupListeners() {
    // Key 'V' to toggle tactical voice wheel
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyV') {
        if (this.game.stateManager.currentState === 'PLAYING') {
          this.toggleWheel();
        }
      }
    });

    // Mobile voice chat button
    const btnMobileVoice = document.getElementById('btn-touch-voice');
    if (btnMobileVoice) {
      btnMobileVoice.addEventListener('click', () => {
        if (this.game.stateManager.currentState === 'PLAYING') {
          this.toggleWheel();
        }
      });
    }

    // Close button on wheel
    const btnCloseWheel = document.getElementById('btn-close-voice-wheel');
    if (btnCloseWheel) {
      btnCloseWheel.addEventListener('click', () => {
        this.closeWheel();
      });
    }

    // Bind each callout button
    for (let idx = 0; idx < 6; idx++) {
      const btn = document.getElementById(`voice-callout-${idx}`);
      if (btn) {
        btn.addEventListener('click', () => {
          this.executeCallout(idx);
          this.closeWheel();
        });
      }
    }

    // Language selector pills
    const langPills = document.querySelectorAll('.voice-lang-pill');
    langPills.forEach((p) => {
      p.addEventListener('click', () => {
        const lang = p.dataset.lang;
        if (lang) this.setLanguage(lang);
      });
    });

    // Mic Toggle Button
    const btnMic = document.getElementById('btn-hud-mic');
    if (btnMic) {
      btnMic.addEventListener('click', () => {
        if (this.micState === 'TEAM') {
          this.micState = 'ALL';
          btnMic.textContent = '🎙️ ALL';
          btnMic.style.borderColor = '#162a68';
        } else if (this.micState === 'ALL') {
          this.micState = 'MUTE';
          btnMic.textContent = '🔇 MUTE';
          btnMic.style.borderColor = '#c9182b';
        } else {
          this.micState = 'TEAM';
          btnMic.textContent = '🎙️ TEAM';
          btnMic.style.borderColor = '#2255bb';
        }
        if (this.game.soundEngine) this.game.soundEngine.playRadioChirp();
      });
    }
  }

  setLanguage(langKey) {
    if (!LANGUAGE_DICTIONARY[langKey]) return;
    this.currentLanguage = langKey;
    this.refreshWheelLanguageUI();
    if (this.game.soundEngine) this.game.soundEngine.playUIClick();
  }

  refreshWheelLanguageUI() {
    const langData = LANGUAGE_DICTIONARY[this.currentLanguage] || LANGUAGE_DICTIONARY.hi;

    // Update the 6 callout buttons
    langData.callouts.forEach((c, idx) => {
      const btn = document.getElementById(`voice-callout-${idx}`);
      if (btn) {
        btn.innerHTML = `
          <span style="font-size: 18px;">${c.icon}</span>
          <div>
            <div style="font-weight: 700; font-size: 13px;">${c.label}</div>
            <div style="font-size: 10px; opacity: 0.7; letter-spacing: 0.5px;">${c.sub}</div>
          </div>
        `;
      }
    });

    // Update active pill highlight
    const pills = document.querySelectorAll('.voice-lang-pill');
    pills.forEach((p) => {
      if (p.dataset.lang === this.currentLanguage) {
        p.style.background = '#162a68';
        p.style.color = '#ffffff';
        p.style.borderColor = '#162a68';
      } else {
        p.style.background = '#ffffff';
        p.style.color = '#162a68';
        p.style.borderColor = 'rgba(22,42,104,0.4)';
      }
    });
  }

  toggleWheel() {
    if (this.isOpen) {
      this.closeWheel();
    } else {
      this.openWheel();
    }
  }

  openWheel() {
    this.isOpen = true;
    if (this.wheelModal) this.wheelModal.style.display = 'flex';
    this.refreshWheelLanguageUI();
    if (document.exitPointerLock) document.exitPointerLock();
  }

  closeWheel() {
    this.isOpen = false;
    if (this.wheelModal) this.wheelModal.style.display = 'none';
    if (this.game.stateManager.currentState === 'PLAYING') {
      this.game.domElement.requestPointerLock();
    }
  }

  speak(text, langCode = 'hi-IN') {
    if (this.micState === 'MUTE') return;
    if (!('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode;
      utterance.rate = 1.05;
      utterance.pitch = 0.96;
      utterance.volume = 1.0;

      // Attempt to find a suitable installed voice
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const primaryCode = langCode.split('-')[0].toLowerCase();
        const matched = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(primaryCode));
        if (matched) {
          utterance.voice = matched;
        }
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('SpeechSynthesis error:', err);
    }
  }

  executeCallout(index) {
    const langData = LANGUAGE_DICTIONARY[this.currentLanguage] || LANGUAGE_DICTIONARY.hi;
    const callout = langData.callouts[index] || langData.callouts[0];
    const user = (this.game.auth && this.game.auth.currentUser) ? this.game.auth.currentUser.name : 'Operator';
    const playerPos = this.game.player.position;

    // 1. Drop tactical ping on minimap
    if (this.game.minimap) {
      this.game.minimap.addPing(playerPos.x, playerPos.z, callout.pingType, callout.label);
    }

    // 2. Play Web Audio radio squelch & beep
    if (this.game.soundEngine) {
      this.game.soundEngine.playRadioSquelch();
      setTimeout(() => {
        this.game.soundEngine.playRadioChirp();
      }, 100);
    }

    // 3. Speech Synthesis Audio Voiceout
    this.speak(callout.scriptText, langData.code);

    // 4. Show dual-script on-screen radio chatter banner
    const displayText = `${callout.scriptText} (${callout.phonetic})`;
    this.showRadioBanner(user, displayText);

    // 5. Localized Squad Bot Voice & Text Response
    if (this.game.currentMode === 'tdm') {
      setTimeout(() => {
        const botNames = ['Ghost-02 [SQUAD]', 'Viper-04 [SQUAD]', 'Spectre-06 [SQUAD]', 'Soap-08 [SQUAD]'];
        const randomBot = botNames[Math.floor(Math.random() * botNames.length)];
        const replies = langData.botReplies || LANGUAGE_DICTIONARY.en.botReplies;
        const randomReply = replies[Math.floor(Math.random() * replies.length)];

        if (this.game.soundEngine) this.game.soundEngine.playRadioSquelch();
        this.speak(randomReply.script, langData.code);
        this.showRadioBanner(randomBot, `${randomReply.script} (${randomReply.phonetic})`);
      }, 1500);
    }
  }

  triggerRadioCallout(message, worldX, worldZ) {
    const user = (this.game.auth && this.game.auth.currentUser) ? this.game.auth.currentUser.name : 'Operator';
    if (this.game.soundEngine) {
      this.game.soundEngine.playRadioSquelch();
    }
    this.showRadioBanner(user, message);
  }

  showRadioBanner(sender, message) {
    if (!this.radioBanner) return;
    if (this.radioSender) this.radioSender.textContent = `[RADIO] ${sender}:`;
    if (this.radioText) this.radioText.textContent = `"${message}"`;

    this.radioBanner.style.display = 'flex';
    this.radioBanner.style.opacity = '1';

    clearTimeout(this.bannerTimeout);
    this.bannerTimeout = setTimeout(() => {
      this.radioBanner.style.opacity = '0';
      setTimeout(() => {
        this.radioBanner.style.display = 'none';
      }, 300);
    }, 4200);
  }
}

