import numpy as np
from typing import Dict, Any, List, Tuple

class FeaturePipeline:
    @staticmethod
    def extract_skill_features(record: Dict[str, Any]) -> List[float]:
        """Extract combat telemetry features for player skill rating model."""
        kd = record.get("kills", 0) / max(1, record.get("deaths", 1))
        return [
            float(record.get("accuracy", 0.3)),
            float(record.get("headshot_rate", 0.2)),
            float(record.get("recoil_control", 50.0)),
            float(record.get("reaction_time_ms", 260.0)),
            float(record.get("flick_consistency", 0.6)),
            float(record.get("kills", 5)),
            float(record.get("deaths", 5)),
            float(kd),
            float(record.get("damage", 600)),
            float(record.get("score", 700))
        ]

    @staticmethod
    def extract_weapon_balance_features(weapon_stats: Dict[str, Any]) -> List[float]:
        """Extract aggregated balance features for a weapon."""
        return [
            float(weapon_stats.get("pick_rate", 0.05)),
            float(weapon_stats.get("win_rate", 0.50)),
            float(weapon_stats.get("kd_ratio", 1.0)),
            float(weapon_stats.get("headshot_rate", 0.20)),
            float(weapon_stats.get("avg_damage_per_match", 700.0)),
            float(weapon_stats.get("kills_per_match", 6.0))
        ]

    @staticmethod
    def extract_churn_features(record: Dict[str, Any]) -> List[float]:
        """Extract engagement telemetry features for churn risk prediction."""
        return [
            float(record.get("days_inactive", 0)),
            float(record.get("matches_played", 10)),
            float(record.get("level", 1)),
            float(record.get("win_streak", 0)),
            float(record.get("loss_streak", 0)),
            float(record.get("is_win", 1))
        ]

    @staticmethod
    def extract_anomaly_features(record: Dict[str, Any]) -> List[float]:
        """Extract aim telemetry features for anti-cheat Isolation Forest."""
        return [
            float(record.get("accuracy", 0.3)),
            float(record.get("headshot_rate", 0.2)),
            float(record.get("recoil_control", 50.0)),
            float(record.get("reaction_time_ms", 260.0)),
            float(record.get("avg_kill_distance_m", 25.0)),
            float(record.get("flick_consistency", 0.6)),
            float(record.get("kills", 5))
        ]

    @staticmethod
    def compute_aim_telemetry_scores(accuracy: float, recoil: float, reaction_ms: float, flick: float, crosshair: float) -> Dict[str, Any]:
        """Produce deep aim analytics breakdown and coaching metrics."""
        # Accuracy index (0 - 100)
        acc_score = min(100.0, max(0.0, (accuracy / 0.65) * 100.0))
        # Recoil control index (0 - 100)
        recoil_score = min(100.0, max(0.0, recoil))
        # Reaction time score (lower ms is better, 130ms = 100, 450ms = 20)
        reaction_score = min(100.0, max(0.0, (450.0 - reaction_ms) / (450.0 - 130.0) * 100.0))
        # Flick rating (0 - 100)
        flick_score = min(100.0, max(0.0, flick * 100.0))
        # Crosshair placement rating (0 - 100)
        crosshair_score = min(100.0, max(0.0, crosshair))

        overall_aim_rating = round((acc_score * 0.3 + recoil_score * 0.25 + reaction_score * 0.2 + flick_score * 0.15 + crosshair_score * 0.1), 1)

        insights = []
        if reaction_ms < 170:
            insights.append("Exceptional twitch reaction speed in close-quarters skirmishes.")
        elif reaction_ms > 330:
            insights.append("Reaction time can be sharpened with pre-aiming corners.")

        if recoil_score > 75:
            insights.append("Sustained automatic spray control is highly disciplined.")
        else:
            insights.append("Recommend equipping compensating muzzle attachments for spray stabilization.")

        if acc_score > 70:
            insights.append("Pinpoint marksmanship detected across mid-to-long ranges.")

        return {
            "overall_aim_rating": overall_aim_rating,
            "accuracy_score": round(acc_score, 1),
            "recoil_control_score": round(recoil_score, 1),
            "reaction_time_score": round(reaction_score, 1),
            "reaction_time_ms": reaction_ms,
            "flick_consistency_score": round(flick_score, 1),
            "crosshair_placement_score": round(crosshair_score, 1),
            "insights": insights
        }
