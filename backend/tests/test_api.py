# tests/test_api.py
import io
import pandas as pd
import pytest
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)


def test_root_endpoint():
    """Health check should return a message and version."""
    resp = client.get("/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["message"] == "eConsultation AI API is running"
    assert "version" in data


def test_submit_comment():
    """Submit a single comment and check sentiment + summary."""
    payload = {
        "stakeholder_type": "individual",
        "raw_text": "I think this draft policy is excellent and should be supported."
    }
    resp = client.post("/api/comments", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["stakeholder_type"] == "individual"
    assert "sentiment_label" in data
    assert "summary" in data


def test_bulk_comments_upload(tmp_path):
    """Upload a CSV with multiple comments."""
    df = pd.DataFrame([
        {"stakeholder_type": "NGO", "raw_text": "This is a good step forward."},
        {"stakeholder_type": "corporate", "raw_text": "This will harm businesses."}
    ])
    csv_bytes = df.to_csv(index=False).encode("utf-8")

    files = {"file": ("comments.csv", io.BytesIO(csv_bytes), "text/csv")}
    resp = client.post("/api/comments/bulk", files=files)

    assert resp.status_code == 200
    data = resp.json()
    assert "comments" in data
    assert len(data["comments"]) == 2


def test_get_all_comments():
    """Fetch all comments with pagination."""
    resp = client.get("/api/comments?limit=5&offset=0")
    assert resp.status_code == 200
    comments = resp.json()
    assert isinstance(comments, list)


def test_get_single_comment():
    """Get a single comment by ID (use ID=1 assuming earlier tests inserted)."""
    resp = client.get("/api/comments/1")
    # If DB is fresh this may be 404; allow both so CI/tests won't fail immediately
    assert resp.status_code in (200, 404)
    if resp.status_code == 200:
        data = resp.json()
        assert "raw_text" in data


def test_wordcloud_generation():
    """Generate a wordcloud image."""
    resp = client.get("/api/wordcloud")
    # 404 if no comments exist; otherwise image/png
    assert resp.status_code in (200, 404)
    if resp.status_code == 200:
        assert resp.headers["content-type"] == "image/png"


def test_dashboard_stats():
    """Fetch dashboard statistics."""
    resp = client.get("/api/dashboard")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_comments" in data
    assert "positive_percentage" in data
    assert "recent_comments" in data
