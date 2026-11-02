
from pymongo import MongoClient
from decouple import config
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_pymongo_client():
    """
    Create and return a MongoDB client connection.
    """
    try:
        uri = config('MONGO_URI', default='mongodb://localhost:27017/clubsite_db')
        client = MongoClient(uri, serverSelectionTimeoutMS=5000)  # 5 second timeout
        # Test the connection
        client.admin.command('ping')
        logger.info("Successfully connected to MongoDB")
        return client
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {str(e)}")
        raise e
