
import sys
import os
sys.path.append(os.path.abspath('backend'))
from app.db import supabase
res = supabase.table('courses').select('*').limit(1).execute()
print(res)

res2 = supabase.rpc('get_schema').execute()
print(res2)

