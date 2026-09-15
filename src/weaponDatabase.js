// Comprehensive COD Mobile-Style Weapon Database for ASTRA: One Shotted
// 50+ weapons across 8 categories with 8 attachment slots, stat calculation, loadouts, and camos.

export const WEAPON_CATEGORIES = [
  { id: 'ar', name: 'ASSAULT RIFLE', icon: '︻╦╤─', archetype: 'rifle' },
  { id: 'smg', name: 'SMG', icon: '▅▄', archetype: 'rifle' },
  { id: 'lmg', name: 'LMG', icon: '︻┳═一', archetype: 'rifle' },
  { id: 'sniper', name: 'SNIPER', icon: '︻╦═一', archetype: 'sniper' },
  { id: 'marksman', name: 'MARKSMAN', icon: '╾━╤デ╦︻', archetype: 'sniper' },
  { id: 'shotgun', name: 'SHOTGUN', icon: '▅▄', archetype: 'shotgun' },
  { id: 'pistol', name: 'PISTOL', icon: '🔫', archetype: 'pistol' },
  { id: 'melee', name: 'MELEE', icon: '🗡️', archetype: 'melee' }
];

export const ATTACHMENT_SLOTS = [
  { id: 'optic', name: 'OPTIC' },
  { id: 'muzzle', name: 'MUZZLE' },
  { id: 'barrel', name: 'BARREL' },
  { id: 'underbarrel', name: 'UNDERBARREL' },
  { id: 'grip', name: 'REAR GRIP' },
  { id: 'magazine', name: 'AMMUNITION' },
  { id: 'stock', name: 'STOCK' },
  { id: 'laser', name: 'TACTICAL LASER' }
];

export const ATTACHMENT_OPTIONS = {
  optic: [
    { id: 'none', name: 'Iron Sights', stats: {} },
    { id: 'reddot', name: 'Classic Red Dot Sight', stats: { accuracy: +5, range: +3, mobility: -2 } },
    { id: 'holo', name: 'Tactical Holographic', stats: { accuracy: +7, control: +4, mobility: -4 } },
    { id: 'tactical3x', name: '3x Tactical Scope', stats: { range: +12, accuracy: +9, mobility: -6 } },
    { id: 'sniper4x', name: '4.4x Blueprint Precision Optic', stats: { range: +18, accuracy: +12, mobility: -8 } }
  ],
  muzzle: [
    { id: 'none', name: 'Standard Flash Hider', stats: {} },
    { id: 'compensator', name: 'Tactical Compensator', stats: { control: +12, accuracy: +6, mobility: -3 } },
    { id: 'suppressor', name: 'Monolithic Suppressor', stats: { range: +8, control: +4, mobility: -4 } },
    { id: 'muzzlebrake', name: 'Muzzle Brake (-Recoil)', stats: { control: +14, mobility: -3 } }
  ],
  barrel: [
    { id: 'none', name: 'Standard Military Barrel', stats: {} },
    { id: 'extended', name: 'Long Range Heavy Barrel', stats: { range: +14, accuracy: +8, mobility: -7 } },
    { id: 'short', name: 'Compact CQB Barrel', stats: { mobility: +12, range: -6, control: -4 } },
    { id: 'fluted', name: 'Fluted Blueprint Barrel', stats: { accuracy: +10, mobility: +4, control: +3 } }
  ],
  underbarrel: [
    { id: 'none', name: 'Standard Handguard', stats: {} },
    { id: 'vertical', name: 'Vertical Foregrip (+Recoil Control)', stats: { control: +15, accuracy: +6, mobility: -4 } },
    { id: 'angled', name: 'Angled Strike Grip (+Quick ADS)', stats: { mobility: +8, control: +5 } },
    { id: 'bipod', name: 'Deployable Bipod', stats: { control: +20, accuracy: +10, mobility: -10 } }
  ],
  grip: [
    { id: 'none', name: 'Standard Polymer Grip', stats: {} },
    { id: 'stippled', name: 'Stippled Grip Tape (+Sprint-to-Fire)', stats: { mobility: +8, control: -3 } },
    { id: 'rubberized', name: 'Rubberized Grip Tape (+Stability)', stats: { control: +9, accuracy: +4 } },
    { id: 'granulated', name: 'Granulated Grip Tape', stats: { accuracy: +12, mobility: -2 } }
  ],
  magazine: [
    { id: 'none', name: 'Standard Capacity Mag', stats: {} },
    { id: 'extended', name: 'Extended Drum Magazine (+50% Cap)', stats: { magSize: +15, mobility: -6, control: -3 } },
    { id: 'fastreload', name: 'Fast Reload Sleek Mag', stats: { mobility: +5, reloadTime: -0.3 } },
    { id: 'ap_rounds', name: 'Armor Piercing AP Rounds', stats: { damage: +6, range: +5, control: -4 } }
  ],
  stock: [
    { id: 'none', name: 'Standard Tactical Stock', stats: {} },
    { id: 'nostock', name: 'No Stock (Maximum Speed)', stats: { mobility: +16, control: -12, accuracy: -6 } },
    { id: 'heavy', name: 'Reinforced Heavy Stock', stats: { control: +14, accuracy: +7, mobility: -8 } },
    { id: 'skeleton', name: 'Skeleton Lightweight Stock', stats: { mobility: +10, control: -3 } }
  ],
  laser: [
    { id: 'none', name: 'No Tactical Laser', stats: {} },
    { id: 'laser5mw', name: '5mW Hipfire Green Laser', stats: { accuracy: +14, mobility: +4 } },
    { id: 'taclaser', name: 'OWC Tactical Laser', stats: { accuracy: +10, mobility: +6 } }
  ]
};

