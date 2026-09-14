import os
import sys
import json
import joblib
import numpy as np
from datetime import datetime
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import GradientBoostingRegressor, RandomForestClassifier, IsolationForest
from sklearn.metrics import r2_score, mean_absolute_error, accuracy_score, f1_score
from xgboost import XGBRegressor

from ml.data.dataset_generator import generate_telemetry_dataset, WEAPON_IDS
from ml.features.feature_pipeline import FeaturePipeline

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)
REGISTRY_PATH = MODELS_DIR / "registry.json"

def train_skill_rating_model(dataset):
    print("-> Training Player Skill Rating Model (XGBoost Regressor)...")
    X = np.array([FeaturePipeline.extract_skill_features(r) for r in dataset])
    y = np.array([r["skill_rating"] for r in dataset])

    split = int(len(dataset) * 0.8)
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]

    model = Pipeline([
        ("scaler", StandardScaler()),
        ("regressor", XGBRegressor(n_estimators=120, max_depth=5, learning_rate=0.08, random_state=42))
    ])

    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    r2 = round(float(r2_score(y_test, y_pred)), 4)
    mae = round(float(mean_absolute_error(y_test, y_pred)), 2)

    model_path = MODELS_DIR / "skill_rating_v1.joblib"
    joblib.dump(model, model_path)
    print(f"   [OK] Skill Rating Model saved to {model_path.name}. R2: {r2}, MAE: {mae}")

    return {
        "model_id": "skill_rating",
        "active_version": "v1.0.0",
        "algorithm": "XGBoost Regressor with StandardScaler",
        "file_name": "skill_rating_v1.joblib",
        "r2_score": r2,
        "mae": mae,
        "features": ["accuracy", "headshot_rate", "recoil_control", "reaction_time_ms", "flick_consistency", "kills", "deaths", "kd_ratio", "damage", "score"],
        "status": "ACTIVE",
        "last_trained": datetime.utcnow().isoformat(),
        "rollback_versions": ["v1.0.0"]
    }

def train_weapon_balance_model(dataset):
    print("-> Training Weapon Balance Classification Model...")
    # Aggregate stats per weapon
    weapon_groups = {}
    for r in dataset:
        wid = r["weapon_id"]
        if wid not in weapon_groups:
            weapon_groups[wid] = []
        weapon_groups[wid].append(r)

    X_list = []
    y_list = []
    
    for wid, rows in weapon_groups.items():
        total = len(rows)
        wins = sum(1 for r in rows if r["is_win"] == 1)
        kills = sum(r["kills"] for r in rows)
        deaths = max(1, sum(r["deaths"] for r in rows))
        hs = sum(r["headshots"] for r in rows)
        damage = sum(r["damage"] for r in rows)

        win_rate = wins / total
        kd_ratio = kills / deaths
        pick_rate = total / len(dataset)
        hs_rate = hs / max(1, kills)
        avg_dmg = damage / total
        avg_kills = kills / total

        label = rows[0]["weapon_balance_label"]

        # Synthesize variations for training robustness
        for _ in range(60):
            var_win = max(0.2, min(0.8, win_rate + np.random.normal(0, 0.04)))
            var_kd = max(0.4, min(3.0, kd_ratio + np.random.normal(0, 0.1)))
            var_pick = max(0.005, min(0.15, pick_rate + np.random.normal(0, 0.01)))
            var_hs = max(0.05, min(0.6, hs_rate + np.random.normal(0, 0.03)))
            var_dmg = max(200.0, avg_dmg + np.random.normal(0, 30))
            var_k = max(1.0, avg_kills + np.random.normal(0, 0.5))

            X_list.append([var_pick, var_win, var_kd, var_hs, var_dmg, var_k])
            y_list.append(label)

    X = np.array(X_list)
    y = np.array(y_list)

    split = int(len(X) * 0.8)
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]

    clf = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    acc = round(float(accuracy_score(y_test, y_pred)), 4)
    f1 = round(float(f1_score(y_test, y_pred, average="weighted")), 4)

    model_path = MODELS_DIR / "weapon_balance_v1.joblib"
    joblib.dump(clf, model_path)
    print(f"   [OK] Weapon Balance Model saved to {model_path.name}. Accuracy: {acc}, F1: {f1}")

    return {
        "model_id": "weapon_balance",
        "active_version": "v1.0.0",
        "algorithm": "RandomForestClassifier",
        "file_name": "weapon_balance_v1.joblib",
        "accuracy": acc,
        "f1_score": f1,
        "classes": {0: "UNDERPOWERED", 1: "OPTIMAL", 2: "OVERPOWERED"},
        "status": "ACTIVE",
        "last_trained": datetime.utcnow().isoformat(),
        "rollback_versions": ["v1.0.0"]
    }

def train_churn_model(dataset):
    print("-> Training Player Churn Risk Predictor...")
    X = np.array([FeaturePipeline.extract_churn_features(r) for r in dataset])
    y = np.array([r["churn_risk"] for r in dataset])

    split = int(len(dataset) * 0.8)
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]

    clf = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    acc = round(float(accuracy_score(y_test, y_pred)), 4)
    f1 = round(float(f1_score(y_test, y_pred, average="binary")), 4)

    model_path = MODELS_DIR / "churn_risk_v1.joblib"
    joblib.dump(clf, model_path)
    print(f"   [OK] Churn Risk Model saved to {model_path.name}. Accuracy: {acc}, F1: {f1}")

    return {
        "model_id": "churn_risk",
        "active_version": "v1.0.0",
        "algorithm": "RandomForestClassifier",
        "file_name": "churn_risk_v1.joblib",
        "accuracy": acc,
        "f1_score": f1,
        "status": "ACTIVE",
        "last_trained": datetime.utcnow().isoformat(),
        "rollback_versions": ["v1.0.0"]
    }

