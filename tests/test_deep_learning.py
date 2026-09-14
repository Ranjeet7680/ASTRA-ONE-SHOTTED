"""
Unit Tests for Advanced Deep Learning Pipeline
Validates behavior embeddings, sequence transformers, human aim modifiers,
neural recommenders, and non-banning anomaly detection autoencoders.
"""

import pytest
import numpy as np
import torch

from ml.deep_learning.player_behavior.behavior_net import (
    PlayerBehaviorNN,
    extract_behavior_features,
    extract_player_behavior_embedding
)
from ml.deep_learning.sequence_model.sequence_transformer import GameplaySequenceTransformer
from ml.deep_learning.aim_movement.aim_movement_net import (
    BotAimMovementNet,
    HumanAimModifier,
    DIFFICULTY_PROFILES
)
from ml.deep_learning.recommendation.neural_recommender import NeuralRecommender
from ml.deep_learning.anomaly_detection.anomaly_autoencoder import (
    TelemetryAutoencoder,
    AnomalyDetector
)


def test_player_behavior_embedding():
    model = PlayerBehaviorNN(input_dim=14, embedding_dim=128)
    sample_data = {
        "movement_speed": 5.2,
        "aim_angular_speed": 210.0,
        "shooting_cadence": 7.5,
        "accuracy": 0.42,
        "reaction_latency_ms": 190.0,
        "kills": 8,
        "deaths": 3,
        "damage": 950.0
    }
    feats = extract_behavior_features(sample_data)
    assert feats.shape == (1, 14)

    emb, logits = model(feats)
    assert emb.shape == (1, 128)
    # Check L2 normalization
    norm = torch.norm(emb, p=2, dim=-1).item()
    assert abs(norm - 1.0) < 1e-4

    emb_list = extract_player_behavior_embedding(sample_data)
    assert len(emb_list) == 128
    assert isinstance(emb_list[0], float)


def test_sequence_transformer():
    seq_model = GameplaySequenceTransformer(
        input_dim=12,
        d_model=64,
        nhead=4,
        num_layers=2,
        num_actions=9
    )
    seq_model.eval()

    # 20 historical timesteps with 12 features each
    batch_size = 2
    seq_len = 20
    dummy_input = torch.randn(batch_size, seq_len, 12)

    with torch.no_grad():
        action_logits = seq_model(dummy_input)

    assert action_logits.shape == (batch_size, 9)
    probs = torch.softmax(action_logits, dim=-1)
    # Softmax sums to 1.0
    sum_probs = probs.sum(dim=-1)
    for p in sum_probs:
        assert abs(p.item() - 1.0) < 1e-5


def test_aim_and_humanized_modifier():
    aim_net = BotAimMovementNet(input_dim=12)
    aim_net.eval()

    dummy_input = torch.randn(1, 12)
    with torch.no_grad():
        move, aim, action_probs = aim_net(dummy_input)

    assert move.shape == (1, 2)
    assert aim.shape == (1, 2)
    assert action_probs.shape == (1, 3)

    # Test Human Modifier constraint (reaction times strictly bounded >= 140ms)
    modifier = HumanAimModifier(difficulty="ELITE")
    raw_aim = np.array([2.5, -4.0])
    (pitch, yaw), fire = modifier.apply_human_aim(raw_aim, fire_prob=0.8, dt=0.05)

    assert isinstance(pitch, float)
    assert isinstance(yaw, float)

    # Test all 4 difficulty profiles
    for tier in ["EASY", "NORMAL", "HARD", "ELITE"]:
        res = HumanAimModifier.apply_human_factors(
            raw_aim_pitch=0.0,
            raw_aim_yaw=0.0,
            distance_m=20.0,
            difficulty=tier
        )
        assert res["applied_latency_ms"] >= 140  # Human esports reaction limit


def test_neural_recommender():
    recommender = NeuralRecommender()
    dummy_emb = torch.randn(1, 128)
    norm_emb = torch.nn.functional.normalize(dummy_emb, p=2, dim=-1)

    result = recommender.recommend(norm_emb)
    assert "top_weapons" in result
    assert len(result["top_weapons"]) == 5
    assert "recommended_loadout" in result
    assert "playstyle_rationale" in result
    # Confidence scores between 0 and 1
    for w in result["top_weapons"]:
        assert 0.0 <= w["confidence_score"] <= 1.0


def test_anomaly_autoencoder_non_banning():
    detector = AnomalyDetector()

    # Normal human telemetry sequence (20 ticks)
    normal_seq = [
        {
            "delta_pitch": 0.5,
            "delta_yaw": 1.2,
            "angular_velocity": 45.0,
            "angular_accel": 120.0,
            "velocity_x": 3.5,
            "velocity_z": 2.1,
            "aim_smoothness": 0.88,
            "reaction_time_ms": 230.0
        }
        for _ in range(20)
    ]
    normal_rep = detector.analyze_sequence(normal_seq)
    assert normal_rep["flagged"] is False
    assert normal_rep["review_priority"] in ["NORMAL", "LOW_MONITOR"]
    assert normal_rep["safety_guarantee"] == "AUTOMATED_BAN_PREVENTED"

    # Extreme superhuman speedhack / snap trajectory
    cheater_seq = [
        {
            "delta_pitch": 45.0,
            "delta_yaw": 90.0,
            "angular_velocity": 850.0,
            "angular_accel": 5500.0,  # Exceeds max human angular acceleration
            "velocity_x": 28.0,       # Exceeds max human movement speed
            "velocity_z": 0.0,
            "aim_smoothness": 0.10,
            "reaction_time_ms": 40.0  # Sub-human 40ms snap
        }
        for _ in range(20)
    ]
    cheater_rep = detector.analyze_sequence(cheater_seq)
    assert cheater_rep["flagged"] is True
    assert cheater_rep["review_priority"] == "CRITICAL_REVIEW"
    assert len(cheater_rep["deterministic_flags"]) >= 1
    # Crucial safety requirement: No auto bans, queues for admin review
    assert cheater_rep["recommendation"] == "QUEUE_FOR_ADMIN_REVIEW"
    assert cheater_rep["safety_guarantee"] == "AUTOMATED_BAN_PREVENTED"
