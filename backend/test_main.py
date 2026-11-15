import sys
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).parent))
from main import app


class ClimateApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_health(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["is_data_linked"])

    def test_layer_and_hotspot_data(self):
        layer_response = self.client.get("/api/layer-points?year=2020&limit=100")
        hotspot_response = self.client.get("/api/hotspots?year=2020&limit=3")
        self.assertEqual(layer_response.status_code, 200)
        self.assertEqual(len(layer_response.json()["points"]), 100)
        self.assertEqual(len(hotspot_response.json()["hotspots"]), 3)

    def test_analytics_and_evaluation(self):
        analytics = self.client.get("/api/analytics?year=2020")
        evaluation = self.client.get("/api/model-evaluation")
        self.assertEqual(analytics.status_code, 200)
        self.assertIn("summary", analytics.json())
        self.assertEqual(evaluation.status_code, 200)
        self.assertIn("rmse", evaluation.json())

    def test_prediction_validation_shape(self):
        response = self.client.post("/api/predict", json={
            "lst": 30,
            "lulc_class": "Urban",
            "elevation": 80,
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn("risk_level", response.json())


if __name__ == "__main__":
    unittest.main()
