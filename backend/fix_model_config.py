"""
Model Configuration Fix Script
Fixes common issues with saved model configurations
"""

import os
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fix_model_configs():
    """Fix model configuration files"""
    model_paths = [
        "models/sentiment_model",
        "models/simple_sentiment_model", 
        "models/instant_sentiment_model"
    ]
    
    for model_path in model_paths:
        if os.path.exists(model_path):
            config_path = os.path.join(model_path, "config.json")
            if os.path.exists(config_path):
                try:
                    logger.info(f"Checking config in {config_path}")
                    
                    with open(config_path, 'r') as f:
                        config = json.load(f)
                    
                    # Fix incorrect model_type
                    if config.get("model_type") == "sentiment_analysis":
                        logger.info(f"Fixing model_type in {config_path}")
                        config["model_type"] = "distilbert"
                        config["architectures"] = ["DistilBertForSequenceClassification"]
                        
                        # Ensure proper labels
                        config["id2label"] = {"0": "negative", "1": "neutral", "2": "positive"}
                        config["label2id"] = {"negative": 0, "neutral": 1, "positive": 2}
                        config["num_labels"] = 3
                        
                        # Save corrected config
                        with open(config_path, 'w') as f:
                            json.dump(config, f, indent=2)
                        logger.info(f"Fixed model config in {config_path}")
                    else:
                        logger.info(f"Config in {config_path} is already correct")
                        
                except Exception as e:
                    logger.error(f"Error fixing config {config_path}: {e}")
            else:
                logger.info(f"No config file found in {model_path}")
        else:
            logger.info(f"Model path {model_path} does not exist")

if __name__ == "__main__":
    fix_model_configs()