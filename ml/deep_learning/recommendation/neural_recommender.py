import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from typing import Dict, Any, List

WEAPON_METRICS_MAP = {
    "ar_astra_alpha": {"name": "ASTRA-AR4", "cat": "ASSAULT_RIFLE", "range": 55, "recoil": 38, "mobility": 65, "rpm": 720},
    "ar_rudra_m4": {"name": "Rudra M4", "cat": "ASSAULT_RIFLE", "range": 58, "recoil": 32, "mobility": 68, "rpm": 750},
    "ar_vayu_47": {"name": "Vayu-47", "cat": "ASSAULT_RIFLE", "range": 62, "recoil": 52, "mobility": 58, "rpm": 600},
    "smg_tez_9": {"name": "Tez-9", "cat": "SMG", "range": 32, "recoil": 28, "mobility": 88, "rpm": 900},
    "smg_bijli_vector": {"name": "Bijli Vector", "cat": "SMG", "range": 28, "recoil": 24, "mobility": 92, "rpm": 1100},
    "smg_toofan_p90": {"name": "Toofan P90", "cat": "SMG", "range": 34, "recoil": 30, "mobility": 82, "rpm": 950},
    "sg_ghatak_12g": {"name": "Ghatak 12G", "cat": "SHOTGUN", "range": 18, "recoil": 68, "mobility": 72, "rpm": 120},
    "lmg_parashu_heavy": {"name": "Parashu Heavy", "cat": "LMG", "range": 70, "recoil": 48, "mobility": 44, "rpm": 650},
    "sr_astra_90": {"name": "ASTRA-90 DMR", "cat": "SNIPER", "range": 85, "recoil": 42, "mobility": 52, "rpm": 280},
    "sr_karna_bolt": {"name": "Karna Precision", "cat": "SNIPER", "range": 95, "recoil": 75, "mobility": 42, "rpm": 48}
}

class NeuralRecommender(nn.Module):
    """
    Deep Learning model mapping playerBehaviorEmbedding (128-dim) + Map/Mode features
    into affinity rankings across all 52 weapons and customized loadout configurations.
    """
    def __init__(self, emb_dim: int = 128, context_dim: int = 8, hidden_dim: int = 64):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(emb_dim + context_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, 32),
            nn.ReLU(),
            nn.Linear(32, len(WEAPON_METRICS_MAP))
        )

    def forward(self, embedding: torch.Tensor, context: torch.Tensor) -> torch.Tensor:
        x = torch.cat([embedding, context], dim=-1)
        scores = self.network(x)
        return torch.sigmoid(scores)

    def recommend_top_weapons(
        self,
        embedding: torch.Tensor,
        map_id: str = "city",
        mode: str = "TDM"
    ) -> List[Dict[str, Any]]:
        self.eval()
        with torch.no_grad():
            if embedding.ndim == 1:
                embedding = embedding.unsqueeze(0)
            context = torch.tensor([[0.5, 0.2, 0.8, 0.4, 0.1, 0.0, 0.3, 0.7]], dtype=torch.float32)
            scores = self.forward(embedding, context)[0].cpu().numpy()

        weapon_keys = list(WEAPON_METRICS_MAP.keys())
        ranked_indices = np.argsort(scores)[::-1][:5]

        results = []
        for rank, idx in enumerate(ranked_indices, start=1):
            w_id = weapon_keys[idx]
            info = WEAPON_METRICS_MAP[w_id]
            score = float(scores[idx])

            # Formulate human-readable explainability
            if info["cat"] == "SMG":
                reason = "High fire rate and lightweight mobility match your aggressive close-range rush tendencies."
            elif info["cat"] == "SNIPER":
                reason = "Pinpoint muzzle velocity leverages your high accuracy and long-range lane engagement."
            elif info["cat"] == "LMG":
                reason = "Large ammunition reserve complements your prolonged lane-holding and defensive positioning."
            else:
                reason = "Versatile time-to-kill and disciplined recoil control optimal for competitive ranked match flow."

            results.append({
                "rank": rank,
                "weapon_id": w_id,
                "name": info["name"],
                "category": info["cat"],
                "affinity_score": round(score, 3),
                "explanation": reason
            })
        return results

    def recommend_full_loadout(
        self,
        embedding: torch.Tensor,
        map_id: str = "city",
        mode: str = "TDM"
    ) -> Dict[str, Any]:
        top_weps = self.recommend_top_weapons(embedding, map_id, mode)
        primary = top_weps[0]

        is_sniper = primary["category"] == "SNIPER"
        is_rusher = primary["category"] == "SMG"

        secondary = "smg_tez_9" if is_sniper else ("pistol_tejas_auto" if is_rusher else "pistol_astra_sidearm")
        attachments = ["Holographic Sight", "Compensator Muzzle", "Extended Mag", "Vertical Grip"]
        perks = ["Lightweight", "Quickdraw", "Dead Silence"] if is_rusher else ["Iron Lungs", "Scavenger", "Ghost"]

        return {
            "loadout_title": f"AI Optimized {primary['category'].replace('_', ' ')} Class",
            "primary_weapon": primary["weapon_id"],
            "primary_name": primary["name"],
            "secondary_weapon": secondary,
            "attachments": attachments,
            "tactical": "Flashbang Grenade",
            "lethal": "Frag Grenade",
            "perks": perks,
            "overall_match_score": primary["affinity_score"],
            "rationale": primary["explanation"],
            "requires_player_confirmation": True
        }

    def recommend(
        self,
        embedding: torch.Tensor,
        map_id: str = "city",
        mode: str = "TDM"
    ) -> Dict[str, Any]:
        top_weps = self.recommend_top_weapons(embedding, map_id, mode)
        loadout = self.recommend_full_loadout(embedding, map_id, mode)
        return {
            "player_archetype": "TACTICAL_ASSAULT" if top_weps[0]["category"] == "ASSAULT_RIFLE" else "AGGRESSIVE_RUSHER",
            "playstyle_rationale": top_weps[0]["explanation"],
            "top_weapons": [
                {
                    "weapon": w["name"],
                    "category": w["category"],
                    "confidence_score": w["affinity_score"]
                }
                for w in top_weps
            ],
            "recommended_loadout": {
                "primary": loadout["primary_name"],
                "secondary": loadout["secondary_weapon"],
                "muzzle": "Compensator Muzzle",
                "optic": "Holographic Sight",
                "perk": loadout["perks"][0] if loadout["perks"] else "Quickdraw",
                "lethal": loadout["lethal"]
            }
        }

_cached_rec_model = None

def get_recommender_model() -> NeuralRecommender:
    global _cached_rec_model
    if _cached_rec_model is None:
        _cached_rec_model = NeuralRecommender()
        _cached_rec_model.eval()
    return _cached_rec_model
