"""
Gymnasium-compatible FPS Game Environment for Tactical RL Bot Training
Simulates 4v4 tactical arena matches with 48-dimensional observation vector
and discrete / continuous tactical combat actions.
"""

from typing import Any, Dict, List, Optional, Tuple
import numpy as np

try:
    import gymnasium as gym
    from gymnasium import spaces
except ImportError:
    # Graceful fallback for minimal environments without gymnasium installed
    class gym:
        class Env:
            pass

    class spaces:
        class Box:
            def __init__(self, low, high, shape, dtype=np.float32):
                self.low = np.full(shape, low, dtype=dtype)
                self.high = np.full(shape, high, dtype=dtype)
                self.shape = shape
                self.dtype = dtype
            def sample(self):
                return np.random.uniform(self.low, self.high).astype(self.dtype)

        class Discrete:
            def __init__(self, n):
                self.n = n
            def sample(self):
                return np.random.randint(0, self.n)

from ml.reinforcement_learning.rewards.reward_function import TacticalRewardEngine, RewardWeights


class FPSGameEnvironment(gym.Env):
    """
    Tactical 4v4 Mobile FPS Environment.
    Observation Vector (48 dims):
      [0..2]   Self Position (x, y, z) normalized [-50, 50] -> [-1, 1]
      [3..5]   Self Velocity (vx, vy, vz) normalized [-10, 10] -> [-1, 1]
      [6..7]   Self Aim Angles (pitch [-85, 85], yaw [-180, 180]) -> [-1, 1]
      [8]      Self Health [0, 100] -> [0, 1]
      [9]      Self Ammo Ratio (current / max) [0, 1]
      [10]     Is Reloading [0 or 1]
      [11]     Weapon Fire Cooldown [0, 1]
      [12]     Active Weapon Class (0: AR, 1: SMG, 2: Sniper, 3: Shotgun, 4: Pistol) -> [0, 1]
      [13..27] Nearest 3 Enemies (3 * 5 = 15 dims):
               Each enemy: [rel_x, rel_y, rel_z, distance_norm, health_norm]
      [28..42] Nearest 3 Teammates (3 * 5 = 15 dims):
               Each teammate: [rel_x, rel_y, rel_z, distance_norm, health_norm]
      [43..45] Objective Coordinates (rel_x, rel_y, rel_z) -> [-1, 1]
      [46]     Objective Capture Progress [-1 (Enemy) .. +1 (Team)]
      [47]     Match Time Remaining Ratio [0, 1]
    """
    metadata = {"render_modes": ["human", "rgb_array"], "render_fps": 30}

    ACTIONS = [
        "IDLE",
        "MOVE_FORWARD",
        "MOVE_BACKWARD",
        "STRAFE_LEFT",
        "STRAFE_RIGHT",
        "SPRINT",
        "CROUCH",
        "JUMP",
        "AIM_PITCH_UP",
        "AIM_PITCH_DOWN",
        "AIM_YAW_LEFT",
        "AIM_YAW_RIGHT",
        "FIRE",
        "RELOAD",
        "SWITCH_WEAPON",
        "TAKE_COVER",
    ]

    def __init__(self, reward_weights: Optional[RewardWeights] = None):
        super().__init__()
        self.num_actions = len(self.ACTIONS)
        self.action_space = spaces.Discrete(self.num_actions)
        self.observation_space = spaces.Box(
            low=-1.0, high=1.0, shape=(48,), dtype=np.float32
        )
        self.reward_engine = TacticalRewardEngine(reward_weights)
        self.max_steps = 600  # 30 seconds at 20 ticks/sec
        self.current_step = 0

        # State storage
        self.pos = np.zeros(3, dtype=np.float32)
        self.vel = np.zeros(3, dtype=np.float32)
        self.angles = np.zeros(2, dtype=np.float32)
        self.health = 100.0
        self.ammo = 30
        self.max_ammo = 30
        self.is_reloading = False
        self.reload_timer = 0
        self.cooldown_timer = 0
        self.weapon_class = 0

        # Objective & match state
        self.obj_pos = np.array([0.0, 0.0, 0.0], dtype=np.float32)
        self.obj_progress = 0.0
        self.enemies = []
        self.teammates = []

        self.reset()

    def reset(self, seed: Optional[int] = None, options: Optional[Dict[str, Any]] = None) -> Tuple[np.ndarray, Dict[str, Any]]:
        if seed is not None:
            np.random.seed(seed)

        self.current_step = 0
        self.pos = np.array([np.random.uniform(-25, 25), 0.0, np.random.uniform(-25, 25)], dtype=np.float32)
        self.vel = np.zeros(3, dtype=np.float32)
        self.angles = np.array([0.0, np.random.uniform(-180, 180)], dtype=np.float32)
        self.health = 100.0
        self.ammo = 30
        self.is_reloading = False
        self.reload_timer = 0
        self.cooldown_timer = 0
        self.weapon_class = np.random.randint(0, 5)

        self.obj_pos = np.array([0.0, 0.0, 0.0], dtype=np.float32)
        self.obj_progress = 0.0

        # Spawn dummy 3 enemies and 3 teammates
        self.enemies = [
            {"pos": np.array([np.random.uniform(-30, 30), 0.0, np.random.uniform(10, 35)]), "health": 100.0}
            for _ in range(3)
        ]
        self.teammates = [
            {"pos": np.array([np.random.uniform(-20, 20), 0.0, np.random.uniform(-35, -5)]), "health": 100.0}
            for _ in range(3)
        ]

        obs = self._get_obs()
        info = {"current_step": self.current_step, "health": self.health, "ammo": self.ammo}
        return obs, info

    def _get_obs(self) -> np.ndarray:
        obs = np.zeros(48, dtype=np.float32)

        # Self state
        obs[0:3] = np.clip(self.pos / 50.0, -1.0, 1.0)
        obs[3:6] = np.clip(self.vel / 10.0, -1.0, 1.0)
        obs[6] = np.clip(self.angles[0] / 85.0, -1.0, 1.0)
        obs[7] = np.clip(self.angles[1] / 180.0, -1.0, 1.0)
        obs[8] = float(self.health) / 100.0
        obs[9] = float(self.ammo) / max(1, self.max_ammo)
        obs[10] = 1.0 if self.is_reloading else 0.0
        obs[11] = float(self.cooldown_timer) / 10.0
        obs[12] = float(self.weapon_class) / 4.0

        # Enemies (nearest 3, 5 features each)
        sorted_enemies = sorted(self.enemies, key=lambda e: np.linalg.norm(e["pos"] - self.pos))
        for i, en in enumerate(sorted_enemies[:3]):
            idx = 13 + i * 5
            rel_pos = (en["pos"] - self.pos) / 50.0
            dist = np.linalg.norm(en["pos"] - self.pos) / 70.0
            obs[idx:idx+3] = np.clip(rel_pos, -1.0, 1.0)
            obs[idx+3] = np.clip(dist, 0.0, 1.0)
            obs[idx+4] = en["health"] / 100.0

        # Teammates (nearest 3, 5 features each)
        sorted_teammates = sorted(self.teammates, key=lambda t: np.linalg.norm(t["pos"] - self.pos))
        for i, tm in enumerate(sorted_teammates[:3]):
            idx = 28 + i * 5
            rel_pos = (tm["pos"] - self.pos) / 50.0
            dist = np.linalg.norm(tm["pos"] - self.pos) / 70.0
            obs[idx:idx+3] = np.clip(rel_pos, -1.0, 1.0)
            obs[idx+3] = np.clip(dist, 0.0, 1.0)
            obs[idx+4] = tm["health"] / 100.0

        # Objective
        obs[43:46] = np.clip((self.obj_pos - self.pos) / 50.0, -1.0, 1.0)
        obs[46] = np.clip(self.obj_progress, -1.0, 1.0)
        obs[47] = 1.0 - (float(self.current_step) / float(self.max_steps))

        return obs

    def step(self, action: int) -> Tuple[np.ndarray, float, bool, bool, Dict[str, Any]]:
        self.current_step += 1
        event = {
            "dt": 0.05,
            "kills": 0,
            "assists": 0,
            "died": False,
            "damage_dealt": 0.0,
            "damage_taken": 0.0,
            "objective_captured": False,
            "objective_defended": False,
            "left_contested_objective": False,
            "friendly_fire": False,
            "fired_without_los": False,
            "team_won": False,
            "team_lost": False,
            "in_combat_zone": True,
        }

        # Handle reloading timer
        if self.is_reloading:
            self.reload_timer -= 1
            if self.reload_timer <= 0:
                self.is_reloading = False
                self.ammo = self.max_ammo

        if self.cooldown_timer > 0:
            self.cooldown_timer -= 1

        action_name = self.ACTIONS[action] if 0 <= action < len(self.ACTIONS) else "IDLE"

        yaw_rad = np.radians(self.angles[1])
        fwd = np.array([np.sin(yaw_rad), 0.0, np.cos(yaw_rad)], dtype=np.float32)
        right = np.array([np.cos(yaw_rad), 0.0, -np.sin(yaw_rad)], dtype=np.float32)

        # Apply action
        if action_name == "MOVE_FORWARD":
            self.pos += fwd * 0.25
        elif action_name == "MOVE_BACKWARD":
            self.pos -= fwd * 0.18
        elif action_name == "STRAFE_LEFT":
            self.pos -= right * 0.20
        elif action_name == "STRAFE_RIGHT":
            self.pos += right * 0.20
        elif action_name == "SPRINT":
            self.pos += fwd * 0.40
        elif action_name == "AIM_YAW_LEFT":
            self.angles[1] = (self.angles[1] - 8.0) % 360 - 180
        elif action_name == "AIM_YAW_RIGHT":
            self.angles[1] = (self.angles[1] + 8.0) % 360 - 180
        elif action_name == "AIM_PITCH_UP":
            self.angles[0] = np.clip(self.angles[0] + 5.0, -85.0, 85.0)
        elif action_name == "AIM_PITCH_DOWN":
            self.angles[0] = np.clip(self.angles[0] - 5.0, -85.0, 85.0)
        elif action_name == "RELOAD":
            if not self.is_reloading and self.ammo < self.max_ammo:
                self.is_reloading = True
                self.reload_timer = 20  # 1.0 second
        elif action_name == "SWITCH_WEAPON":
            self.weapon_class = (self.weapon_class + 1) % 5
        elif action_name == "FIRE":
            if not self.is_reloading and self.ammo > 0 and self.cooldown_timer == 0:
                self.ammo -= 1
                self.cooldown_timer = 2
                # Check hitscan line-of-sight against enemies
                hit_enemy = False
                for en in self.enemies:
                    if en["health"] <= 0:
                        continue
                    to_en = en["pos"] - self.pos
                    dist = np.linalg.norm(to_en)
                    if dist > 0.1:
                        dir_to_en = to_en / dist
                        dot = np.dot(fwd, dir_to_en)
                        if dot > 0.96 and dist < 45.0:  # Aiming directly at enemy
                            dmg = np.random.uniform(22.0, 38.0)
                            en["health"] -= dmg
                            event["damage_dealt"] += dmg
                            hit_enemy = True
                            if en["health"] <= 0:
                                event["kills"] += 1
                            break
                if not hit_enemy:
                    event["fired_without_los"] = True

        # Check objective proximity
        dist_to_obj = np.linalg.norm(self.pos - self.obj_pos)
        if dist_to_obj < 6.0:
            self.obj_progress = min(1.0, self.obj_progress + 0.02)
            if self.obj_progress >= 1.0:
                event["objective_captured"] = True
                event["team_won"] = True

        # Simulate enemy return fire
        for en in self.enemies:
            if en["health"] > 0:
                dist = np.linalg.norm(en["pos"] - self.pos)
                if dist < 25.0 and np.random.random() < 0.08:
                    incoming_dmg = np.random.uniform(8.0, 18.0)
                    self.health -= incoming_dmg
                    event["damage_taken"] += incoming_dmg
                    if self.health <= 0:
                        self.health = 0.0
                        event["died"] = True
                        break

        # Compute reward
        reward = self.reward_engine.compute_step_reward(event)

        # Check termination / truncation
        terminated = event["died"] or event["team_won"] or all(e["health"] <= 0 for e in self.enemies)
        truncated = self.current_step >= self.max_steps

        obs = self._get_obs()
        info = {
            "current_step": self.current_step,
            "health": self.health,
            "ammo": self.ammo,
            "kills": event["kills"],
            "damage_dealt": event["damage_dealt"],
            "won": event["team_won"],
        }
        return obs, reward, terminated, truncated, info

    def render(self):
        pass

    def close(self):
        pass
