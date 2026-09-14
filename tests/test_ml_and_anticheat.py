import pytest

def test_ml_skill_prediction(client):
    payload = {
        "kills": 14,
        "deaths": 3,
        "accuracy": 0.45,
        "headshot_rate": 0.35,
        "recoil_control": 75.0,
        "reaction_time_ms": 190.0,
        "damage": 1500,
        "score": 1600
    }
    res = client.post("/ml/skill", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "predicted_skill_rating" in data
    assert data["predicted_skill_rating"] >= 1000
    assert "skill_percentile" in data
    assert "tier_bracket" in data

def test_ml_weapon_balance(client):
    payload = {
        "weapon_id": "ar_rudra_m4",
        "win_rate": 0.53,
        "pick_rate": 0.08,
        "kd_ratio": 1.25,
        "headshot_rate": 0.22,
        "avg_damage_per_match": 750.0,
        "kills_per_match": 6.5
    }
    res = client.post("/ml/balance", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["balance_status"] in ["OPTIMAL", "OVERPOWERED", "UNDERPOWERED"]
    assert len(data["tuning_recommendations"]) > 0

def test_ml_balance_all_weapons(client):
    res = client.get("/ml/balance/all")
    assert res.status_code == 200
    all_weps = res.json()
    assert len(all_weps) >= 50
    for w in all_weps:
        assert "balance_status" in w
        assert "tuning_recommendations" in w

def test_ml_churn_prediction(client):
    payload = {
        "days_inactive": 14,
        "matches_played": 8,
        "level": 3,
        "win_streak": 0,
        "loss_streak": 4,
        "is_win": 0
    }
    res = client.post("/ml/churn", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "churn_probability" in data
    assert data["risk_level"] in ["LOW", "MODERATE", "HIGH"]
    assert len(data["recommended_retention_actions"]) > 0

def test_ml_aim_analytics(client):
    payload = {
        "accuracy": 0.48,
        "recoil_control": 82.0,
        "reaction_time_ms": 175.0,
        "flick_consistency": 0.85,
        "crosshair_placement": 78.0
    }
    res = client.post("/ml/aim", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "overall_aim_rating" in data
    assert data["overall_aim_rating"] > 50
    assert "insights" in data

def test_ml_recommendations(client):
    payload = {
        "playstyle": "AGGRESSIVE_RUSHER",
        "accuracy": 0.40
    }
    res = client.post("/ml/recommendations", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "recommended_primary_weapons" in data
    assert len(data["recommended_primary_weapons"]) > 0
    assert "justification" in data

def test_ml_registry_status(client):
    res = client.get("/ml/registry")
    assert res.status_code == 200
    data = res.json()
    assert "models" in data
    assert "skill_rating" in data["models"]
    assert "weapon_balance" in data["models"]
    assert "anti_cheat_anomaly" in data["models"]

def test_admin_api(client):
    overview_res = client.get("/admin/api/overview")
    assert overview_res.status_code == 200
    ov = overview_res.json()
    assert ov["server_status"] == "HEALTHY"
    assert ov["weapons_in_catalog"] >= 50

    incidents_res = client.get("/admin/api/incidents?status=ALL")
    assert incidents_res.status_code == 200

    models_res = client.get("/admin/api/models")
    assert models_res.status_code == 200

    rollback_res = client.post("/admin/api/models/rollback", json={
        "model_id": "skill_rating",
        "target_version": "v1.0.0"
    })
    assert rollback_res.status_code == 200
    assert rollback_res.json()["success"] is True
