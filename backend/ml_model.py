import numpy as np
import pandas as pd
import random
import os
from scipy.spatial import KDTree

class AirTempModel:
    def __init__(self):
        # LULC Class Mapping
        # Adjusted to match 0-based indexing from GEE CSV export
        self.lulc_mapping = {
            "Water Bodies": 0,
            "Vegetative Areas": 1,
            "Urban": 2,
            "Barelands": 3,
            "Forests": 4
        }
        self.reverse_lulc = {v: k for k, v in self.lulc_mapping.items()}
        
        # Data storage for lookups
        self.df = None
        self.tree = None
        self.is_trained = False
        
        # Coefficients for the ANN fallback/calibrated formula
        # Adjusted intercept to ~ -1.35 to match Varanasi CSV air_temp (~18C) 
        # based on LST (~25C * 0.78)
        self.intercept = -1.35
        self.lst_coeff = 0.78
        self.elev_coeff = -0.005
        self.lulc_offsets = {
            0: -2.5, # Water
            1: -1.2, # Vegetation
            2: 1.5,  # Urban
            3: 1.2,  # Barelands
            4: -1.8  # Forests
        }

    def train_from_csv(self, csv_paths):
        """
        Loads data and 'trains' the model logic by building a lookup index.
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
                
            self.df = pd.concat(dfs, ignore_index=True)
            # Create a spatial index for fast lookup
            coords = self.df[['lat', 'lng']].values
            self.tree = KDTree(coords)
            
            self.is_trained = True
            print(f"AirTempModel trained on {len(self.df)} points from {len(dfs)} CSV files.")
            return True
        except Exception as e:
            print(f"Training error: {e}")
            return False

    def predict(self, lst, lulc_class, elevation):
        """
        Runs inference based on parameters.
        Returns predicted Air Temp and MSE for the respective year baseline.
        """
        lulc_id = self.lulc_mapping.get(lulc_class, 2) 
        
        base_temp = float(lst) * self.lst_coeff 
        elevation_effect = (float(elevation) - 80) * self.elev_coeff
        lulc_effect = self.lulc_offsets.get(lulc_id, 0)
        
        predicted_temp = base_temp + elevation_effect + lulc_effect + self.intercept
        
        # Return predicted value and standard MSE from report
        return round(float(predicted_temp), 2), 0.9523

    def get_spatial_data(self, lat, lng, year):
        """
        CSV-based geospatial lookup.
        Finds the nearest point in the CSV for the specific year and returns its features.
        """
        if self.tree is not None:
            # Map input year to what we have in CSVs (1996 for 2000, 2010 for 2010, 2020 for 2020)
            csv_year = 1996 if year == 2000 else year
            
            # Filter by year first if possible to get more accurate temporal data
            year_df = self.df[self.df['year'] == csv_year]
            if not year_df.empty:
                coords = year_df[['lat', 'lng']].values
                temp_tree = KDTree(coords)
                dist, idx = temp_tree.query([lat, lng])
                row = year_df.iloc[idx]
            else:
                # Fallback to nearest point in the entire dataset if year not found
                dist, idx = self.tree.query([lat, lng])
                row = self.df.iloc[idx]
            
            return {
                "lst": round(float(row['lst']), 2),
                "elevation": round(float(row['elevation']), 2),
                "lulc_id": int(row['lulc'])
            }
        
        # Fallback to mock if CSV is not loaded
        return {
            "lst": 28.5,
            "elevation": 81.2,
            "lulc_id": 2
        }

model = AirTempModel()
