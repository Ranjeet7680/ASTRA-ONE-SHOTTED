import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from typing import Dict, Any, List

TACTICAL_ACTIONS = [
    "MOVE",
    "AIM",
    "SHOOT",
    "RELOAD",
    "SWITCH_WEAPON",
    "CAPTURE",
    "DEFEND",
    "RETREAT",
    "TAKE_COVER"
]

class PositionalEncoding(nn.Module):
    def __init__(self, d_model: int = 64, max_len: int = 50):
        super().__init__()
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-np.log(10000.0) / d_model))
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        self.register_buffer('pe', pe.unsqueeze(0))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return x + self.pe[:, :x.size(1)]

class GameplaySequenceTransformer(nn.Module):
    """
    Sequence-based Transformer model for gameplay simulation and AI bot action forecasting.
    Consumes temporal sliding window of states (t-20 to t) and predicts next-action distribution.
    """
    def __init__(
        self,
        input_dim: int = 12,
        d_model: int = 64,
        nhead: int = 4,
        num_layers: int = 2,
        dim_feedforward: int = 128,
        num_actions: int = 9,
        dropout: float = 0.1
    ):
        super().__init__()
        self.input_projection = nn.Linear(input_dim, d_model)
        self.pos_encoder = PositionalEncoding(d_model=d_model, max_len=50)

        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=dim_feedforward,
            dropout=dropout,
            batch_first=True
        )
        self.transformer_encoder = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)

        self.action_head = nn.Sequential(
            nn.Linear(d_model, 64),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(64, num_actions)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Input shape: (batch_size, seq_len=20, input_dim=12)
        Output shape: (batch_size, num_actions=9)
        """
        projected = self.input_projection(x)
        encoded = self.pos_encoder(projected)
        transformer_out = self.transformer_encoder(encoded)
        # Use representation of the latest timestep (t)
        last_step = transformer_out[:, -1, :]
        logits = self.action_head(last_step)
        return logits

    def predict_action(self, sequence: torch.Tensor) -> Dict[str, Any]:
        """Predict next tactical action from historical 20-step sequence."""
        self.eval()
        with torch.no_grad():
            if sequence.ndim == 2:
                sequence = sequence.unsqueeze(0) # add batch dim
            logits = self.forward(sequence)
            probs = F.softmax(logits, dim=-1)[0].cpu().numpy()

            action_idx = int(np.argmax(probs))
            confidence = float(probs[action_idx])

            dist = {act: float(p) for act, p in zip(TACTICAL_ACTIONS, probs)}

            return {
                "next_action": TACTICAL_ACTIONS[action_idx],
                "action_index": action_idx,
                "confidence": round(confidence, 3),
                "action_distribution": dist
            }

_cached_seq_model = None

def get_sequence_model() -> GameplaySequenceTransformer:
    global _cached_seq_model
    if _cached_seq_model is None:
        _cached_seq_model = GameplaySequenceTransformer()
        _cached_seq_model.eval()
    return _cached_seq_model

def create_synthetic_sequence(seq_len: int = 20) -> torch.Tensor:
    """Generate a realistic synthetic 20-step sequence for tests or zero-history fallback."""
    steps = []
    for i in range(seq_len):
        steps.append([
            float(np.sin(i * 0.2) * 5.0), # pos_x
            0.0,                          # pos_y
            float(np.cos(i * 0.2) * 5.0), # pos_z
            1.2,                          # velocity_x
            0.8,                          # velocity_z
            0.05,                         # aim_pitch
            float(i * 0.1),               # aim_yaw
            0.0,                          # weapon category AR
            float(15.0 - i * 0.3),        # enemy distance
            1.0 if i > 15 else 0.0,       # shots fired
            0.0,                          # damage received
            100.0                         # health
        ])
    return torch.tensor(steps, dtype=torch.float32)
