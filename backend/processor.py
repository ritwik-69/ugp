import numpy as np
import pandas as pd
from sklearn.svm import SVC
import os

class LULCProcessor:
    def __init__(self):
        # SVM as described in Chapter 3.6 of the report
        self.classifier = SVC(kernel='rbf', C=100, gamma='auto')
        self.is_trained = False
        
        # Consistent mapping with frontend and API contract
        # Adjusted to match 0-based indexing from GEE CSV export
        self.classes = {
            0: {"name": "Water Bodies", "color": "#3b82f6", "class_id": 0},
            1: {"name": "Vegetative Areas", "color": "#22c55e", "class_id": 1},
            2: {"name": "Urban", "color": "#ef4444", "class_id": 2},
            3: {"name": "Barelands", "color": "#eab308", "class_id": 3},
            4: {"name": "Forests", "color": "#166534", "class_id": 4}
        }

    def train_from_csv(self, csv_paths):
        """
        Loads data and trains the SVM classifier.
        Supports a single CSV path or a list of paths.
        """
        try:
            if isinstance(csv_paths, str):
                csv_paths = [csv_paths]
                
            dfs = []
            for path in csv_paths:
                if os.path.exists(path):
                    dfs.append(pd.read_csv(path))
                else:
                    print(f"Warning: CSV not found at {path}")
            
            if not dfs:
                print("No valid CSV files found.")
                return False
                
            df = pd.concat(dfs, ignore_index=True)
            
            # Features: [LST, Elevation, Lat, Lng]
            X = df[['lst', 'elevation', 'lat', 'lng']].values
            y = df['lulc'].values
            
            self.classifier.fit(X, y)
            self.is_trained = True
            print(f"LULCProcessor trained on {len(df)} points from {len(dfs)} CSV files.")
            return True
        except Exception as e:
            print(f"Training error: {e}")
            return False

    def classify_pixel(self, lat, lng, features=None):
        """
        Classifies a pixel using the trained SVM model.
        """
        if not self.is_trained:
            # Fallback mock if not trained
            return self.classes[2] # Urban
            
        try:
            if features is None:
                return self.classes[2]
            
            input_features = np.array([[features['lst'], features['elevation'], lat, lng]])
            class_id = self.classifier.predict(input_features)[0]
            
            return self.classes.get(int(class_id), self.classes[2])
        except Exception as e:
            print(f"Classification error: {e}")
            return self.classes[2]

processor = LULCProcessor()
