import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from typing import Dict, Any, List

class PlayerBehaviorNN(nn.Module):
    """
    Deep Neural Network for Player Gameplay Pattern Learning.
    Extracts high-dimensional non-linear gameplay characteristics into a 128-dim dense embedding.
    Does NOT utilize sensitive personal attributes.
    """
    def __init__(self, input_dim: int = 14, embedding_dim: int = 128, num_archetypes: int = 4):
        super().__init__()
        self.input_dim = input_dim
        self.embedding_dim = embedding_dim

        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 128),
            nn.LayerNorm(128),
            nn.ReLU(),
            nn.Dropout(0.15),
            nn.Linear(128, 128),
            nn.LayerNorm(128),
            nn.ReLU(),
            nn.Linear(128, embedding_dim)
        )

        # Auxiliary head for self-supervised playstyle classification
        self.classifier = nn.Sequential(
            nn.Linear(embedding_dim, 64),
            nn.ReLU(),
            nn.Linear(64, num_archetypes)
        )

    def forward(self, x: torch.Tensor):
        # Compute 128-dim normalized embedding
        raw_emb = self.encoder(x)
        embedding = F.normalize(raw_emb, p=2, dim=-1)
        logits = self.classifier(embedding)
        return embedding, logits

    def get_embedding(self, x: torch.Tensor) -> torch.Tensor:
        raw_emb = self.encoder(x)
        return F.normalize(raw_emb, p=2, dim=-1)

_cached_model = None

def get_behavior_model() -> PlayerBehaviorNN:
    global _cached_model
    if _cached_model is None:
        _cached_model = PlayerBehaviorNN()
        _cached_model.eval()
    return _cached_model

def extract_behavior_features(record: Dict[str, Any]) -> torch.Tensor:
    """Extract and normalize the 14 gameplay pattern metrics into a PyTorch tensor."""
    kd = record.get("kills", 5) / max(1, record.get("deaths", 5))
    feats = [
        float(record.get("movement_speed", 4.5)) / 8.0,
        float(record.get("aim_angular_speed", 180.0)) / 360.0,
        float(record.get("shooting_cadence", 6.0)) / 15.0,
        float(record.get("accuracy", 0.35)),
        float(record.get("reaction_latency_ms", 250.0)) / 500.0,
        float(record.get("weapon_selection_ratio", 0.5)),
        float(record.get("weapon_switch_rate", 3.0)) / 10.0,
        float(record.get("avg_engagement_distance", 22.0)) / 80.0,
        float(record.get("damage", 600)) / 2000.0,
        float(record.get("kills", 5)) / 25.0,
        float(record.get("deaths", 5)) / 25.0,
        float(record.get("objective_activity_score", 45.0)) / 100.0,
        float(record.get("match_duration_avg", 300.0)) / 600.0,
        float(record.get("recent_win_streak", 1)) / 10.0
    ]
    return torch.tensor([feats], dtype=torch.float32)

def extract_player_behavior_embedding(record: Dict[str, Any]) -> List[float]:
    """Helper to convert telemetry dict into a 128-dim embedding list."""
    model = get_behavior_model()
    feats = extract_behavior_features(record)
    with torch.no_grad():
        emb = model.get_embedding(feats)
    return emb.squeeze(0).tolist()

