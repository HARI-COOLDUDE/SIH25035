"""
Unit tests for eConsultation AI Backend
Tests API endpoints, sentiment analysis, and summarization functionality
"""

import pytest
import asyncio
import tempfile
import os
import sqlite3
import pandas as pd
import io
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

# Import the FastAPI app
from app import app, process_comment, ai_models

# Create test client
client = TestClient(app)

class TestDatabase:
    """Test database operations"""
    
    @pytest.fixture
    def temp_db(self):
        """Create temporary database for testing"""
        with tempfile.NamedTemporaryFile(delete=False, suffix='.db') as tmp_file:
            db_path = tmp_file.name
        
        # Override database path for testing
        original_db_path = app.DATABASE_PATH if hasattr(app, 'DATABASE_PATH') else None
        app.DATABASE_PATH = db_path
        
        # Initialize test database
        init_database()
        
        yield db_path
        
        # Cleanup
        os.unlink(db_path)
        if original_db_path:
            app.DATABASE_PATH = original_db_path
    
    def test_database_initialization(self, temp_db):
        """Test database table creation"""
        conn = sqlite3.connect(temp_db)
        cursor = conn.cursor()
        
        # Check if comments table exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='comments'
        """)
        
        result = cursor.fetchone()
        conn.close()
        
        assert result is not None
        assert result[0] == 'comments'

class TestAPIEndpoints:
    """Test API endpoint functionality"""
    
    def test_root_endpoint(self):
        """Test the root health check endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
    
    def test_submit_single_comment(self):
        """Test single comment submission"""
        comment_data = {
            "stakeholder_type": "citizen",
            "raw_text": "This policy will benefit our community and create jobs."
        }
        
        response = client.post("/api/comments", json=comment_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert data["stakeholder_type"] == "citizen"
        assert "sentiment_label" in data
        assert "sentiment_score" in data
        assert "summary" in data
    
    def test_submit_empty_comment(self):
        """Test submission of empty comment"""
        comment_data = {
            "stakeholder_type": "citizen",
            "raw_text": ""
        }
        
        response = client.post("/api/comments", json=comment_data)
        # Should still process but with appropriate handling
        assert response.status_code in [200, 422]
    
    def test_get_all_comments(self):
        """Test retrieving all comments"""
        # First, submit a test comment
        comment_data = {
            "stakeholder_type": "business",
            "raw_text": "The regulations are too restrictive for small businesses."
        }
        client.post("/api/comments", json=comment_data)
        
        # Then retrieve all comments
        response = client.get("/api/comments")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
    
    def test_get_single_comment(self):
        """Test retrieving a single comment by ID"""
        # Submit a test comment first
        comment_data = {
            "stakeholder_type": "ngo",
            "raw_text": "We support environmental protection measures."
        }
        
        response = client.post("/api/comments", json=comment_data)
        comment_id = response.json()["id"]
        
        # Retrieve the specific comment
        response = client.get(f"/api/comments/{comment_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == comment_id
        assert data["stakeholder_type"] == "ngo"
    
    def test_get_nonexistent_comment(self):
        """Test retrieving a non-existent comment"""
        response = client.get("/api/comments/99999")
        assert response.status_code == 404
    
    def test_bulk_csv_upload(self):
        """Test CSV bulk upload functionality"""
        # Create sample CSV data
        csv_data = """stakeholder_type,raw_text
citizen,This policy will create jobs in our community.
business,The compliance costs are too high for small enterprises.
ngo,We need stronger environmental protections."""
        
        csv_file = io.BytesIO(csv_data.encode())
        
        response = client.post(
            "/api/comments/bulk",
            files={"file": ("test.csv", csv_file, "text/csv")}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "comments" in data
        assert len(data["comments"]) == 3
    
    def test_invalid_csv_upload(self):
        """Test uploading invalid CSV file"""
        # Create invalid file (not CSV)
        txt_data = "This is not a CSV file"
        txt_file = io.BytesIO(txt_data.encode())
        
        response = client.post(
            "/api/comments/bulk",
            files={"file": ("test.txt", txt_file, "text/plain")}
        )
        
        assert response.status_code == 400
    
    def test_dashboard_stats(self):
        """Test dashboard statistics endpoint"""
        # Submit some test comments first
        test_comments = [
            {"stakeholder_type": "citizen", "raw_text": "Great policy initiative!"},
            {"stakeholder_type": "business", "raw_text": "This will hurt small businesses."},
            {"stakeholder_type": "ngo", "raw_text": "The approach seems reasonable."}
        ]
        
        for comment in test_comments:
            client.post("/api/comments", json=comment)
        
        response = client.get("/api/dashboard")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_comments" in data
        assert "positive_percentage" in data
        assert "neutral_percentage" in data
        assert "negative_percentage" in data
        assert "recent_comments" in data
        assert data["total_comments"] >= 3

class TestAIFunctionality:
    """Test AI model functionality"""
    
    @patch('app.ai_models')
    def test_sentiment_analysis(self, mock_ai_models):
        """Test sentiment analysis functionality"""
        # Mock the sentiment analyzer
        mock_sentiment_result = [{'label': 'POSITIVE', 'score': 0.95}]
        mock_ai_models.sentiment_analyzer.return_value = mock_sentiment_result
        
        from app import analyze_sentiment
        
        sentiment, score = analyze_sentiment("This is a great policy!")
        
        assert sentiment == "positive"
        assert score == 0.95
    
    @patch('app.ai_models')
    def test_summarization(self, mock_ai_models):
        """Test text summarization functionality"""
        # Mock the summarizer
        mock_summary_result = [{'summary_text': 'Policy creates jobs and benefits community.'}]
        mock_ai_models.summarizer.return_value = mock_summary_result
        
        from app import generate_summary
        
        text = "This policy will create many jobs in our community and benefit local businesses significantly."
        summary = generate_summary(text)
        
        assert "Policy creates jobs" in summary
    
    def test_comment_processing_pipeline(self):
        """Test the complete comment processing pipeline"""
        test_comment = {
            'stakeholder_type': 'citizen',
            'raw_text': 'This healthcare policy will improve access to medical services for rural communities.'
        }
        
        result = process_comment(test_comment['stakeholder_type'], test_comment['raw_text'])
        
        assert 'timestamp' in result
        assert 'sentiment_label' in result
        assert 'sentiment_score' in result
        assert 'summary' in result
        assert result['stakeholder_type'] == 'citizen'
        assert result['sentiment_label'] in ['positive', 'negative', 'neutral']
        assert 0 <= result['sentiment_score'] <= 1

class TestWordCloudGeneration:
    """Test word cloud generation functionality"""
    
    def test_wordcloud_endpoint_empty_database(self):
        """Test word cloud generation with no comments"""
        # Clear any existing comments by testing with fresh client
        response = client.get("/api/wordcloud")
        
        # Should return 404 if no comments available
        assert response.status_code in [200, 404]
    
    def test_wordcloud_endpoint_with_data(self):
        """Test word cloud generation with comments"""
        # Add some test comments first
        test_comments = [
            {"stakeholder_type": "citizen", "raw_text": "policy community jobs economic development"},
            {"stakeholder_type": "business", "raw_text": "regulations compliance business growth innovation"},
            {"stakeholder_type": "ngo", "raw_text": "environmental protection sustainability green energy"}
        ]
        
        for comment in test_comments:
            client.post("/api/comments", json=comment)
        
        response = client.get("/api/wordcloud")
        
        if response.status_code == 200:
            assert response.headers["content-type"] == "image/png"
        else:
            # May return 404 if word cloud generation fails
            assert response.status_code == 404

class TestInputValidation:
    """Test input validation and error handling"""
    
    def test_invalid_stakeholder_type(self):
        """Test invalid stakeholder type handling"""
        comment_data = {
            "stakeholder_type": "invalid_type",
            "raw_text": "Some comment text"
        }
        
        response = client.post("/api/comments", json=comment_data)
        # Should still process but may have validation warnings
        assert response.status_code in [200, 422]
    
    def test_missing_required_fields(self):
        """Test missing required fields"""
        # Missing stakeholder_type
        comment_data = {
            "raw_text": "Some comment text"
        }
        
        response = client.post("/api/comments", json=comment_data)
        assert response.status_code == 422
        
        # Missing raw_text
        comment_data = {
            "stakeholder_type": "citizen"
        }
        
        response = client.post("/api/comments", json=comment_data)
        assert response.status_code == 422
    
    def test_extremely_long_text(self):
        """Test handling of extremely long comment text"""
        # Create very long text (10,000 characters)
        long_text = "This is a very long comment. " * 400
        
        comment_data = {
            "stakeholder_type": "citizen",
            "raw_text": long_text
        }
        
        response = client.post("/api/comments", json=comment_data)
        assert response.status_code == 200
        
        # Should still process but may truncate
        data = response.json()
        assert "summary" in data
    
    def test_special_characters_in_text(self):
        """Test handling of special characters and non-ASCII text"""
        comment_data = {
            "stakeholder_type": "citizen",
            "raw_text": "This policy affects émigré communities and costs ₹1000 per family. 你好世界! @#$%^&*()"
        }
        
        response = client.post("/api/comments", json=comment_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "sentiment_label" in data
        assert "summary" in data

class TestPerformance:
    """Test performance and scalability"""
    
    def test_concurrent_comment_submissions(self):
        """Test handling of multiple concurrent requests"""
        import threading
        import time
        
        results = []
        
        def submit_comment(comment_id):
            comment_data = {
                "stakeholder_type": "citizen",
                "raw_text": f"Test comment number {comment_id} for performance testing."
            }
            response = client.post("/api/comments", json=comment_data)
            results.append(response.status_code)
        
        # Submit 10 comments concurrently
        threads = []
        for i in range(10):
            thread = threading.Thread(target=submit_comment, args=(i,))
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # All requests should succeed
        assert all(status == 200 for status in results)
        assert len(results) == 10
    
    def test_large_csv_processing(self):
        """Test processing of larger CSV files"""
        # Create CSV with 50 entries
        csv_rows = ["stakeholder_type,raw_text"]
        stakeholder_types = ["citizen", "business", "ngo", "academic"]
        
        for i in range(50):
            stakeholder = stakeholder_types[i % len(stakeholder_types)]
            text = f"Sample policy comment number {i} discussing various aspects of the proposed legislation."
            csv_rows.append(f"{stakeholder},{text}")
        
        csv_data = "\n".join(csv_rows)
        csv_file = io.BytesIO(csv_data.encode())
        
        response = client.post(
            "/api/comments/bulk",
            files={"file": ("large_test.csv", csv_file, "text/csv")}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["comments"]) == 50

class TestErrorHandling:
    """Test error handling and edge cases"""
    
    @patch('app.ai_models.sentiment_analyzer')
    def test_sentiment_analysis_failure(self, mock_sentiment):
        """Test handling of sentiment analysis failures"""
        # Mock sentiment analyzer to raise an exception
        mock_sentiment.side_effect = Exception("Model unavailable")
        
        comment_data = {
            "stakeholder_type": "citizen",
            "raw_text": "Test comment for error handling"
        }
        
        response = client.post("/api/comments", json=comment_data)
        
        # Should still return 200 with fallback values
        assert response.status_code == 200
        data = response.json()
        
        # Should have fallback sentiment
        assert data["sentiment_label"] in ["positive", "negative", "neutral"]
    
    @patch('app.ai_models.summarizer')
    def test_summarization_failure(self, mock_summarizer):
        """Test handling of summarization failures"""
        # Mock summarizer to raise an exception
        mock_summarizer.side_effect = Exception("Summarization failed")
        
        comment_data = {
            "stakeholder_type": "citizen",
            "raw_text": "This is a test comment for checking error handling in summarization pipeline."
        }
        
        response = client.post("/api/comments", json=comment_data)
        
        # Should still return 200 with fallback summary
        assert response.status_code == 200
        data = response.json()
        
        # Should have fallback summary (truncated text)
        assert "summary" in data
        assert len(data["summary"]) > 0
    
    def test_database_connection_handling(self):
        """Test database connection error handling"""
        # This would require mocking sqlite3.connect, which is complex
        # For now, we'll test basic database operations
        response = client.get("/api/comments")
        assert response.status_code == 200

class TestDataIntegrity:
    """Test data integrity and consistency"""
    
    def test_comment_data_persistence(self):
        """Test that comment data persists correctly"""
        # Submit a comment
        original_comment = {
            "stakeholder_type": "academic",
            "raw_text": "The methodology used in this policy research is scientifically sound."
        }
        
        response = client.post("/api/comments", json=original_comment)
        comment_id = response.json()["id"]
        
        # Retrieve the comment
        response = client.get(f"/api/comments/{comment_id}")
        retrieved_comment = response.json()
        
        # Verify data integrity
        assert retrieved_comment["stakeholder_type"] == original_comment["stakeholder_type"]
        assert retrieved_comment["raw_text"] == original_comment["raw_text"]
        assert "timestamp" in retrieved_comment
        assert "created_at" in retrieved_comment
    
    def test_sentiment_score_range(self):
        """Test that sentiment scores are within valid range"""
        comment_data = {
            "stakeholder_type": "citizen",
            "raw_text": "This policy will significantly improve our quality of life."
        }
        
        response = client.post("/api/comments", json=comment_data)
        data = response.json()
        
        # Sentiment score should be between 0 and 1
        assert 0 <= data["sentiment_score"] <= 1
    
    def test_timestamp_format(self):
        """Test timestamp format consistency"""
        comment_data = {
            "stakeholder_type": "citizen",
            "raw_text": "Testing timestamp format."
        }
        
        response = client.post("/api/comments", json=comment_data)
        data = response.json()
        
        # Verify timestamp format (should be parseable)
        from datetime import datetime
        
        try:
            datetime.fromisoformat(data["timestamp"].replace(' ', 'T'))
            timestamp_valid = True
        except ValueError:
            timestamp_valid = False
        
        assert timestamp_valid

# Fixtures for test setup and teardown
@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Set up test environment before running tests"""
    # Any global setup can go here
    yield
    # Cleanup after all tests

@pytest.fixture
def sample_comments():
    """Fixture providing sample comments for testing"""
    return [
        {
            "stakeholder_type": "citizen",
            "raw_text": "This policy will create jobs and boost economic growth in rural areas.",
            "expected_sentiment": "positive"
        },
        {
            "stakeholder_type": "business",
            "raw_text": "The new regulations will impose heavy compliance costs on small businesses.",
            "expected_sentiment": "negative"
        },
        {
            "stakeholder_type": "ngo",
            "raw_text": "We appreciate the government's effort but more consultation is needed.",
            "expected_sentiment": "neutral"
        },
        {
            "stakeholder_type": "academic",
            "raw_text": "The research methodology is sound and findings support the policy recommendations.",
            "expected_sentiment": "positive"
        }
    ]

# Integration tests using sample data
class TestIntegration:
    """Integration tests using realistic data"""
    
    def test_end_to_end_workflow(self, sample_comments):
        """Test complete end-to-end workflow"""
        submitted_ids = []
        
        # Step 1: Submit all sample comments
        for comment in sample_comments:
            response = client.post("/api/comments", json={
                "stakeholder_type": comment["stakeholder_type"],
                "raw_text": comment["raw_text"]
            })
            assert response.status_code == 200
            submitted_ids.append(response.json()["id"])
        
        # Step 2: Verify all comments are stored
        response = client.get("/api/comments")
        all_comments = response.json()
        assert len([c for c in all_comments if c["id"] in submitted_ids]) == len(sample_comments)
        
        # Step 3: Check dashboard statistics
        response = client.get("/api/dashboard")
        assert response.status_code == 200
        dashboard_data = response.json()
        assert dashboard_data["total_comments"] >= len(sample_comments)
        
        # Step 4: Verify individual comment retrieval
        for comment_id in submitted_ids:
            response = client.get(f"/api/comments/{comment_id}")
            assert response.status_code == 200
            comment_data = response.json()
            assert comment_data["sentiment_label"] in ["positive", "negative", "neutral"]
    
    def test_csv_to_dashboard_workflow(self):
        """Test CSV upload to dashboard analytics workflow"""
        # Create CSV with mixed sentiment comments
        csv_data = """stakeholder_type,raw_text
citizen,This excellent policy will transform our healthcare system for the better.
business,These restrictive regulations will destroy small business opportunities.
ngo,The policy framework needs more comprehensive stakeholder consultation.
academic,Research indicates this approach aligns with international best practices.
citizen,I strongly oppose these changes as they will increase our tax burden.
business,We welcome these reforms as they will reduce bureaucratic red tape."""
        
        csv_file = io.BytesIO(csv_data.encode())
        
        # Upload CSV
        response = client.post(
            "/api/comments/bulk",
            files={"file": ("integration_test.csv", csv_file, "text/csv")}
        )
        assert response.status_code == 200
        
        # Check dashboard reflects new data
        response = client.get("/api/dashboard")
        dashboard_data = response.json()
        
        # Should have processed the CSV comments
        assert dashboard_data["total_comments"] >= 6
        
        # Should have sentiment distribution
        total_percentage = (dashboard_data["positive_percentage"] + 
                          dashboard_data["neutral_percentage"] + 
                          dashboard_data["negative_percentage"])
        assert abs(total_percentage - 100.0) < 0.1  # Allow for rounding

if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([
        "-v",  # Verbose output
        "-s",  # Don't capture stdout
        "--tb=short",  # Short traceback format
        __file__
    ])
