"""
Tactical Navigation Mesh & Waypoint Graph with Dynamic Cover Evaluation & Threat-Weighted A*
Provides deterministic geometric pathing and cover-seeking for tactical FPS bots.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Tuple, Optional
import heapq
import numpy as np


@dataclass
class CoverNode:
    id: str
    position: Tuple[float, float, float]  # (x, y, z)
    cover_type: str  # "LOW", "HIGH", "CORNER"
    normal: Tuple[float, float, float]    # Direction cover protects against


@dataclass
class Waypoint:
    id: str
    position: Tuple[float, float, float]
    connected_ids: List[str] = field(default_factory=list)
    is_cover: bool = False
    cover_info: Optional[CoverNode] = None


class TacticalNavMesh:
    """
    Tactical graph representation of the game map (Courtyard Blitz).
    Calculates threat-weighted A* paths and identifies optimal cover positions.
    """
    def __init__(self):
        self.waypoints: Dict[str, Waypoint] = {}
        self.cover_nodes: List[CoverNode] = []
        self.threat_zones: Dict[str, float] = {}  # node_id -> threat_cost
        self._initialize_default_courtyard_map()

    def _initialize_default_courtyard_map(self):
        """Builds default tactical nodes for the Courtyard Blitz arena map."""
        # Grid of tactical waypoints
        coords = [
            ("spawn_a", (-25.0, 0.0, -25.0)),
            ("lane_left_a", (-18.0, 0.0, -12.0)),
            ("lane_right_a", (18.0, 0.0, -12.0)),
            ("mid_cover_left", (-8.0, 0.0, 0.0)),
            ("mid_objective", (0.0, 0.0, 0.0)),
            ("mid_cover_right", (8.0, 0.0, 0.0)),
            ("lane_left_b", (-18.0, 0.0, 12.0)),
            ("lane_right_b", (18.0, 0.0, 12.0)),
            ("spawn_b", (25.0, 0.0, 25.0)),
            ("tower_snip_a", (-22.0, 3.5, -20.0)),
            ("tower_snip_b", (22.0, 3.5, 20.0)),
        ]

        for nid, pos in coords:
            self.waypoints[nid] = Waypoint(id=nid, position=pos)

        # Tactical Connections
        connections = [
            ("spawn_a", ["lane_left_a", "lane_right_a", "tower_snip_a"]),
            ("lane_left_a", ["spawn_a", "mid_cover_left", "lane_left_b"]),
            ("lane_right_a", ["spawn_a", "mid_cover_right", "lane_right_b"]),
            ("mid_cover_left", ["lane_left_a", "mid_objective", "lane_left_b"]),
            ("mid_objective", ["mid_cover_left", "mid_cover_right", "lane_left_a", "lane_right_b"]),
            ("mid_cover_right", ["lane_right_a", "mid_objective", "lane_right_b"]),
            ("lane_left_b", ["lane_left_a", "mid_cover_left", "spawn_b"]),
            ("lane_right_b", ["lane_right_a", "mid_cover_right", "spawn_b"]),
            ("spawn_b", ["lane_left_b", "lane_right_b", "tower_snip_b"]),
            ("tower_snip_a", ["spawn_a", "mid_cover_left"]),
            ("tower_snip_b", ["spawn_b", "mid_cover_right"]),
        ]

        for src, targets in connections:
            if src in self.waypoints:
                for tgt in targets:
                    if tgt in self.waypoints and tgt not in self.waypoints[src].connected_ids:
                        self.waypoints[src].connected_ids.append(tgt)

        # Register Cover Nodes
        covers = [
            CoverNode("c_mid_left", (-8.0, 0.0, 0.0), "HIGH", (1.0, 0.0, 0.0)),
            CoverNode("c_mid_right", (8.0, 0.0, 0.0), "HIGH", (-1.0, 0.0, 0.0)),
            CoverNode("c_lane_l_box", (-18.0, 0.0, -2.0), "LOW", (0.0, 0.0, 1.0)),
            CoverNode("c_lane_r_box", (18.0, 0.0, 2.0), "LOW", (0.0, 0.0, -1.0)),
        ]
        self.cover_nodes = covers
        for c in covers:
            if c.id in self.waypoints:
                self.waypoints[c.id].is_cover = True
                self.waypoints[c.id].cover_info = c

    def find_nearest_waypoint(self, position: Tuple[float, float, float]) -> str:
        pos_arr = np.array(position)
        best_id = "mid_objective"
        best_dist = float("inf")
        for nid, wp in self.waypoints.items():
            dist = np.linalg.norm(np.array(wp.position) - pos_arr)
            if dist < best_dist:
                best_dist = dist
                best_id = nid
        return best_id

    def set_threat_zone(self, node_id: str, threat_penalty: float):
        """Applies dynamic danger penalty (e.g. active sniper sightline)."""
        self.threat_zones[node_id] = threat_penalty

    def clear_threats(self):
        self.threat_zones.clear()

    def find_tactical_path(self, start_pos: Tuple[float, float, float], target_pos: Tuple[float, float, float]) -> List[Tuple[float, float, float]]:
        """
        A* search with threat cost heuristics.
        Returns ordered list of 3D waypoint coordinates.
        """
        start_id = self.find_nearest_waypoint(start_pos)
        target_id = self.find_nearest_waypoint(target_pos)

        if start_id == target_id:
            return [target_pos]

        frontier = []
        heapq.heappush(frontier, (0.0, start_id))
        came_from: Dict[str, Optional[str]] = {start_id: None}
        cost_so_far: Dict[str, float] = {start_id: 0.0}

        target_coords = np.array(self.waypoints[target_id].position)

        while frontier:
            _, current = heapq.heappop(frontier)

            if current == target_id:
                break

            curr_node = self.waypoints[current]
            for neighbor_id in curr_node.connected_ids:
                neighbor_node = self.waypoints[neighbor_id]
                base_dist = np.linalg.norm(np.array(curr_node.position) - np.array(neighbor_node.position))
                threat_cost = self.threat_zones.get(neighbor_id, 0.0)
                new_cost = cost_so_far[current] + base_dist + threat_cost

                if neighbor_id not in cost_so_far or new_cost < cost_so_far[neighbor_id]:
                    cost_so_far[neighbor_id] = new_cost
                    heuristic = np.linalg.norm(np.array(neighbor_node.position) - target_coords)
                    priority = new_cost + heuristic
                    heapq.heappush(frontier, (priority, neighbor_id))
                    came_from[neighbor_id] = current

        # Reconstruct path
        path_ids = []
        curr = target_id
        while curr:
            path_ids.append(curr)
            curr = came_from.get(curr)
        path_ids.reverse()

        coords = [self.waypoints[nid].position for nid in path_ids]
        coords.append(target_pos)
        return coords

    def find_best_cover(
        self,
        bot_pos: Tuple[float, float, float],
        enemy_pos: Tuple[float, float, float]
    ) -> Optional[CoverNode]:
        """
        Finds the nearest cover node whose normal shields the bot from the enemy.
        """
        b_pos = np.array(bot_pos)
        e_pos = np.array(enemy_pos)
        dir_to_enemy = e_pos - b_pos
        dist_to_enemy = np.linalg.norm(dir_to_enemy)
        if dist_to_enemy > 0:
            dir_to_enemy /= dist_to_enemy

        best_cover = None
        best_score = -float("inf")

        for c in self.cover_nodes:
            c_pos = np.array(c.position)
            dist_to_cover = np.linalg.norm(c_pos - b_pos)
            # Cover normal facing enemy provides shelter
            c_normal = np.array(c.normal)
            alignment = np.dot(c_normal, dir_to_enemy)

            # Score prefers closer cover with strong alignment opposite to enemy line of fire
            score = (alignment * 10.0) - (dist_to_cover * 0.5)
            if score > best_score:
                best_score = score
                best_cover = c

        return best_cover
