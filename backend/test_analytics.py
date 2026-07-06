import os
from pathlib import Path
from dotenv import load_dotenv

_env_path = Path("c:/Users/HP/Desktop/FYP/Delsu-Result-Advisory/backend/.env")
load_dotenv(_env_path)

import sys
sys.path.append("c:/Users/HP/Desktop/FYP/Delsu-Result-Advisory/backend")

from app.analytics import get_top_students, get_at_risk_students, get_all_carryovers

try:
    print("Top students:", get_top_students(level=400))
    print("At risk:", get_at_risk_students(level=400))
    print("Carryovers:", get_all_carryovers(level=400))
except Exception as e:
    import traceback
    traceback.print_exc()
