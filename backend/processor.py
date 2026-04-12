import numpy as np
from sklearn.svm import SVC
import random

class LULCProcessor:
    def __init__(self):
        # Step 6: Initialize SVM with RBF kernel (standard for GEE classification)
        self.classifier = SVC(kernel='rbf', C=100, gamma='auto')
        self.is_trained = False
        
        # LULC Classes (1-5) as defined in your report
        self.classes = {
            1: {"name": "Water Bodies", "color": "#3b82f6", "class_id": 1},
            2: {"name": "Vegetative Areas", "color": "#22c55e", "class_id": 2},
            3: {"name": "Urban", "color": "#ef4444", "class_id": 3},
            4: {"name": "Forests", "color": "#166534", "class_id": 4},
            5: {"name": "Barelands", "color": "#eab308", "class_id": 5}
        }

    def train_mock_model(self):
        """
        Step 3-5: Simulate training with pixel features (Bands 2-7)
        Features: [Blue, Green, Red, NIR, SWIR1, SWIR2]
        """
        # Synthetic training data based on spectral signatures
        # [Blue, Green, Red, NIR, SWIR1, SWIR2]
        training_data = [
            [0.1, 0.1, 0.05, 0.02, 0.01, 0.01], # Water (Low reflection)
            [0.05, 0.15, 0.05, 0.4, 0.2, 0.1],  # Vegetation (High NIR)
            [0.2, 0.2, 0.25, 0.2, 0.3, 0.3],    # Urban (High reflection)
            [0.03, 0.1, 0.03, 0.5, 0.15, 0.05], # Forest (Very high NIR)
            [0.15, 0.2, 0.3, 0.25, 0.5, 0.4]    # Bareland (High SWIR)
        ]
        labels = [1, 2, 3, 4, 5]
        
        # Step 6: Train the SVM
        self.classifier.fit(training_data, labels)
        self.is_trained = True

    def classify_pixel(self, lat, lng, year):
        """
        Simulates Step 6: Applying the trained model to the entire image
        """
        if not self.is_trained:
            self.train_mock_model()
            
        # Geography-based spectral simulation for Varanasi
        dist_from_ghats = np.sqrt((lat - 25.3176)**2 + (lng - 82.9739)**2)
        is_near_river = 83.00 < lng < 83.02
        
        # Urban sprawl increases over the years (Chapter 4.1)
        urban_threshold = 0.03 if year == 2000 else 0.06 if year == 2010 else 0.09
        
        if is_near_river:
            # Generate "Water" signature
            features = [0.1, 0.1, 0.05, 0.02, 0.01, 0.01]
        elif dist_from_ghats < urban_threshold:
            # Generate "Urban" signature
            features = [0.2 + random.uniform(0, 0.1), 0.2, 0.25, 0.2, 0.3, 0.3]
        elif dist_from_ghats > 0.15:
            # Generate "Forest" signature (Periphery)
            features = [0.03, 0.1, 0.03, 0.5, 0.15, 0.05]
        else:
            # Mix of Vegetation and Bareland
            if random.random() > 0.7:
                features = [0.15, 0.2, 0.3, 0.25, 0.5, 0.4] # Bareland
            else:
                features = [0.05, 0.15, 0.05, 0.4, 0.2, 0.1] # Veg
        
        # Run the SVM classifier
        class_id = self.classifier.predict([features])[0]
        return {
            "class_id": int(class_id),
            "name": self.classes[class_id]["name"],
            "color": self.classes[class_id]["color"]
        }

processor = LULCProcessor()
