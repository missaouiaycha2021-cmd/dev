from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ServerData(BaseModel):
    server_name: str
    cpu_usage: float
    ram_usage: float
    network_in: float
    network_out: float
    region: Optional[str] = None

class Prediction(BaseModel):
    server_name: str
    cpu_usage: float
    ram_usage: float
    network_in: float
    network_out: float
    prediction: str  # "normale" ou "anomalie"
    timestamp: datetime
    confidence: Optional[float] = None