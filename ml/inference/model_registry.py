import json
import joblib
from pathlib import Path
from typing import Dict, Any, Optional

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
REGISTRY_PATH = MODELS_DIR / "registry.json"

class ModelRegistryManager:
    _cached_models: Dict[str, Any] = {}

    @classmethod
    def get_registry(cls) -> Dict[str, Any]:
        """Read current registry file."""
        if not REGISTRY_PATH.exists():
            return {"pipeline_version": "1.0.0", "models": {}}
        try:
            with open(REGISTRY_PATH, "r") as f:
                return json.load(f)
        except Exception:
            return {"pipeline_version": "1.0.0", "models": {}}

    @classmethod
    def save_registry(cls, data: Dict[str, Any]):
        with open(REGISTRY_PATH, "w") as f:
            json.dump(data, f, indent=2)

    @classmethod
    def get_model(cls, model_id: str) -> Optional[Any]:
        """Load and cache model instance."""
        if model_id in cls._cached_models:
            return cls._cached_models[model_id]

        reg = cls.get_registry()
        model_meta = reg.get("models", {}).get(model_id)
        if not model_meta:
            return None

        file_name = model_meta.get("file_name")
        if not file_name:
            return None

        file_path = MODELS_DIR / file_name
        if not file_path.exists():
            return None

        try:
            loaded = joblib.load(file_path)
            cls._cached_models[model_id] = loaded
            return loaded
        except Exception as e:
            print(f"[ERROR] Failed to load model {model_id} from {file_path}: {e}")
            return None

    @classmethod
    def rollback_model(cls, model_id: str, target_version: str) -> Dict[str, Any]:
        """Roll back a model to an earlier available version."""
        reg = cls.get_registry()
        models = reg.get("models", {})
        if model_id not in models:
            return {"success": False, "error": f"Model {model_id} not found"}

        model_meta = models[model_id]
        rollback_versions = model_meta.get("rollback_versions", [])
        if target_version not in rollback_versions:
            return {"success": False, "error": f"Version {target_version} not in available rollback history"}

        prev_version = model_meta["active_version"]
        model_meta["active_version"] = target_version
        model_meta["status"] = "ROLLED_BACK"

        cls.save_registry(reg)

        # Invalidate in-memory cache
        if model_id in cls._cached_models:
            del cls._cached_models[model_id]

        return {
            "success": True,
            "model_id": model_id,
            "previous_version": prev_version,
            "current_version": target_version,
            "status": "ROLLED_BACK"
        }

    @classmethod
    def reload_all(cls):
        """Invalidate all cached model instances."""
        cls._cached_models.clear()
