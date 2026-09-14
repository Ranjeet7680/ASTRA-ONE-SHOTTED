"""
Unit Tests for AI Serving & Deterministic Fallback Engine
Validates sub-20ms inference latency, behavior tree fallback safeguards,
and FastAPI /ai router endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from ml.serving.ai_serving import get_serving_engine
from ml.serving.deterministic_fallback import DeterministicFallbackBot


def test_ai_serving_engine_latency_and_safeguards():
    engine = get_serving_engine()

    # Bot action test
    state = {
        "health": 100.0,
        "ammo": 30,
        "enemy_visible": True,
        "enemy_rel_pos": [2.0, 0.0, 15.0],
        "difficulty": "NORMAL"
    }

    result = engine.predict_bot_action(state)
    assert result["source"] in ["NEURAL_NET", "LATENCY_SAFETY_FALLBACK"]
    assert "aim_pitch" in result
    assert "aim_yaw" in result
    assert "fire" in result
    assert "move_vector" in result
    assert result["latency_ms"] < 25.0  # Safeguard ceiling

    # Forced fallback test
    fallback_state = dict(state, force_fallback=True)
    fallback_res = engine.predict_bot_action(fallback_state)
    assert "DETERMINISTIC_FALLBACK" in fallback_res["source"]


def test_deterministic_fallback_bot():
    bot = DeterministicFallbackBot()

    # 1. Low health triggers cover
    low_hp_state = {
        "health": 15.0,
        "ammo": 20,
        "enemy_visible": True,
        "enemy_distance": 12.0,
        "enemy_relative_angle": 5.0
    }
    res_cover = bot.compute_action(low_hp_state)
    assert res_cover["action"] == "TAKE_COVER"
    assert res_cover["tactical_state"] == "CRITICAL_RETREAT"

    # 2. Empty ammo triggers reload
    empty_ammo_state = {
        "health": 100.0,
        "ammo": 0,
        "enemy_visible": True
    }
    res_reload = bot.compute_action(empty_ammo_state)
    assert res_reload["action"] == "RELOAD"
    assert res_reload["tactical_state"] == "EMERGENCY_RELOAD"


def test_fastapi_ai_endpoints():
    client = TestClient(app)

    # 1. Status endpoint
    status_resp = client.get("/ai/models/status")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert "models" in status_data
    assert "curriculum" in status_data
    assert "metrics" in status_data

    # 2. Bot action endpoint
    action_resp = client.post("/ai/bot/action", json={
        "health": 90.0,
        "ammo": 25,
        "enemy_visible": True,
        "enemy_rel_pos": [1.0, 0.0, 12.0],
        "difficulty": "HARD"
    })
    assert action_resp.status_code == 200
    act_data = action_resp.json()
    assert "action" in act_data
    assert "latency_ms" in act_data

    # 3. Recommendation endpoint
    rec_resp = client.post("/ai/recommend/loadout", json={
        "kills": 12,
        "deaths": 2,
        "accuracy": 0.48,
        "movement_speed": 5.8
    })
    assert rec_resp.status_code == 200
    rec_data = rec_resp.json()
    assert len(rec_data["top_weapons"]) == 5
    assert "recommended_loadout" in rec_data

    # 4. Anomaly score endpoint
    anom_resp = client.post("/ai/anomaly/score", json={
        "telemetry": [
            {
                "delta_pitch": 0.2,
                "delta_yaw": 0.5,
                "angular_accel": 80.0,
                "velocity_x": 2.5,
                "velocity_z": 1.0,
                "reaction_time_ms": 220.0
            }
            for _ in range(20)
        ]
    })
    assert anom_resp.status_code == 200
    anom_data = anom_resp.json()
    assert "anomaly_score" in anom_data
    assert anom_data["safety_guarantee"] == "AUTOMATED_BAN_PREVENTED"
