"""
ASTRA: One Shotted - Shared Game & Backend Constants
"""

# Weapon Categories
WEAPON_CATEGORIES = [
    "ASSAULT_RIFLE",
    "SMG",
    "SHOTGUN",
    "LMG",
    "SNIPER",
    "PISTOL",
    "MELEE"
]

# Weapon Tiers / Rarities
WEAPON_TIERS = [
    "COMMON",
    "RARE",
    "EPIC",
    "LEGENDARY",
    "BLUEPRINT"
]

# Ranked Tiers (in ascending order)
RANK_TIERS = [
    "BRONZE",
    "SILVER",
    "GOLD",
    "PLATINUM",
    "DIAMOND",
    "MASTER",
    "GRANDMASTER",
    "LEGEND"
]

# Match Modes
MATCH_MODES = [
    "TDM",
    "DOMINATION",
    "FFA",
    "SEARCH_AND_DESTROY",
    "GUN_GAME",
    "WAVE_SURVIVAL"
]

# Match Maps
MATCH_MAPS = [
    "city",           # Metropolis
    "village",        # Highland
    "train_station",  # Terminal
    "airport",        # Sky Harbor
    "tv_station",     # Broadcast
    "sea_port"        # Sea Port
]

# Match Event Types
MATCH_EVENT_TYPES = [
    "PLAYER_JOIN",
    "PLAYER_LEAVE",
    "KILL",
    "DEATH",
    "ASSIST",
    "HEADSHOT",
    "DAMAGE",
    "OBJECTIVE_CAPTURE",
    "WEAPON_PICKUP",
    "WEAPON_SWITCH",
    "MATCH_END"
]

# Item Types
ITEM_TYPES = [
    "WEAPON",
    "ATTACHMENT",
    "SKIN",
    "CAMO",
    "CHARACTER",
    "EMOTE",
    "CURRENCY"
]

# Anti-Cheat Physical Hard Thresholds
ANTI_CHEAT_THRESHOLDS = {
    "max_speed_units_per_sec": 14.0,       # Sprinting + sliding cap ~11 m/s + margin
    "max_fire_rate_margin": 1.25,          # 25% tolerance over max theoretical fire rate
    "max_knife_distance": 5.0,             # meters
    "max_shotgun_lethal_distance": 65.0,   # meters
    "max_pistol_lethal_distance": 90.0,    # meters
    "min_headshot_rate_sample_size": 12,   # Minimum kills to evaluate headshot anomaly
    "max_headshot_rate_flag": 0.88,        # > 88% headshots across sample flags for review
    "max_damage_per_shot_multiplier": 1.35 # > 1.35x theoretical weapon headshot damage
}
