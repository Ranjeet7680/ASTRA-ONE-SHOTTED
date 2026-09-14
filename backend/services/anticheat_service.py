import json
from datetime import datetime
from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session
from backend.models.anticheat import SuspiciousIncident
from shared.constants import ANTI_CHEAT_THRESHOLDS

class AntiCheatService:
    @staticmethod
    def validate_combat_event(db: Session, player_id: str, match_id: str, event_data: Dict[str, Any]) -> Tuple[bool, float, str]:
        """
        Evaluates a single combat event against physical anti-cheat constraints.
        Returns (is_suspicious, anomaly_score, incident_type).
        """
        event_type = event_data.get("event_type")
        weapon_id = event_data.get("weapon_id", "")
        distance = event_data.get("distance", 0.0)
        damage = event_data.get("damage_amount", 0)
        is_headshot = event_data.get("is_headshot", False)
        
        is_suspicious = False
        anomaly_score = 0.0
        incident_type = ""
        details = {}

        # 1. Kill Distance Validation
        if event_type == "KILL":
            if "knife" in weapon_id.lower() and distance > ANTI_CHEAT_THRESHOLDS["max_knife_distance"]:
                is_suspicious = True
                anomaly_score = 0.95
                incident_type = "IMPOSSIBLE_MELEE_DISTANCE"
                details = {"distance": distance, "limit": ANTI_CHEAT_THRESHOLDS["max_knife_distance"]}
            elif "shotgun" in weapon_id.lower() and distance > ANTI_CHEAT_THRESHOLDS["max_shotgun_lethal_distance"]:
                is_suspicious = True
                anomaly_score = 0.85
                incident_type = "EXCESSIVE_SHOTGUN_DISTANCE"
                details = {"distance": distance, "limit": ANTI_CHEAT_THRESHOLDS["max_shotgun_lethal_distance"]}

        # 2. Damage Threshold Validation
        if damage > 450: # Even sniper headshot max is 416
            is_suspicious = True
            anomaly_score = 0.98
            incident_type = "IMPOSSIBLE_DAMAGE_VALUE"
            details = {"damage": damage, "max_allowed": 450}

        # 3. Movement Velocity Validation (if velocity / pos delta provided)
        velocity = event_data.get("velocity", 0.0)
        if velocity > ANTI_CHEAT_THRESHOLDS["max_speed_units_per_sec"]:
            is_suspicious = True
            anomaly_score = 0.92
            incident_type = "IMPOSSIBLE_MOVEMENT_SPEED"
            details = {"velocity": velocity, "limit": ANTI_CHEAT_THRESHOLDS["max_speed_units_per_sec"]}

        # Log incident if suspicious
        if is_suspicious:
            incident = SuspiciousIncident(
                player_id=player_id,
                match_id=match_id,
                incident_type=incident_type,
                anomaly_score=anomaly_score,
                details_json=json.dumps(details),
                status="PENDING"
            )
            db.add(incident)
            db.commit()

        return is_suspicious, anomaly_score, incident_type

    @staticmethod
    def validate_match_performance(db: Session, player_id: str, match_id: str, kills: int, headshots: int, accuracy: float) -> Tuple[bool, float, str]:
        """
        Evaluates full-match aggregate performance metrics for aimbot / modified client detection.
        """
        if kills >= ANTI_CHEAT_THRESHOLDS["min_headshot_rate_sample_size"]:
            hs_rate = headshots / kills
            if hs_rate >= ANTI_CHEAT_THRESHOLDS["max_headshot_rate_flag"]:
                incident = SuspiciousIncident(
                    player_id=player_id,
                    match_id=match_id,
                    incident_type="EXCESSIVE_HEADSHOT_ACCURACY",
                    anomaly_score=0.89,
                    details_json=json.dumps({"kills": kills, "headshots": headshots, "headshot_rate": round(hs_rate, 3)}),
                    status="PENDING"
                )
                db.add(incident)
                db.commit()
                return True, 0.89, "EXCESSIVE_HEADSHOT_ACCURACY"

        if accuracy > 94.0 and kills >= 15:
            incident = SuspiciousIncident(
                player_id=player_id,
                match_id=match_id,
                incident_type="ABNORMAL_PERFECT_ACCURACY",
                anomaly_score=0.91,
                details_json=json.dumps({"kills": kills, "accuracy": accuracy}),
                status="PENDING"
            )
            db.add(incident)
            db.commit()
            return True, 0.91, "ABNORMAL_PERFECT_ACCURACY"

        return False, 0.0, ""

    @staticmethod
    def get_pending_incidents(db: Session, limit: int = 50):
        return db.query(SuspiciousIncident).filter(SuspiciousIncident.status == "PENDING").order_by(SuspiciousIncident.anomaly_score.desc()).limit(limit).all()

    @staticmethod
    def review_incident(db: Session, incident_id: str, new_status: str) -> bool:
        incident = db.query(SuspiciousIncident).filter(SuspiciousIncident.id == incident_id).first()
        if not incident:
            return False
        incident.status = new_status
        db.commit()
        return True
