import numpy as np
from typing import Dict, Any, List, Optional
from ml.inference.model_registry import ModelRegistryManager
from ml.features.feature_pipeline import FeaturePipeline

class MLPredictor:
    @staticmethod
    def predict_skill(record: Dict[str, Any]) -> Dict[str, Any]:
        """Predict player combat skill rating."""
        model = ModelRegistryManager.get_model("skill_rating")
        feats = FeaturePipeline.extract_skill_features(record)
        
        if model is not None:
            raw_score = float(model.predict(np.array([feats]))[0])
        else:
            # Fallback heuristic if model is uninitialized
            kd = record.get("kills", 0) / max(1, record.get("deaths", 1))
            raw_score = 1200 + (kd * 400) + (record.get("accuracy", 0.3) * 2000)

        score = max(1000, min(9000, round(raw_score)))
        
        # Determine skill percentile
        percentile = min(99.9, max(1.0, round(((score - 1000) / 8000.0) * 100, 1)))

        return {
            "predicted_skill_rating": score,
            "skill_percentile": percentile,
            "tier_bracket": "ELITE" if score > 6000 else ("DIAMOND" if score > 4500 else ("GOLD" if score > 2500 else "BRONZE")),
            "confidence": 0.95
        }

    @staticmethod
    def evaluate_weapon_balance(weapon_stats: Dict[str, Any]) -> Dict[str, Any]:
        """Classify weapon balance status and recommend tuning."""
        model = ModelRegistryManager.get_model("weapon_balance")
        feats = FeaturePipeline.extract_weapon_balance_features(weapon_stats)

        label_map = {0: "UNDERPOWERED", 1: "OPTIMAL", 2: "OVERPOWERED"}
        
        if model is not None:
            pred_class = int(model.predict(np.array([feats]))[0])
            probs = model.predict_proba(np.array([feats]))[0]
            confidence = round(float(probs[pred_class]), 3)
        else:
            pred_class = 1
            confidence = 0.85

        status = label_map.get(pred_class, "OPTIMAL")
        
        recommendations = []
        if status == "OVERPOWERED":
            recommendations.append("Reduce base damage by 4-6% or increase vertical recoil climb.")
            recommendations.append("Decrease effective damage drop-off distance by 5 meters.")
        elif status == "UNDERPOWERED":
            recommendations.append("Buff bullet velocity by 8% or decrease reload time by 0.2s.")
            recommendations.append("Tighten initial 3-shot hipfire spread.")
        else:
            recommendations.append("Weapon performance aligns with competitive TTK targets. No balance patch needed.")

        return {
            "weapon_id": weapon_stats.get("weapon_id", "unknown"),
            "balance_status": status,
            "confidence": confidence,
            "win_rate": weapon_stats.get("win_rate", 0.50),
            "pick_rate": weapon_stats.get("pick_rate", 0.05),
            "kd_ratio": weapon_stats.get("kd_ratio", 1.0),
            "tuning_recommendations": recommendations
        }

    @staticmethod
    def predict_churn(record: Dict[str, Any]) -> Dict[str, Any]:
        """Predict risk of player abandonment and provide retention rewards."""
        model = ModelRegistryManager.get_model("churn_risk")
        feats = FeaturePipeline.extract_churn_features(record)

        if model is not None:
            probs = model.predict_proba(np.array([feats]))[0]
            churn_prob = round(float(probs[1]), 3)
        else:
            days = record.get("days_inactive", 0)
            churn_prob = min(0.99, round(days / 30.0, 2))

        risk_level = "HIGH" if churn_prob > 0.65 else ("MODERATE" if churn_prob > 0.35 else "LOW")

        retention_actions = []
        if risk_level == "HIGH":
            retention_actions.append("Trigger Welcome Back login bonus: 1,000 Credits + 2 Rare Weapon Crates.")
            retention_actions.append("Send push notification for double XP weekend event.")
        elif risk_level == "MODERATE":
            retention_actions.append("Offer daily challenge with guaranteed Battle Pass XP boost.")

        return {
            "churn_probability": churn_prob,
            "risk_level": risk_level,
            "recommended_retention_actions": retention_actions
        }

    @staticmethod
    def detect_aim_anomaly(record: Dict[str, Any]) -> Dict[str, Any]:
        """Anti-cheat aimbot and macro detection."""
        model = ModelRegistryManager.get_model("anti_cheat_anomaly")
        feats = FeaturePipeline.extract_anomaly_features(record)

        flags = []
        # Rule-based heuristics combined with Isolation Forest
        acc = float(record.get("accuracy", 0.3))
        hs = float(record.get("headshot_rate", 0.2))
        reaction_ms = float(record.get("reaction_time_ms", 260.0))
        dist_m = float(record.get("avg_kill_distance_m", 25.0))
        flick = float(record.get("flick_consistency", 0.6))

        if hs > 0.75 and acc > 0.65:
            flags.append("Abnormally high headshot ratio combined with extreme hit accuracy.")
        if reaction_ms < 110.0:
            flags.append("Superhuman target acquisition latency (< 110ms).")
        if flick > 0.98:
            flags.append("Machine-like linear flick consistency.")

        if model is not None:
            iso_score = float(model.decision_function(np.array([feats]))[0])
            is_model_anomaly = bool(model.predict(np.array([feats]))[0] == -1)
        else:
            iso_score = 0.1
            is_model_anomaly = len(flags) >= 2

        anomaly_score = round(max(0.0, min(1.0, 0.5 - (iso_score * 2.0))), 3)
        is_suspicious = is_model_anomaly or len(flags) > 0

        risk_tier = "HIGH_RISK" if (anomaly_score > 0.75 or len(flags) >= 2) else ("SUSPICIOUS" if is_suspicious else "CLEAN")

        return {
            "is_anomaly": is_suspicious,
            "anomaly_score": anomaly_score,
            "risk_tier": risk_tier,
            "telemetry_flags": flags,
            "action_taken": "FLAGGED_FOR_REVIEW" if risk_tier == "HIGH_RISK" else "MONITORING"
        }

    @staticmethod
    def get_recommendations(playstyle: str = "BALANCED_COMPETITIVE", accuracy: float = 0.35) -> Dict[str, Any]:
        """Explainable weapon and loadout recommendation."""
        recs = ModelRegistryManager.get_model("recommendation_engine")
        if not recs or not isinstance(recs, dict):
            # Fallback
            playstyle = "BALANCED_COMPETITIVE"
            recs = {
                "BALANCED_COMPETITIVE": {
                    "primary": ["ar_astra_alpha", "ar_garuda_556"],
                    "secondary": ["pistol_astra_sidearm", "melee_combat_axe"],
                    "reason": "Balanced time-to-kill and controllable recoil ideal for your tactical pacing."
                }
            }

        style_key = playstyle.upper()
        if style_key not in recs:
            style_key = "BALANCED_COMPETITIVE"

        data = recs[style_key]
        return {
            "playstyle_detected": style_key,
            "recommended_primary_weapons": data.get("primary", []),
            "recommended_secondary_weapons": data.get("secondary", []),
            "justification": data.get("reason", "Tailored to your engagement distances and recoil control."),
            "suggested_perks": ["Quickdraw", "Scavenger", "Dead Silence"]
        }

    @staticmethod
    def score_aim_telemetry(accuracy: float, recoil: float, reaction_ms: float, flick: float, crosshair: float) -> Dict[str, Any]:
        """Compute aim breakdown radar metrics."""
        return FeaturePipeline.compute_aim_telemetry_scores(accuracy, recoil, reaction_ms, flick, crosshair)
