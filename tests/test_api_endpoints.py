import pytest

def test_health_check(client):
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "HEALTHY"
    assert "ASTRA" in data["game"]

def test_auth_me(client, auth_headers):
    res = client.get("/auth/me", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "player_id" in data
    assert "TacticalTester" in data["username"] or "Operator" in data["username"]

def test_player_profile(client, auth_headers):
    res = client.get("/player/profile", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["level"] >= 1
    assert "rank" in data
    assert "kd_ratio" in data

def test_weapons_catalog(client):
    res = client.get("/weapons")
    assert res.status_code == 200
    body = res.json()
    weapons = body["weapons"]
    assert len(weapons) >= 50, f"Expected at least 50 weapons, got {len(weapons)}"
    
    # Verify specific category
    ar_res = client.get("/weapons/category/ASSAULT_RIFLE")
    assert ar_res.status_code == 200
    ars = ar_res.json()
    assert len(ars) >= 5
    for w in ars:
        assert w["category"] == "ASSAULT_RIFLE"

def test_loadouts_management(client, auth_headers):
    res = client.get("/loadouts", headers=auth_headers)
    assert res.status_code == 200
    loadouts = res.json()
    assert isinstance(loadouts, list)

    if loadouts:
        loadout_id = loadouts[0]["id"]
        update_payload = {
            "name": "Custom Spec Ops",
            "primary_weapon_id": "ar_astra_alpha",
            "secondary_weapon_id": "pistol_astra_sidearm"
        }
        put_res = client.put(f"/loadouts/{loadout_id}", json=update_payload, headers=auth_headers)
        assert put_res.status_code == 200
        assert put_res.json()["name"] == "Custom Spec Ops"

def test_matchmaking_queue(client, auth_headers):
    # Join queue
    join_res = client.post("/matchmaking/join", json={"mode": "TDM", "map_id": "city", "max_latency_ms": 60}, headers=auth_headers)
    assert join_res.status_code == 200
    assert join_res.json()["status"] in ["QUEUED", "MATCH_FOUND"]

    # Check status
    stat_res = client.get("/matchmaking/status", headers=auth_headers)
    assert stat_res.status_code == 200

    # Leave queue
    leave_res = client.post("/matchmaking/leave", headers=auth_headers)
    assert leave_res.status_code == 200

def test_match_lifecycle_and_authoritative_scoring(client, auth_headers):
    # Start match
    start_payload = {
        "mode": "TDM",
        "map_id": "city",
        "player_ids": ["p_tester_001"]
    }
    m_res = client.post("/matches/start", json=start_payload)
    assert m_res.status_code == 200
    match_id = m_res.json()["match_id"]

    # Submit combat events
    event_payload = {
        "event_type": "KILL",
        "player_id": "p_tester_001",
        "target_id": "bot_1",
        "weapon_id": "ar_astra_alpha",
        "damage_amount": 100,
        "is_headshot": True,
        "distance": 22.5
    }
    ev_res = client.post(f"/matches/{match_id}/events", json=event_payload, headers=auth_headers)
    assert ev_res.status_code == 200

    # Authoritative Finish match
    finish_payload = {
        "winner_team": "BLUE",
        "blue_score": 40,
        "red_score": 32,
        "player_stats": {
            "p_tester_001": {
                "kills": 8,
                "deaths": 2,
                "assists": 3,
                "damage": 850,
                "headshots": 3,
                "score": 900
            }
        }
    }
    fin_res = client.post(f"/matches/{match_id}/finish", json=finish_payload, headers=auth_headers)
    assert fin_res.status_code == 200
    fin_data = fin_res.json()
    assert fin_data["match_id"] == match_id
    assert fin_data["winner_team"] == "BLUE"

def test_ranking_and_leaderboard(client, auth_headers):
    lb_res = client.get("/ranking/leaderboard?limit=10")
    assert lb_res.status_code == 200
    lb = lb_res.json()
    assert isinstance(lb, list)

    tier_res = client.get("/ranking/tier", headers=auth_headers)
    assert tier_res.status_code == 200
    assert "rank_score" in tier_res.json()
    assert "next_rank" in tier_res.json()

def test_missions(client, auth_headers):
    m_res = client.get("/missions", headers=auth_headers)
    assert m_res.status_code == 200
    data = m_res.json()
    missions = data["missions"]
    assert len(missions) >= 1
    assert "title" in missions[0]

def test_rewards_preview(client, auth_headers):
    preview_res = client.post("/rewards/preview", json={
        "is_win": True,
        "kills": 6,
        "headshots": 2,
        "damage": 700,
        "score": 800,
        "is_mvp": True
    }, headers=auth_headers)
    assert preview_res.status_code == 200
    data = preview_res.json()
    assert data["xp"] > 500
    assert "reward_claim_token" in data
