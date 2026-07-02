
import sys
import os
sys.path.append(os.path.abspath('backend'))
from app.db import supabase

try:
    c_res = supabase.table('courses').insert({'course_code': 'TEST1', 'course_type': 'core', 'units': 3}).execute()
    print('core works')
except Exception as e:
    print('core failed:', e)

try:
    c_res = supabase.table('courses').insert({'course_code': 'TEST2', 'course_type': 'Core', 'units': 3}).execute()
    print('Core works')
except Exception as e:
    print('Core failed:', e)

try:
    supabase.table('courses').delete().in_('course_code', ['TEST1', 'TEST2']).execute()
except:
    pass

