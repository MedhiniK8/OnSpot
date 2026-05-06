"""Computer-vision heuristics and YOLO-based detection for OnSpot."""

from __future__ import annotations

import logging
from pathlib import Path

import cv2
from ultralytics import YOLO


logger = logging.getLogger(__name__)

_YOLO_MODEL: YOLO | None = None


def get_yolo_model() -> YOLO:
    """Load the YOLOv8n model lazily so startup stays fast."""

    global _YOLO_MODEL
    if _YOLO_MODEL is None:
        _YOLO_MODEL = YOLO("yolov8n.pt")
    return _YOLO_MODEL


def _heuristic_probability(vehicle_count: int, person_count: int, truck_count: int) -> float:
    score = 0.25
    score += min(vehicle_count * 0.12, 0.45)
    score += min(person_count * 0.1, 0.2)
    score += min(truck_count * 0.08, 0.15)
    return round(min(score, 0.99), 3)


def detect_accident_objects(image_path: str) -> dict:
    """Run YOLO and derive a simple accident likelihood from the frame."""

    try:
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError("Unable to read image")

        model = get_yolo_model()
        results = model.predict(source=image, verbose=False)
        boxes = results[0].boxes if results else []

        objects: list[str] = []
        raw_boxes: list[dict] = []
        vehicle_count = 0
        person_count = 0
        truck_count = 0

        for box in boxes:
            class_index = int(box.cls[0]) if box.cls is not None else -1
            label = model.names.get(class_index, "unknown")
            confidence = float(box.conf[0]) if box.conf is not None else 0.0
            coords = [float(value) for value in box.xyxy[0].tolist()]

            if label in {"car", "truck", "bus", "motorcycle", "person"}:
                objects.append(label)
                raw_boxes.append({"label": label, "confidence": confidence, "box": coords})
            if label in {"car", "bus", "motorcycle"}:
                vehicle_count += 1
            if label == "person":
                person_count += 1
            if label == "truck":
                truck_count += 1

        probability = _heuristic_probability(vehicle_count, person_count, truck_count)
        detected = probability >= 0.45 or vehicle_count >= 2 or (vehicle_count >= 1 and person_count >= 1)
        note = "YOLO completed successfully"
        if not detected and raw_boxes:
            note = "Low-confidence detection"

        return {
            "detected": detected,
            "confidence": probability,
            "objects": objects,
            "raw_boxes": raw_boxes,
            "note": note,
        }
    except Exception as exc:
        logger.exception("YOLO detection failed: %s", exc)
        return {
            "detected": True,
            "confidence": 0.8,
            "objects": [],
            "raw_boxes": [],
            "note": "CNN unavailable",
        }