export const WEAPON_CAMOS = [
  { id: 'default', name: 'Classic Blueprint Ink', color: '#162a68' },
  { id: 'graphite', name: 'Graphite Carbon', color: '#1f293d' },
  { id: 'gold', name: 'Damascus Gold Royal', color: '#f59e0b' },
  { id: 'cyan', name: 'Cyberpunk Cyan Grid', color: '#00e5ff' },
  { id: 'crimson', name: 'Crimson Dragon Rebel', color: '#ef4444' },
  { id: 'emerald', name: 'Astra Emerald Spec-Ops', color: '#10b981' }
];

export const WEAPONS_DATABASE = [
  // 1. ASSAULT RIFLES (10)
  { id: 'ak47', name: 'AK-47 BLUEPRINT', category: 'ar', unlockLevel: 1, damage: 48, fireRate: 72, accuracy: 68, range: 65, mobility: 68, control: 62, magSize: 30, desc: 'High-damage heavy Russian assault rifle with signature blueprint recoil.' },
  { id: 'm4a1', name: 'M4A1 TACTICAL', category: 'ar', unlockLevel: 2, damage: 42, fireRate: 85, accuracy: 76, range: 60, mobility: 72, control: 75, magSize: 30, desc: 'Balanced, reliable automatic carbine for versatile all-range combat.' },
  { id: 'scarh', name: 'SCAR-H HEAVY', category: 'ar', unlockLevel: 5, damage: 54, fireRate: 64, accuracy: 74, range: 72, mobility: 64, control: 68, magSize: 25, desc: '7.62mm NATO heavy rifle delivering crushing damage at long ranges.' },
  { id: 'insas', name: 'INSAS 1B1 TACTICAL', category: 'ar', unlockLevel: 8, damage: 45, fireRate: 80, accuracy: 78, range: 68, mobility: 70, control: 72, magSize: 30, desc: 'Indian Armed Forces service rifle upgraded with modern tactical picatinny rails.' },
  { id: 'tar21', name: 'TAR-21 BULLPUP', category: 'ar', unlockLevel: 12, damage: 40, fireRate: 90, accuracy: 72, range: 58, mobility: 82, control: 70, magSize: 30, desc: 'Compact bullpup rifle with lightning-fast fire rate and superior mobility.' },
  { id: 'g36c', name: 'G36C COMPACT', category: 'ar', unlockLevel: 16, damage: 43, fireRate: 82, accuracy: 75, range: 62, mobility: 75, control: 74, magSize: 30, desc: 'Modular German polymer rifle featuring exceptional burst accuracy.' },
  { id: 'acr', name: 'ACR 6.8 REMINGTON', category: 'ar', unlockLevel: 20, damage: 44, fireRate: 78, accuracy: 84, range: 66, mobility: 69, control: 82, magSize: 30, desc: 'Precision adaptive combat rifle with virtually laser-flat recoil.' },
  { id: 'grau', name: 'GRAU 5.56 ARCHITECT', category: 'ar', unlockLevel: 25, damage: 41, fireRate: 84, accuracy: 82, range: 74, mobility: 76, control: 78, magSize: 30, desc: 'Lightweight, ultra-clean Swiss blueprint design for pinpoint ADS engagements.' },
  { id: 'm13', name: 'M13 GHOST', category: 'ar', unlockLevel: 30, damage: 38, fireRate: 94, accuracy: 70, range: 56, mobility: 80, control: 76, magSize: 30, desc: 'Rapid-firing short-stroke piston carbine designed for close-quarter pushes.' },
  { id: 'type25', name: 'TYPE 25 DRAGON', category: 'ar', unlockLevel: 35, damage: 42, fireRate: 88, accuracy: 66, range: 55, mobility: 78, control: 65, magSize: 30, desc: 'Fast handling bullpup rifle with a punchy kick and high damage output.' },

  // 2. SUBMACHINE GUNS (8)
  { id: 'mp5', name: 'MP5 SUB-MACHINE', category: 'smg', unlockLevel: 1, damage: 38, fireRate: 88, accuracy: 68, range: 45, mobility: 88, control: 72, magSize: 30, desc: 'Iconic 9mm roller-delayed submachine gun for close quarters speed.' },
  { id: 'vector', name: 'VECTOR .45 CRISS', category: 'smg', unlockLevel: 4, damage: 32, fireRate: 110, accuracy: 62, range: 38, mobility: 94, control: 68, magSize: 33, desc: 'Super V recoil mitigation system with blazing 1,200 RPM fire rate.' },
  { id: 'p90', name: 'P90 5.7mm AP', category: 'smg', unlockLevel: 9, damage: 34, fireRate: 95, accuracy: 65, range: 48, mobility: 86, control: 74, magSize: 50, desc: '50-round horizontal top-feed magazine with armor piercing capabilities.' },
  { id: 'uzi', name: 'MICRO UZI PRO', category: 'smg', unlockLevel: 14, damage: 35, fireRate: 102, accuracy: 58, range: 36, mobility: 96, control: 64, magSize: 32, desc: 'Compact open-bolt submachine gun built for extreme close combat hipfire.' },
  { id: 'mp7', name: 'MP7 SPEC-OPS', category: 'smg', unlockLevel: 19, damage: 36, fireRate: 92, accuracy: 72, range: 46, mobility: 90, control: 78, magSize: 40, desc: 'Modern 4.6mm penetrator with high control and generous 40-round magazine.' },
  { id: 'bizon', name: 'PP-19 BIZON HELICAL', category: 'smg', unlockLevel: 24, damage: 41, fireRate: 76, accuracy: 74, range: 52, mobility: 84, control: 80, magSize: 64, desc: '64-round helical drum cylinder providing relentless suppressing fire.' },
  { id: 'qq9', name: 'QQ9 TACTICAL', category: 'smg', unlockLevel: 28, damage: 39, fireRate: 92, accuracy: 70, range: 44, mobility: 90, control: 70, magSize: 30, desc: 'High mobility mobile tournament favourite with deadly 4-shot TTK.' },
  { id: 'fennec', name: 'FENNEC DUAL-CLAW', category: 'smg', unlockLevel: 34, damage: 29, fireRate: 115, accuracy: 56, range: 35, mobility: 95, control: 58, magSize: 30, desc: 'Highest fire rate SMG in class. Eradicates hostiles in fractions of a second.' },

  // 3. LIGHT MACHINE GUNS (6)
  { id: 'rpk', name: 'RPK SQUAD AUTOMATIC', category: 'lmg', unlockLevel: 3, damage: 50, fireRate: 65, accuracy: 72, range: 75, mobility: 52, control: 68, magSize: 75, desc: 'Long-barrel heavy squad support weapon with 75-round drum mag.' },
  { id: 'm249', name: 'M249 SAW BELT-FED', category: 'lmg', unlockLevel: 10, damage: 44, fireRate: 85, accuracy: 66, range: 70, mobility: 48, control: 65, magSize: 100, desc: '100-round disintegrating belt feeder delivering continuous defensive fire.' },
  { id: 'pkm', name: 'PKM 7.62 RUSSIAN', category: 'lmg', unlockLevel: 17, damage: 52, fireRate: 68, accuracy: 70, range: 78, mobility: 46, control: 66, magSize: 100, desc: 'Devastating heavy machine gun capable of locking down whole corridors.' },
  { id: 'chopper', name: 'CHOPPER CHAIN-SAW', category: 'lmg', unlockLevel: 23, damage: 46, fireRate: 88, accuracy: 62, range: 68, mobility: 58, control: 64, magSize: 100, desc: 'Heavy hipfire chainsaw-grip configuration for aggressive mobile pushes.' },
  { id: 'holger26', name: 'HOLGER-26 HYBRID', category: 'lmg', unlockLevel: 29, damage: 45, fireRate: 78, accuracy: 76, range: 72, mobility: 62, control: 72, magSize: 100, desc: 'Modular German LMG that balances heavy fire capacity with rifle agility.' },
  { id: 'ul736', name: 'UL736 BULLPUP LMG', category: 'lmg', unlockLevel: 36, damage: 48, fireRate: 74, accuracy: 75, range: 76, mobility: 56, control: 70, magSize: 60, desc: 'Bullpup support weapon delivering high-penetration long-distance accuracy.' },

  // 4. SNIPER RIFLES (8)
  { id: 'awm', name: 'AWM ARCTIC BLUEPRINT', category: 'sniper', unlockLevel: 1, damage: 160, fireRate: 28, accuracy: 96, range: 98, mobility: 44, control: 40, magSize: 5, desc: '.338 Lapua magnum bolt-action sniper. Instant lethal headshot and chest elimination.' },
  { id: 'dlq33', name: 'DL Q33 PRECISION', category: 'sniper', unlockLevel: 6, damage: 155, fireRate: 32, accuracy: 94, range: 95, mobility: 50, control: 44, magSize: 6, desc: 'Tournament standard bolt-action rifle celebrated for crisp mobile quick-scoping.' },
  { id: 'arctic50', name: 'ARCTIC .50 CALIBER', category: 'sniper', unlockLevel: 11, damage: 145, fireRate: 46, accuracy: 90, range: 92, mobility: 46, control: 38, magSize: 7, desc: 'Semi-automatic anti-materiel sniper with fast follow-up shot potential.' },
  { id: 'locus', name: 'LOCUS LIGHTNING', category: 'sniper', unlockLevel: 18, damage: 150, fireRate: 34, accuracy: 92, range: 94, mobility: 54, control: 46, magSize: 8, desc: 'Fast-handling modern sniper rifle built for aggressive mobile snipers.' },
  { id: 'm200', name: 'CHEYTAC M200 INTERVENTION', category: 'sniper', unlockLevel: 22, damage: 165, fireRate: 26, accuracy: 98, range: 100, mobility: 40, control: 36, magSize: 5, desc: 'Legendary .408 CheyTac sniper with unmatched extreme-range bullet velocity.' },
  { id: 'rytec', name: 'RYTEC AMR EXPLOSIVE', category: 'sniper', unlockLevel: 27, damage: 158, fireRate: 42, accuracy: 88, range: 96, mobility: 38, control: 34, magSize: 5, desc: 'Semi-auto anti-materiel rifle chambered with explosive thermite ballistics.' },
  { id: 'koshka', name: 'KOSHKA FAST-BOLT', category: 'sniper', unlockLevel: 31, damage: 148, fireRate: 36, accuracy: 93, range: 90, mobility: 56, control: 48, magSize: 6, desc: 'High mobility sniper with rapid ADS transition for agile mobile claw players.' },
  { id: 'svd', name: 'SVD DRAGUNOV SATELLITE', category: 'sniper', unlockLevel: 37, damage: 135, fireRate: 52, accuracy: 86, range: 88, mobility: 52, control: 50, magSize: 10, desc: 'Classic designated marksman rifle offering lethal 2-shot semi-auto firing.' },

  // 5. MARKSMAN RIFLES (6)
  { id: 'sks', name: 'SKS TACTICAL RIFLE', category: 'marksman', unlockLevel: 4, damage: 68, fireRate: 58, accuracy: 88, range: 80, mobility: 68, control: 72, magSize: 20, desc: 'Semi-automatic marksman rifle capable of 2-tap eliminations at medium range.' },
  { id: 'mk2', name: 'MK2 CARBINE LEVER', category: 'marksman', unlockLevel: 13, damage: 110, fireRate: 40, accuracy: 86, range: 78, mobility: 74, control: 62, magSize: 6, desc: 'Fast-cycling lever-action carbine with one-shot upper chest elimination.' },
  { id: 'spr208', name: 'SPR 208 HUNTER', category: 'marksman', unlockLevel: 21, damage: 130, fireRate: 36, accuracy: 90, range: 84, mobility: 66, control: 58, magSize: 5, desc: 'Bolt-action hunting rifle offering high mobility and lethal precision.' },
  { id: 'kar98k', name: 'KAR98K VINTAGE TACTICAL', category: 'marksman', unlockLevel: 26, damage: 125, fireRate: 35, accuracy: 88, range: 82, mobility: 64, control: 60, magSize: 5, desc: 'German 7.92mm bolt action re-engineered with tactical blueprint rail mounts.' },
  { id: 'fal', name: 'FAL METRIC DMR', category: 'marksman', unlockLevel: 32, damage: 62, fireRate: 62, accuracy: 84, range: 78, mobility: 70, control: 74, magSize: 20, desc: 'Battle rifle with heavy semi-automatic 7.62mm stopping power.' },
  { id: 'm21', name: 'M21 EBR SURVEILLANCE', category: 'marksman', unlockLevel: 38, damage: 72, fireRate: 54, accuracy: 90, range: 86, mobility: 60, control: 76, magSize: 15, desc: 'Enhanced battle rifle with low recoil and high optical tracking stability.' },

  // 6. SHOTGUNS (6)
  { id: 'krm262', name: 'KRM-262 PUMP', category: 'shotgun', unlockLevel: 1, damage: 220, fireRate: 42, accuracy: 48, range: 40, mobility: 82, control: 44, magSize: 8, desc: 'High-lethality pump action shotgun delivering massive one-shot blast damage.' },
  { id: 'by15', name: 'BY15 TACTICAL PUMP', category: 'shotgun', unlockLevel: 7, damage: 210, fireRate: 45, accuracy: 52, range: 44, mobility: 80, control: 46, magSize: 8, desc: 'Tight pellet spread and longer barrel for consistent 1-shot close range kills.' },
  { id: 'hs0405', name: 'HS0405 LEVER-ACTION', category: 'shotgun', unlockLevel: 15, damage: 240, fireRate: 35, accuracy: 44, range: 42, mobility: 84, control: 40, magSize: 7, desc: 'Heavy lever-action shotgun with highest single-shot damage in class.' },
  { id: 'spas12', name: 'SPAS-12 COMBAT', category: 'shotgun', unlockLevel: 24, damage: 195, fireRate: 52, accuracy: 50, range: 38, mobility: 78, control: 50, magSize: 8, desc: 'Italian tactical combat shotgun with rapid cycling speed.' },
  { id: 'echo', name: 'ECHO AUTOMATIC 12G', category: 'shotgun', unlockLevel: 30, damage: 170, fireRate: 64, accuracy: 42, range: 35, mobility: 74, control: 52, magSize: 12, desc: 'Semi-automatic drum-fed shotgun for breaching and room clearing.' },
  { id: 'striker', name: 'STRIKER REVOLVING', category: 'shotgun', unlockLevel: 37, damage: 160, fireRate: 68, accuracy: 40, range: 34, mobility: 72, control: 54, magSize: 12, desc: 'Revolving cylinder auto shotgun providing sustained close-quarters barrage.' },

  // 7. PISTOLS & SECONDARIES (6)
  { id: 'deagle', name: '.50 GS DESERT EAGLE', category: 'pistol', unlockLevel: 1, damage: 75, fireRate: 48, accuracy: 76, range: 55, mobility: 90, control: 58, magSize: 7, desc: 'Heavy hand cannon delivering immense stopping power. 2-shot body kill.' },
  { id: 'j358', name: 'J358 MAGNUM REVOLVER', category: 'pistol', unlockLevel: 8, damage: 78, fireRate: 44, accuracy: 78, range: 58, mobility: 88, control: 55, magSize: 6, desc: '6-round .357 magnum revolver with pinpoint blueprint headshot precision.' },
  { id: 'mw11', name: 'MW11 TACTICAL 1911', category: 'pistol', unlockLevel: 12, damage: 52, fireRate: 68, accuracy: 72, range: 46, mobility: 94, control: 74, magSize: 12, desc: 'Classic .45 ACP sidearm with fast swap speed and smooth control.' },
  { id: 'renetti', name: 'RENETTI 3-BURST', category: 'pistol', unlockLevel: 20, damage: 45, fireRate: 82, accuracy: 70, range: 48, mobility: 92, control: 68, magSize: 15, desc: 'Equipped with 3-round burst trigger mod for lethal close-range burst damage.' },
  { id: 'lcar9', name: 'L-CAR 9 MACHINE PISTOL', category: 'pistol', unlockLevel: 28, damage: 34, fireRate: 98, accuracy: 62, range: 38, mobility: 96, control: 62, magSize: 20, desc: 'Fully automatic pocket SMG with high rate of fire as secondary backup.' },
  { id: 'crossbow', name: 'TACTICAL RECON CROSSBOW', category: 'pistol', unlockLevel: 35, damage: 150, fireRate: 22, accuracy: 92, range: 60, mobility: 84, control: 70, magSize: 1, desc: 'Silent single-bolt launcher with instant lethal bolt placement.' },

  // 8. MELEE WEAPONS (5)
  { id: 'knife', name: 'TACTICAL COMBAT KNIFE', category: 'melee', unlockLevel: 1, damage: 100, fireRate: 80, accuracy: 100, range: 12, mobility: 100, control: 100, magSize: 1, desc: 'Military serrated fixed-blade knife. Instant lethal swipe at point blank range.' },
  { id: 'karambit', name: 'BLUEPRINT KARAMBIT', category: 'melee', unlockLevel: 10, damage: 100, fireRate: 90, accuracy: 100, range: 10, mobility: 100, control: 100, magSize: 1, desc: 'Curved tiger-claw blade allowing rapid slashing with stylish inspection spins.' },
  { id: 'axe', name: 'TACTICAL BREACHING AXE', category: 'melee', unlockLevel: 18, damage: 110, fireRate: 65, accuracy: 100, range: 16, mobility: 96, control: 98, magSize: 1, desc: 'Heavy steel tomahawk offering extended melee reach and lethal strike power.' },
  { id: 'katana', name: 'SHADOW BLUEPRINT KATANA', category: 'melee', unlockLevel: 27, damage: 105, fireRate: 75, accuracy: 100, range: 18, mobility: 98, control: 98, magSize: 1, desc: 'Forged folding steel blade with longest melee lunge distance in class.' },
  { id: 'sticks', name: 'KALI TACTICAL STICKS', category: 'melee', unlockLevel: 33, damage: 85, fireRate: 105, accuracy: 100, range: 14, mobility: 100, control: 98, magSize: 1, desc: 'Rapid dual-wielded arnis impact batons with blinding multi-hit flurry.' }
];

