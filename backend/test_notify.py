import asyncio
from fastapi import BackgroundTasks
from app.routes.analytics_routes import notify_carryovers_route

class DummyBT:
    def add_task(self, func, *args, **kwargs):
        print(f"Added task {func.__name__} with args {args}")

bt = DummyBT()
try:
    res = notify_carryovers_route(bt, auth_user_id='1e1cf183-c195-46da-a02f-9052fb4ca353')
    print(res)
except Exception as e:
    print(f"Error: {e}")
