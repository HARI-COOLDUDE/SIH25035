#!/usr/bin/env python3
"""
Backend Demo Script
Demonstrates the eConsultation AI backend functionality
"""

import requests
import json
import logging
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def demo_comment_processing():
    """Demo comment processing with AI"""
    logger.info("🤖 Demonstrating AI Comment Processing")
    logger.info("=" * 50)
    
    # Sample comments to test
    test_comments = [
        {
            "stakeholder_type": "citizen",
            "raw_text": "I strongly support this new environmental policy. It will help protect our planet for future generations and create green jobs in our community."
        },
        {
            "stakeholder_type": "business",
            "raw_text": "While we understand the need for environmental protection, the proposed regulations will significantly increase our operational costs and may force us to lay off workers."
        },
        {
            "stakeholder_type": "ngo",
            "raw_text": "This policy is a good start, but it doesn't go far enough. We need more aggressive targets and stronger enforcement mechanisms to address the climate crisis effectively."
        }
    ]
    
    processed_comments = []
    
    for i, comment in enumerate(test_comments, 1):
        logger.info(f"\n📝 Processing Comment {i}:")
        logger.info(f"   Stakeholder: {comment['stakeholder_type']}")
        logger.info(f"   Text: {comment['raw_text'][:80]}...")
        
        try:
            response = requests.post(
                "http://localhost:8000/api/comments",
                json=comment,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                processed_comments.append(result)
                
                logger.info(f"   ✅ Processed successfully!")
                logger.info(f"   🎯 Sentiment: {result['sentiment_label'].upper()} ({result['sentiment_score']:.3f})")
                logger.info(f"   📄 Summary: {result['summary']}")
                logger.info(f"   🆔 Comment ID: {result['id']}")
            else:
                logger.error(f"   ❌ Processing failed: {response.status_code}")
                
        except Exception as e:
            logger.error(f"   ❌ Error: {e}")
    
    return processed_comments

def demo_dashboard_stats():
    """Demo dashboard statistics"""
    logger.info("\n📊 Dashboard Statistics")
    logger.info("=" * 30)
    
    try:
        response = requests.get("http://localhost:8000/api/dashboard", timeout=10)
        if response.status_code == 200:
            data = response.json()
            
            logger.info(f"📈 Total Comments: {data['total_comments']}")
            logger.info(f"😊 Positive: {data['positive_percentage']:.1f}%")
            logger.info(f"😐 Neutral: {data['neutral_percentage']:.1f}%")
            logger.info(f"😞 Negative: {data['negative_percentage']:.1f}%")
            
            # Show sentiment distribution bar
            total = data['total_comments']
            if total > 0:
                pos_bar = "█" * int(data['positive_percentage'] / 5)
                neu_bar = "█" * int(data['neutral_percentage'] / 5)
                neg_bar = "█" * int(data['negative_percentage'] / 5)
                
                logger.info(f"\n📊 Sentiment Distribution:")
                logger.info(f"   Positive: {pos_bar} {data['positive_percentage']:.1f}%")
                logger.info(f"   Neutral:  {neu_bar} {data['neutral_percentage']:.1f}%")
                logger.info(f"   Negative: {neg_bar} {data['negative_percentage']:.1f}%")
            
        else:
            logger.error(f"❌ Dashboard request failed: {response.status_code}")
            
    except Exception as e:
        logger.error(f"❌ Dashboard error: {e}")

def demo_word_cloud():
    """Demo word cloud generation"""
    logger.info("\n☁️ Word Cloud Generation")
    logger.info("=" * 30)
    
    try:
        # Generate basic word cloud
        response = requests.get("http://localhost:8000/api/wordcloud", timeout=30)
        if response.status_code == 200:
            logger.info("✅ Basic word cloud generated successfully")
            logger.info("   💾 Image saved and available via API")
        else:
            logger.error(f"❌ Word cloud generation failed: {response.status_code}")
            
        # Try sentiment-specific word clouds
        for sentiment in ['positive', 'negative', 'neutral']:
            response = requests.get(f"http://localhost:8000/api/wordcloud?sentiment={sentiment}", timeout=30)
            if response.status_code == 200:
                logger.info(f"✅ {sentiment.capitalize()} word cloud generated")
            elif response.status_code == 404:
                logger.info(f"ℹ️  No {sentiment} comments available for word cloud")
            else:
                logger.error(f"❌ {sentiment.capitalize()} word cloud failed: {response.status_code}")
                
    except Exception as e:
        logger.error(f"❌ Word cloud error: {e}")

def demo_csv_upload():
    """Demo CSV bulk upload"""
    logger.info("\n📁 CSV Bulk Upload Demo")
    logger.info("=" * 30)
    
    # Create sample CSV content
    csv_content = """stakeholder_type,raw_text
citizen,"I love this new policy initiative. It shows real leadership and vision for our community's future."
business,"The implementation timeline seems too aggressive. We need more time to adapt our processes."
ngo,"This is exactly what we've been advocating for. Thank you for listening to our concerns."
citizen,"I'm not sure about the cost implications. Will this increase my taxes?"
academic,"The research supports this approach. Studies show significant benefits for public health."
"""
    
    try:
        files = {'file': ('demo_comments.csv', csv_content, 'text/csv')}
        response = requests.post(
            "http://localhost:8000/api/comments/bulk",
            files=files,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            logger.info(f"✅ CSV upload successful!")
            logger.info(f"   📊 Processed {len(result.get('comments', []))} comments")
            
            # Show summary of processed comments
            for i, comment in enumerate(result.get('comments', [])[:3], 1):
                logger.info(f"   {i}. [{comment['sentiment_label'].upper()}] {comment['summary'][:50]}...")
                
        else:
            logger.error(f"❌ CSV upload failed: {response.status_code}")
            logger.error(f"   Response: {response.text}")
            
    except Exception as e:
        logger.error(f"❌ CSV upload error: {e}")

def main():
    """Main demo function"""
    logger.info("🎭 eConsultation AI Backend Demo")
    logger.info("🚀 Showcasing AI-powered comment analysis")
    logger.info("=" * 60)
    
    # Check if backend is running
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code != 200:
            logger.error("❌ Backend is not healthy. Please start it first.")
            logger.info("💡 Run: python start_backend.py")
            return False
    except:
        logger.error("❌ Backend is not running. Please start it first.")
        logger.info("💡 Run: python start_backend.py")
        return False
    
    logger.info("✅ Backend is running and healthy!")
    
    # Run demos
    demo_comment_processing()
    demo_dashboard_stats()
    demo_word_cloud()
    demo_csv_upload()
    
    logger.info("\n" + "=" * 60)
    logger.info("🎉 Demo completed successfully!")
    logger.info("🌐 Explore more at: http://localhost:8000/docs")
    
    return True

if __name__ == "__main__":
    main()