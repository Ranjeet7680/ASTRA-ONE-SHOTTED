import random
import numpy as np
from typing import List, Dict, Any

WEAPON_IDS = [
    "ar_astra_alpha", "ar_vayu_47", "ar_rudra_m4", "ar_agni_burst", "ar_garuda_556",
    "ar_trishul_carbine", "ar_chakra_21", "ar_shakti_bullpup", "smg_tez_9", "smg_bijli_vector",
    "smg_toofan_p90", "smg_veera_mp5", "smg_dhanush_sub", "smg_prithvi_compact", "smg_naga_spec",
    "smg_chetak_smg", "sg_ghatak_12g", "sg_vajra_pump", "sg_damru_auto", "sg_kali_breacher",
    "sg_kaal_heavy", "sg_bheem_slug", "lmg_parashu_heavy", "lmg_indra_saw", "lmg_surya_50",
    "lmg_rakshas_box", "lmg_varun_belt", "lmg_brahma_suppressor", "sr_astra_90", "sr_drona_sniper",
    "sr_karna_bolt", "sr_arjuna_marksman", "sr_yama_anti_mat", "sr_bhishma_heavy", "sr_ashwatthama_long",
    "sr_shiva_one_shot", "pistol_astra_sidearm", "pistol_veer_45", "pistol_tejas_auto",
    "pistol_kavach_revolver", "pistol_marut_magnum", "pistol_hawk_compact", "pistol_tactical_flare",
    "pistol_kali_handcannon", "melee_gurkha_kukri", "melee_katar_blade", "melee_tactical_karambit",
    "melee_shiv_dagger", "melee_combat_axe", "melee_titanium_machete", "melee_shock_baton", "melee_shuriken_set"
]

def generate_telemetry_dataset(num_samples: int = 12000, seed: int = 42) -> List[Dict[str, Any]]:
    """
    Generates realistic match telemetry for training ML models:
    - Player Skill Rating
    - Weapon Balance Evaluation
    - Churn Risk Prediction
    - Recommendation Engine
    - Anti-Cheat Anomaly Detection
    """
    np.random.seed(seed)
    random.seed(seed)

    records = []

    # Player archetype distributions:
    # 0: Casual, 1: Average, 2: Skilled, 3: Competitive/Pro, 4: Cheater/Anomaly
    archetypes = [
        {"name": "casual", "acc": (0.15, 0.28), "hs": (0.05, 0.18), "recoil": (20, 50), "react": (320, 480), "kd": (0.4, 0.9)},
        {"name": "average", "acc": (0.25, 0.40), "hs": (0.15, 0.30), "recoil": (45, 70), "react": (240, 340), "kd": (0.8, 1.4)},
        {"name": "skilled", "acc": (0.35, 0.52), "hs": (0.25, 0.45), "recoil": (65, 88), "react": (180, 260), "kd": (1.3, 2.5)},
        {"name": "pro", "acc": (0.48, 0.68), "hs": (0.35, 0.58), "recoil": (80, 98), "react": (130, 200), "kd": (2.2, 4.5)},
        {"name": "cheater", "acc": (0.75, 0.99), "hs": (0.70, 0.99), "recoil": (95, 100), "react": (40, 110), "kd": (4.5, 18.0)}
    ]

    weights = [0.40, 0.35, 0.16, 0.06, 0.03] # 3% anomalies for robust anti-cheat isolation

    for i in range(num_samples):
        arch_idx = np.random.choice(len(archetypes), p=weights)
        arch = archetypes[arch_idx]
        is_cheater = (arch_idx == 4)

        weapon_id = random.choice(WEAPON_IDS)
        
        accuracy = round(float(np.random.uniform(*arch["acc"])), 4)
        headshot_rate = round(float(np.random.uniform(*arch["hs"])), 4)
        recoil_control = round(float(np.random.uniform(*arch["recoil"])), 2)
        reaction_time_ms = round(float(np.random.uniform(*arch["react"])), 1)
        target_kd = float(np.random.uniform(*arch["kd"]))

        deaths = max(1, int(np.random.poisson(7)))
        kills = max(0, int(deaths * target_kd + np.random.normal(0, 1)))
        if is_cheater:
            kills = max(18, kills)
            deaths = min(3, deaths)

        assists = int(np.random.poisson(3))
        damage = int(kills * np.random.uniform(90, 130) + assists * np.random.uniform(20, 50))
        headshots = min(kills, int(kills * headshot_rate))
        score = kills * 100 + assists * 35 + (damage // 10)
        match_duration_sec = int(np.random.uniform(180, 480))
        is_win = 1 if (kills / max(1, deaths) > 1.2 or (not is_cheater and random.random() > 0.45)) else 0

        avg_kill_distance_m = round(float(np.random.uniform(5.0, 75.0)), 2)
        flick_consistency = round(float(np.random.uniform(0.3, 0.98 if not is_cheater else 0.99)), 3)
        crosshair_placement_score = round(float(recoil_control * 0.8 + accuracy * 30), 1)

        level = random.randint(1, 100)
        matches_played = random.randint(5, 1200)

        # Days inactive & churn risk factors
        days_inactive = random.randint(0, 30)
        win_streak = random.randint(0, 6) if is_win else 0
        loss_streak = random.randint(0, 6) if not is_win else 0
        
        # Ground truth skill rating (Elo scale 1000 - 9000)
        base_skill = 1200 + (accuracy * 2500) + (recoil_control * 25) + (kills * 80) - (deaths * 40) + ((500 - reaction_time_ms) * 3)
        skill_rating = max(1000.0, min(9000.0, round(float(base_skill), 1)))

        # Ground truth churn risk (1 = likely to churn, 0 = active player)
        churn_prob = (days_inactive / 30.0) * 0.5 + (loss_streak / 7.0) * 0.3 + (1.0 / max(1, matches_played // 10)) * 0.2
        churn_risk = 1 if (churn_prob > 0.45 and not is_cheater) else 0

        # Weapon balance label: 0: Underpowered, 1: Optimal, 2: Overpowered
        # Let certain weapons have synthetic meta bias for realistic balance training
        if "shiva_one_shot" in weapon_id or "surya_50" in weapon_id or "bijli_vector" in weapon_id:
            weapon_balance_label = 2 # OVERPOWERED
        elif "tactical_flare" in weapon_id or "veer_45" in weapon_id or "shock_baton" in weapon_id:
            weapon_balance_label = 0 # UNDERPOWERED
        else:
            weapon_balance_label = 1 # OPTIMAL

        record = {
            "player_id": f"p_{i % 800}",
            "match_id": f"m_{i}",
            "weapon_id": weapon_id,
            "accuracy": accuracy,
            "headshot_rate": headshot_rate,
            "recoil_control": recoil_control,
            "reaction_time_ms": reaction_time_ms,
            "avg_kill_distance_m": avg_kill_distance_m,
            "flick_consistency": flick_consistency,
            "crosshair_placement_score": crosshair_placement_score,
            "kills": kills,
            "deaths": deaths,
            "assists": assists,
            "damage": damage,
            "headshots": headshots,
            "score": score,
            "is_win": is_win,
            "match_duration_sec": match_duration_sec,
            "level": level,
            "matches_played": matches_played,
            "days_inactive": days_inactive,
            "win_streak": win_streak,
            "loss_streak": loss_streak,
            # Target labels
            "skill_rating": skill_rating,
            "weapon_balance_label": weapon_balance_label,
            "churn_risk": churn_risk,
            "is_cheater": 1 if is_cheater else 0
        }
        records.append(record)

    return records
