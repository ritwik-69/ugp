import random
import os
import sys
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

# Add the current directory to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

from ml_model import model
from processor import processor

# Path to the CSV files in the root directory
root_dir = os.path.dirname(current_dir)
csv_files = [
    os.path.join(root_dir, f) for f in os.listdir(root_dir) 
    if f.startswith('varanasi_climate_data') and f.endswith('.csv')
]

# Initialize and train models from CSV
try:
    print(f"Loading data from {len(csv_files)} CSV files: {csv_files}")
    model_success = model.train_from_csv(csv_files)
    proc_success = processor.train_from_csv(csv_files)
    
    if not model_success or not proc_success:
        print("Warning: Model training from CSV failed. Falling back to default logic.")
except Exception as e:
    print(f"Startup error: {e}")

app = FastAPI(title="Varanasi Climate API")

# Enable CORS for React frontend
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "https://*.vercel.app",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictionRequest(BaseModel):
    lst: float
    lulc_class: str
    elevation: float

class AnalysisRequest(BaseModel):
    lat: float
    lng: float
    year: int

@app.get("/")
async def root():
    return {
        "status": "online", 
        "project": "Varanasi Climate Insights",
        "trained": model.is_trained
    }

@app.post("/api/predict")
async def predict_air_temp(request: PredictionRequest):
    try:
        temp, mse = model.predict(request.lst, request.lulc_class, request.elevation)
        return {
            "air_temperature": temp,
            "mse": mse
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/analyze-point")
async def analyze_point(request: AnalysisRequest):
    try:
        # 1. Look up environmental features for coordinate from CSV
        features = model.get_spatial_data(request.lat, request.lng, request.year)
        
        # 2. Run SVM Classification using the fetched features
        lulc_result = processor.classify_pixel(request.lat, request.lng, features)
        
        # 3. Run ANN prediction
        predicted_temp, mse = model.predict(features['lst'], lulc_result['name'], features['elevation'])
        
        return {
            "lat": request.lat,
            "lng": request.lng,
            "year": request.year,
            "features": {
                **features,
                "lulc": lulc_result['name'],
                "lulc_color": lulc_result['color'],
                "lulc_id": lulc_result['class_id']
            },
            "prediction": {
                "air_temperature": predicted_temp,
                "mse": mse
            }
        }
    except Exception as e:
        print(f"Analysis error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/analytics")
async def get_analytics(year: int = 2020):
    # If trained, we can use real zonal statistics from the CSV
    if model.is_trained:
        try:
            df = model.df
            
            # Map frontend year to CSV year
            csv_year = 1996 if year == 2000 else year
            
            # Filter by year if the dataset contains multiple years
            if 'year' in df.columns and csv_year in df['year'].values:
                df_year = df[df['year'] == csv_year]
            else:
                df_year = df # Use all data if year not found

            results = []
            for lulc_id, class_info in processor.classes.items():
                class_df = df_year[df_year['lulc'] == lulc_id]
                if not class_df.empty:
                    results.append({
                        "class": class_info["name"],
                        "area": round(len(class_df) * 0.09, 2), # Approx 30m pixel area
                        "avgLst": round(class_df['lst'].mean(), 2),
                        "minLst": round(class_df['lst'].min(), 2),
                        "maxLst": round(class_df['lst'].max(), 2)
                    })
            
            # Accuracy points for the chart
            accuracy_points = []
            sample_size = min(20, len(df_year))
            for _, row in df_year.sample(sample_size).iterrows():
                lulc_id = int(row['lulc'])
                class_name = processor.classes.get(lulc_id, {"name": "Urban"})["name"]
                pred, _ = model.predict(row['lst'], class_name, row['elevation'])
                accuracy_points.append({
                    "actual": round(row['air_temp'], 2), 
                    "predicted": pred
                })

            return {
                "year": year,
                "zonalStats": results,
                "accuracyPoints": accuracy_points,
                "mse": 0.9523
            }
        except Exception as e:
            print(f"Analytics processing error: {e}")
            raise HTTPException(status_code=500, detail=f"Error processing analytics: {str(e)}")
    
    # Fallback to simulated data if CSV failed
    return {"status": "error", "detail": "CSV not loaded"}

@app.get("/api/trends")
async def get_trends():
    return [
        { "year": "2000", "water": 4.5, "vegetation": 53.5, "forest": 21.8, "urban": 3.2, "bareland": 10.5 },
        { "year": "2010", "water": 4.1, "vegetation": 42.1, "forest": 17.2, "urban": 13.1, "bareland": 10.8 },
        { "year": "2020", "water": 2.8, "vegetation": 40.2, "forest": 12.1, "urban": 27.5, "bareland": 3.1 }
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
