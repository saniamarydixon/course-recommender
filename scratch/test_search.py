import httpx
import json

BASE_URL = "http://localhost:8000/api/v1"

# Login to get token
login_payload = {"email": "user1@example.com", "password": "Test@1234"}
r = httpx.post(f"{BASE_URL}/auth/login", json=login_payload)
if r.status_code != 200:
    print(f"Login failed: {r.status_code} {r.text}")
    exit(1)

token = r.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Search request
r_search = httpx.get(f"{BASE_URL}/courses/search", headers=headers)
print("Search Status Code:", r_search.status_code)
print("Search Response Payload:")
try:
    print(json.dumps(r_search.json(), indent=2))
except Exception as e:
    print(r_search.text)
