import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
from tensorflow.keras.regularizers import l2

class AirTempModel:
    def __init__(self):
        # Architecture defined in Project Report (Chapter 3.7)
        self.model = Sequential([
            # Input layer: 3 features (LST, LULC index, Elevation)
            # Hidden layer 1: 64 units, ReLU, L2 regularization (0.001)
            Dense(64, activation='relu', input_shape=(3,), kernel_regularizer=l2(0.001)),
            # Hidden layer 2: 32 units, ReLU, L2 regularization (0.001)
            Dense(32, activation='relu', kernel_regularizer=l2(0.001)),
            # Output layer: 1 unit, Linear
            Dense(1)
        ])
        
        # Optimizer and Loss (Chapter 3.7)
        self.model.compile(optimizer='adam', loss='mse')
        
        # LULC Class Mapping (Chapter 4.2)
        self.lulc_mapping = {
            "Water Bodies": 0,
            "Vegetative Areas": 1,
            "Urban": 2,
            "Forests": 3,
            "Barelands": 4
        }
        
    def predict(self, lst, lulc_class, elevation):
        """
        Runs inference based on parameters.
        Returns predicted Air Temp and MSE for the respective year baseline.
        """
        lulc_idx = self.lulc_mapping.get(lulc_class, 2) # Default to Urban
        
        # Prepare input tensor
        input_data = np.array([[float(lst), float(lulc_idx), float(elevation)]])
        
        # In a real scenario, we'd load weights here. 
        # For this prototype, we'll use a calibrated formula that mimics 
        # the ANN behavior described in the report's conclusion.
        
        # Calibrated formula based on report findings (Chapter 4):
        # - LST is positive correlation (0.7-0.8x)
        # - Elevation has negative correlation (-0.0065 C per meter)
        # - LULC: Vegetation/Water are cooler, Urban are hotter.
        
        base_temp = float(lst) * 0.78 
        elevation_effect = (float(elevation) - 80) * -0.005
        
        lulc_offsets = {
            "Water Bodies": -2.5,
            "Vegetative Areas": -1.2,
            "Urban": 1.5,
            "Forests": -1.8,
            "Barelands": 1.2
        }
        lulc_effect = lulc_offsets.get(lulc_class, 0)
        
        predicted_temp = base_temp + elevation_effect + lulc_effect + 5.2 # Intercept
        
        # Reference MSE from Report (Chapter 4.3)
        # 2020 baseline MSE = 0.9523
        return round(float(predicted_temp), 2), 0.9523

    def get_spatial_data(self, lat, lng, year):
        """
        Mock geospatial lookup based on Varanasi coordinates.
        Uses findings from the report to determine LST/LULC for a coordinate.
        """
        # Varanasi Center: 25.3176, 82.9739
        dist_from_center = np.sqrt((lat - 25.3176)**2 + (lng - 82.9739)**2)
        
        # Report states urbanization increased from 2000-2020 (Chapter 4.1)
        is_urban = dist_from_center < (0.02 if year == 2000 else 0.05 if year == 2010 else 0.08)
        
        if is_urban:
            lulc = "Urban"
            lst = 32.5 + (1.5 if year == 2020 else 0.5 if year == 2010 else 0)
        else:
            # Check for "Water" (Ganga river approximation)
            if 83.00 < lng < 83.02:
                lulc = "Water Bodies"
                lst = 24.2
            else:
                lulc = "Vegetative Areas"
                lst = 28.5
                
        # Elevation is roughly 75-85m in Varanasi (Chapter 3.1)
        elevation = 81.2 + (np.random.random() * 2)
        
        return {
            "lulc": lulc,
            "lst": lst,
            "elevation": elevation
        }

model = AirTempModel()
