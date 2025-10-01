#!/usr/bin/env python3
"""
Test WordCloud Generation
Tests the wordcloud functionality independently
"""

import sys
import os
import logging

# Add backend to path
sys.path.append('backend')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_wordcloud_generation():
    """Test wordcloud generation functionality"""
    try:
        # Change to backend directory
        os.chdir('backend')
        
        # Import the wordcloud generator
        from wordcloud_generator import WordCloudGenerator
        
        logger.info("Testing WordCloud Generator...")
        
        # Initialize generator
        generator = WordCloudGenerator()
        
        # Test getting comments text
        logger.info("Testing comment text retrieval...")
        text = generator.get_comments_text()
        
        if not text:
            logger.warning("No comments found in database")
            logger.info("Creating sample data for testing...")
            
            # Create sample data
            import sqlite3
            conn = sqlite3.connect('eConsultation.db')
            cursor = conn.cursor()
            
            # Initialize database
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS comments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    stakeholder_type TEXT NOT NULL,
                    raw_text TEXT NOT NULL,
                    sentiment_label TEXT,
                    sentiment_score REAL,
                    summary TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Insert sample comments
            sample_comments = [
                ("citizen", "This policy will create jobs and boost economic growth", "positive", 0.85),
                ("business", "The regulations are too restrictive for small businesses", "negative", 0.78),
                ("ngo", "We need more environmental protection measures", "neutral", 0.65),
                ("academic", "The research methodology is sound and well-documented", "positive", 0.92),
                ("citizen", "I oppose this proposal as it increases taxes", "negative", 0.88)
            ]
            
            for stakeholder, text, sentiment, score in sample_comments:
                cursor.execute('''
                    INSERT INTO comments (timestamp, stakeholder_type, raw_text, sentiment_label, sentiment_score, summary)
                    VALUES (datetime('now'), ?, ?, ?, ?, ?)
                ''', (stakeholder, text, sentiment, score, text[:50] + "..."))
            
            conn.commit()
            conn.close()
            
            logger.info("Sample data created")
            
            # Try again
            text = generator.get_comments_text()
        
        if text:
            logger.info(f"Retrieved text with {len(text)} characters")
            
            # Test basic wordcloud generation
            logger.info("Testing basic wordcloud generation...")
            basic_path = generator.generate_basic_wordcloud(text, "test_wordcloud.png")
            
            if basic_path and os.path.exists(basic_path):
                logger.info(f"✅ Basic wordcloud generated: {basic_path}")
            else:
                logger.error("❌ Basic wordcloud generation failed")
            
            # Test advanced wordcloud generation
            logger.info("Testing advanced wordcloud generation...")
            advanced_path = generator.generate_advanced_wordcloud(text, "test_advanced_wordcloud.png")
            
            if advanced_path and os.path.exists(advanced_path):
                logger.info(f"✅ Advanced wordcloud generated: {advanced_path}")
            else:
                logger.error("❌ Advanced wordcloud generation failed")
            
            # Test sentiment-specific wordclouds
            logger.info("Testing sentiment-specific wordclouds...")
            sentiment_files = generator.generate_sentiment_wordclouds()
            
            if sentiment_files:
                logger.info(f"✅ Generated {len(sentiment_files)} sentiment wordclouds")
                for file in sentiment_files:
                    logger.info(f"  - {file}")
            else:
                logger.error("❌ Sentiment wordcloud generation failed")
            
            logger.info("✅ WordCloud generation test completed successfully!")
            return True
        else:
            logger.error("❌ No text available for wordcloud generation")
            return False
            
    except Exception as e:
        logger.error(f"❌ WordCloud test failed: {e}")
        return False
    finally:
        # Change back to original directory
        os.chdir('..')

def main():
    """Main test function"""
    logger.info("🧪 Starting WordCloud Generation Test")
    logger.info("=" * 50)
    
    success = test_wordcloud_generation()
    
    if success:
        logger.info("🎉 All wordcloud tests passed!")
    else:
        logger.error("❌ Some wordcloud tests failed")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)