export class WeaponDatabaseManager {
  constructor() {
    this.weapons = WEAPONS_DATABASE.map(w => ({
      ...w,
      baseStats: {
        damage: w.damage,
        fireRate: w.fireRate,
        accuracy: w.accuracy,
        range: w.range,
        mobility: w.mobility,
        control: w.control,
        magSize: w.magSize
      }
    }));
    this.categories = WEAPON_CATEGORIES;
    this.slots = ATTACHMENT_SLOTS;
    this.options = ATTACHMENT_OPTIONS;
    this.camos = WEAPON_CAMOS;

    const savedActive = (typeof localStorage !== 'undefined') ? localStorage.getItem('astra_active_loadout') : null;
    this.activeLoadoutIndex = parseInt(savedActive || '0', 10);
    this.loadouts = this.loadLoadoutPresets();
    this.weaponProgress = this.loadWeaponProgress();
  }

  loadLoadoutPresets() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('astra_loadouts_v2');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { /* ignore fallback */ }
      }
    }
    return [
      { id: 0, name: 'LOADOUT 1 (ASSAULT)', primaryWeaponId: 'm4a1_carbine', secondaryWeaponId: 'beretta_92fs', attachments: { optic: 'red_dot', muzzle: 'tactical_suppressor', underbarrel: 'vertical_foregrip', magazine: 'ext_mag_a' }, camoId: 'camo_default', perk: 'agile' },
      { id: 1, name: 'LOADOUT 2 (SNIPER)', primaryWeaponId: 'dlq33_sniper', secondaryWeaponId: 'combat_knife', attachments: { optic: 'tactical_4x', muzzle: 'tactical_suppressor', stock: 'heavy_buffer' }, camoId: 'camo_arctic', perk: 'ghost' },
      { id: 2, name: 'LOADOUT 3 (RUSHER)', primaryWeaponId: 'mp5_sub', secondaryWeaponId: 'tactical_axe', attachments: { muzzle: 'compensator', underbarrel: 'angled_foregrip', laser: 'tactical_green' }, camoId: 'camo_digital', perk: 'lightweight' },
      { id: 3, name: 'LOADOUT 4 (CQB BLAST)', primaryWeaponId: 'remington_870', secondaryWeaponId: 'magnum_revolver', attachments: { muzzle: 'tactical_suppressor', stock: 'skeleton_stock' }, camoId: 'camo_gold', perk: 'flak' },
      { id: 4, name: 'LOADOUT 5 (DMR TACTICAL)', primaryWeaponId: 'sks_marksman', secondaryWeaponId: 'beretta_92fs', attachments: { optic: 'tactical_4x', muzzle: 'compensator', underbarrel: 'bipod' }, camoId: 'camo_damascus', perk: 'scavenger' }
    ];
  }

  saveLoadoutPresets() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('astra_loadouts_v2', JSON.stringify(this.loadouts));
      localStorage.setItem('astra_active_loadout', this.activeLoadoutIndex.toString());
    }
  }

  saveLoadouts() {
    this.saveLoadoutPresets();
  }

  loadWeaponProgress() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('astra_weapon_prog_v2');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { /* ignore fallback */ }
      }
    }
    const prog = {};
    this.weapons.forEach(w => {
      prog[w.id] = { level: 1, xp: 0, maxLevel: 50, kills: 0, headshots: 0 };
    });
    return prog;
  }

  saveWeaponProgress() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('astra_weapon_prog_v2', JSON.stringify(this.weaponProgress));
    }
  }

  getActiveLoadout() {
    const l = this.loadouts[this.activeLoadoutIndex] || this.loadouts[0];
    if (!l.primaryWeaponId) l.primaryWeaponId = l.primaryId || 'm4a1_carbine';
    if (!l.secondaryWeaponId) l.secondaryWeaponId = l.secondaryId || 'beretta_92fs';
    return l;
  }

  getWeaponById(id) {
    return this.weapons.find(w => w.id === id) || this.weapons[0];
  }

  getWeapon(id) {
    return this.getWeaponById(id);
  }

  getWeaponsByCategory(catId) {
    return this.weapons.filter(w => w.category === catId);
  }

  calculateWeaponStats(weaponId, attachments = {}) {
    const base = this.getWeaponById(weaponId);
    const calculated = {
      damage: base.damage,
      fireRate: base.fireRate,
      accuracy: base.accuracy,
      range: base.range,
      mobility: base.mobility,
      control: base.control,
      magSize: base.magSize,
      reloadTime: 1.35
    };

    // Apply attachments modifiers
    for (const [slot, attId] of Object.entries(attachments)) {
      if (!attId || attId === 'none' || attId === 'iron' || attId === 'standard') continue;
      const opts = this.options[slot];
      if (!opts) continue;
      const att = opts.find(o => o.id === attId);
      if (!att || !att.stats) continue;

      for (const [statKey, statVal] of Object.entries(att.stats)) {
        if (calculated[statKey] !== undefined) {
          calculated[statKey] = Math.max(10, Math.min(100, calculated[statKey] + statVal));
        }
      }
    }

    return calculated;
  }

  calculateStats(weaponId, attachments = {}) {
    return this.calculateWeaponStats(weaponId, attachments);
  }

  getWeaponLevel(weaponId) {
    if (!this.weaponProgress[weaponId]) {
      this.weaponProgress[weaponId] = { level: 1, xp: 0, maxLevel: 50, kills: 0, headshots: 0 };
    }
    const wp = this.weaponProgress[weaponId];
    const neededXp = wp.level * 250;
    return {
      level: wp.level,
      currentXp: wp.xp,
      neededXp,
      maxLevel: wp.maxLevel
    };
  }

  addWeaponXP(weaponId, earnedXp = 100) {
    if (!this.weaponProgress[weaponId]) {
      this.weaponProgress[weaponId] = { level: 1, xp: 0, maxLevel: 50, kills: 0, headshots: 0 };
    }
    const wp = this.weaponProgress[weaponId];
    wp.xp += earnedXp;
    while (wp.xp >= (wp.level * 250) && wp.level < wp.maxLevel) {
      wp.xp -= (wp.level * 250);
      wp.level++;
    }
    this.saveWeaponProgress();
    return wp;
  }

  addWeaponXp(weaponId, earnedXp = 100) {
    return this.addWeaponXP(weaponId, earnedXp);
  }
}

export const weaponDatabase = new WeaponDatabaseManager();
