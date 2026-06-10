import httpx
import json
import random
import string

BASE_URL = "http://localhost:8000/api/v1"

def run_tests():
    # Setup test users
    email_a = "user1@example.com"
    password_a = "Test@1234"

    print("--- 1. Login as User A ---")
    login_payload = {"email": email_a, "password": password_a}
    r = httpx.post(f"{BASE_URL}/auth/login", json=login_payload)
    assert r.status_code == 200, f"Login A failed: {r.text}"
    token_a = r.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}
    user_a_details = httpx.get(f"{BASE_URL}/users/me", headers=headers_a).json()
    print(f"User A logged in: @{user_a_details['username']}")

    # 2. Test Advanced Search
    print("\n--- 2. Testing Advanced Search (Endpoint: /courses/search) ---")
    # Base search
    r = httpx.get(f"{BASE_URL}/courses/search", headers=headers_a)
    assert r.status_code == 200, f"Search base failed: {r.text}"
    search_data = r.json()
    assert "courses" in search_data
    assert "total" in search_data
    assert "pages" in search_data
    print(f"Base search returned {len(search_data['courses'])} courses out of {search_data['total']} total.")

    # Search with text query
    test_q = "python"
    r = httpx.get(f"{BASE_URL}/courses/search?q={test_q}", headers=headers_a)
    assert r.status_code == 200
    q_data = r.json()
    print(f"Search with q='{test_q}' returned {len(q_data['courses'])} courses.")
    for c in q_data["courses"]:
        match = (test_q in c["title"].lower()) or (c["description"] and test_q in c["description"].lower()) or (c["tags"] and test_q in c["tags"].lower())
        assert match, f"Course ID={c['id']} does not match query '{test_q}'"

    # Search with category
    r = httpx.get(f"{BASE_URL}/courses/search?category=Programming", headers=headers_a)
    assert r.status_code == 200
    cat_data = r.json()
    print(f"Search with category='Programming' returned {len(cat_data['courses'])} courses.")
    for c in cat_data["courses"]:
        assert c["category"] == "Programming", f"Incorrect category: {c['category']}"

    # Search with level
    r = httpx.get(f"{BASE_URL}/courses/search?level=Beginner", headers=headers_a)
    assert r.status_code == 200
    lvl_data = r.json()
    print(f"Search with level='Beginner' returned {len(lvl_data['courses'])} courses.")
    for c in lvl_data["courses"]:
        assert c["level"] == "Beginner", f"Incorrect level: {c['level']}"

    # Search with price limits
    r = httpx.get(f"{BASE_URL}/courses/search?min_price=10&max_price=50", headers=headers_a)
    assert r.status_code == 200
    price_data = r.json()
    print(f"Search with price $10-$50 returned {len(price_data['courses'])} courses.")
    for c in price_data["courses"]:
        assert 10 <= c["price"] <= 50, f"Incorrect price: {c['price']}"

    # Search with free filter
    r = httpx.get(f"{BASE_URL}/courses/search?is_free=true", headers=headers_a)
    assert r.status_code == 200
    free_data = r.json()
    print(f"Search with is_free=true returned {len(free_data['courses'])} courses.")
    for c in free_data["courses"]:
        assert c["price"] == 0, f"Course not free: price={c['price']}"

    # Search with certificate filter
    r = httpx.get(f"{BASE_URL}/courses/search?has_certificate=true", headers=headers_a)
    assert r.status_code == 200
    cert_filter_data = r.json()
    print(f"Search with has_certificate=true returned {len(cert_filter_data['courses'])} courses.")
    for c in cert_filter_data["courses"]:
        assert c["has_certificate"] is True

    # Search with sorting by rating
    r = httpx.get(f"{BASE_URL}/courses/search?sort_by=highest_rated", headers=headers_a)
    assert r.status_code == 200
    sorted_data = r.json()
    print("Search sorted by rating returned courses in correct descending order.")
    ratings = [c["rating"] for c in sorted_data["courses"]]
    assert ratings == sorted(ratings, reverse=True), f"Rating sorting incorrect: {ratings}"

    # 3. Test Course Certificates
    print("\n--- 3. Testing Course Certificate Download Constraints ---")
    # Fetch first course from search
    course = search_data["courses"][0]
    course_id = course["id"]
    course_title = course["title"]
    print(f"Target course: ID={course_id}, Title='{course_title}', Certificate={course.get('has_certificate')}")

    # Ensure certificate option is active on course (if not, update it)
    if not course.get("has_certificate", True):
        print("Enabling certificate for the target course...")
        # (This is database check. Standard course has_certificate is True by default)

    # Clean up enrollment state first
    httpx.delete(f"{BASE_URL}/courses/{course_id}/enroll", headers=headers_a)

    # A. Attempt certificate download without enrollment (Should fail 400)
    cert_res = httpx.get(f"{BASE_URL}/courses/{course_id}/certificate", headers=headers_a)
    assert cert_res.status_code == 400, f"Expected 400 without enrollment but got: {cert_res.status_code} {cert_res.text}"
    print("Correctly rejected certificate request for unenrolled course.")

    # Enroll user
    enroll_res = httpx.post(f"{BASE_URL}/courses/{course_id}/enroll", json={}, headers=headers_a)
    assert enroll_res.status_code == 200, f"Failed to enroll: {enroll_res.text}"
    print("User enrolled successfully. Initial progress is 0%.")

    # B. Attempt certificate download at 0% progress (Should fail 400)
    cert_res = httpx.get(f"{BASE_URL}/courses/{course_id}/certificate", headers=headers_a)
    assert cert_res.status_code == 400, f"Expected 400 for 0% progress but got: {cert_res.status_code} {cert_res.text}"
    print("Correctly rejected certificate request for incomplete course (0% progress).")

    # Set progress to 50%
    progress_res = httpx.put(f"{BASE_URL}/courses/{course_id}/progress", json={"progress": 50}, headers=headers_a)
    assert progress_res.status_code == 200
    print("Progress updated to 50%.")

    # C. Attempt certificate download at 50% progress (Should fail 400)
    cert_res = httpx.get(f"{BASE_URL}/courses/{course_id}/certificate", headers=headers_a)
    assert cert_res.status_code == 400, f"Expected 400 for 50% progress but got: {cert_res.status_code} {cert_res.text}"
    print("Correctly rejected certificate request for incomplete course (50% progress).")

    # Set progress to 100%
    progress_res = httpx.put(f"{BASE_URL}/courses/{course_id}/progress", json={"progress": 100}, headers=headers_a)
    assert progress_res.status_code == 200
    print("Progress updated to 100% (Course Completed).")

    # D. Attempt certificate download at 100% progress (Should succeed 200)
    cert_res = httpx.get(f"{BASE_URL}/courses/{course_id}/certificate", headers=headers_a)
    assert cert_res.status_code == 200, f"Expected 200 but got: {cert_res.status_code} {cert_res.text}"
    
    # Assert headers
    assert cert_res.headers["content-type"] == "application/pdf", f"Incorrect content type: {cert_res.headers['content-type']}"
    assert "inline" in cert_res.headers["content-disposition"]
    
    # Assert PDF content
    pdf_bytes = cert_res.content
    assert pdf_bytes.startswith(b"%PDF"), "Response is not a valid PDF file"
    print(f"Successfully generated and downloaded certificate PDF! File size: {len(pdf_bytes)} bytes.")

    # Cleanup: unenroll
    unenroll_res = httpx.delete(f"{BASE_URL}/courses/{course_id}/enroll", headers=headers_a)
    assert unenroll_res.status_code == 200
    print("Cleaned up enrollment.")

    print("\n=== ALL BATCH 3 ADVANCED SEARCH & CERTIFICATE TESTS PASSED! ===")

if __name__ == "__main__":
    run_tests()
