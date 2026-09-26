import json
import statistics
import time

import requests


TESTS = {
    "health": ("http://127.0.0.1:8000/health", {}),
    "student_cgpa": (
        "http://127.0.0.1:8000/students/FOS/22/23/292155/gpa/cumulative",
        {},
    ),
    "student_courses": (
        "http://127.0.0.1:8000/students/FOS/22/23/292155/courses",
        {},
    ),
    "adviser_dashboard": (
        "http://127.0.0.1:8000/analytics/dashboard-summary",
        {"auth_user_id": "1e1cf183-c195-46da-a02f-9052fb4ca353"},
    ),
}


def main() -> None:
    results = {}
    for name, (url, headers) in TESTS.items():
        durations = []
        status_codes = []
        errors = []
        for _ in range(3):
            started = time.perf_counter()
            try:
                response = requests.get(url, headers=headers, timeout=15)
                durations.append((time.perf_counter() - started) * 1000)
                status_codes.append(response.status_code)
            except requests.RequestException as exc:
                durations.append((time.perf_counter() - started) * 1000)
                errors.append(type(exc).__name__)
        results[name] = {
            "runs": 3,
            "status_codes": sorted(set(status_codes)),
            "mean_ms": round(statistics.mean(durations), 1),
            "median_ms": round(statistics.median(durations), 1),
            "min_ms": round(min(durations), 1),
            "max_ms": round(max(durations), 1),
            "errors": errors,
        }
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