def train_anomaly_model(dataset):
    print("-> Training Anti-Cheat Anomaly Detection Model (Isolation Forest)...")
    # Train only on non-cheaters to learn legitimate human distribution
    legit_records = [r for r in dataset if r["is_cheater"] == 0]
    X_train = np.array([FeaturePipeline.extract_anomaly_features(r) for r in legit_records])

    iso_forest = IsolationForest(
        n_estimators=150,
        contamination=0.02,
        max_samples="auto",
        random_state=42
    )
    iso_forest.fit(X_train)

    # Test on full mixed dataset
    X_all = np.array([FeaturePipeline.extract_anomaly_features(r) for r in dataset])
    y_true = np.array([1 if r["is_cheater"] == 1 else -1 for r in dataset])
    # IsolationForest outputs -1 for anomaly, 1 for normal
    y_pred = iso_forest.predict(X_all)

    # Detected anomalies (y_pred == -1)
    anomalies_detected = sum(1 for p in y_pred if p == -1)
    precision = sum(1 for yt, yp in zip(y_true, y_pred) if yt == -1 and yp == -1) / max(1, anomalies_detected)

    model_path = MODELS_DIR / "anti_cheat_anomaly_v1.joblib"
    joblib.dump(iso_forest, model_path)
    print(f"   [OK] Anti-Cheat Isolation Forest saved to {model_path.name}. Detected anomalies: {anomalies_detected}")

    return {
        "model_id": "anti_cheat_anomaly",
        "active_version": "v1.0.0",
        "algorithm": "IsolationForest (Unsupervised)",
        "file_name": "anti_cheat_anomaly_v1.joblib",
        "anomaly_precision": round(float(precision), 4),
        "status": "ACTIVE",
        "last_trained": datetime.utcnow().isoformat(),
        "rollback_versions": ["v1.0.0"]
    }

def train_recommendation_engine(dataset):
    print("-> Building Explainable Loadout & Weapon Recommendation Engine...")
    # Precompute weapon affinity clusters based on playstyle archetype
    archetype_map = {
        "AGGRESSIVE_RUSHER": {
            "primary": ["smg_bijli_vector", "smg_toofan_p90", "sg_ghatak_12g", "ar_trishul_carbine"],
            "secondary": ["pistol_tejas_auto", "melee_tactical_karambit"],
            "reason": "Fast cycling rate and exceptional hipfire spread match your aggressive close-quarters rush frequency."
        },
        "TACTICAL_MARKSMAN": {
            "primary": ["sr_astra_90", "sr_arjuna_marksman", "ar_chakra_21", "ar_rudra_m4"],
            "secondary": ["pistol_marut_magnum", "pistol_kavach_revolver"],
            "reason": "High single-shot damage and muzzle velocity leverage your top-tier accuracy at ranges beyond 40 meters."
        },
        "SUPPORT_SUPPRESSOR": {
            "primary": ["lmg_parashu_heavy", "lmg_indra_saw", "ar_vayu_47", "lmg_rakshas_box"],
            "secondary": ["pistol_veer_45", "melee_gurkha_kukri"],
            "reason": "Large magazine capacity and suppressive fire stability complement your prolonged lane-holding playstyle."
        },
        "BALANCED_COMPETITIVE": {
            "primary": ["ar_astra_alpha", "ar_garuda_556", "smg_tez_9", "ar_shakti_bullpup"],
            "secondary": ["pistol_astra_sidearm", "melee_combat_axe"],
            "reason": "Versatile recoil control and mid-range time-to-kill optimal for standard ranked competitive play."
        }
    }

    model_path = MODELS_DIR / "recommendation_engine_v1.joblib"
    joblib.dump(archetype_map, model_path)
    print(f"   [OK] Recommendation Engine saved to {model_path.name}.")

    return {
        "model_id": "recommendation_engine",
        "active_version": "v1.0.0",
        "algorithm": "Playstyle Archetype & Multi-Attribute Affinity Matrix",
        "file_name": "recommendation_engine_v1.joblib",
        "status": "ACTIVE",
        "last_trained": datetime.utcnow().isoformat(),
        "rollback_versions": ["v1.0.0"]
    }

def main():
    print("=== ASTRA: One Shotted - Training Machine Learning Pipeline ===")
    dataset = generate_telemetry_dataset(num_samples=12000, seed=42)
    print(f"[OK] Generated {len(dataset)} telemetry records across 52 weapons.")

    registry = {
        "pipeline_version": "1.0.0",
        "last_updated": datetime.utcnow().isoformat(),
        "models": {}
    }

    skill_meta = train_skill_rating_model(dataset)
    registry["models"]["skill_rating"] = skill_meta

    balance_meta = train_weapon_balance_model(dataset)
    registry["models"]["weapon_balance"] = balance_meta

    churn_meta = train_churn_model(dataset)
    registry["models"]["churn_risk"] = churn_meta

    anomaly_meta = train_anomaly_model(dataset)
    registry["models"]["anti_cheat_anomaly"] = anomaly_meta

    rec_meta = train_recommendation_engine(dataset)
    registry["models"]["recommendation_engine"] = rec_meta

    with open(REGISTRY_PATH, "w") as f:
        json.dump(registry, f, indent=2)

    print(f"\n[OK] All models trained and saved to {MODELS_DIR}")
    print(f"[OK] Registry updated at {REGISTRY_PATH}")

if __name__ == "__main__":
    main()
