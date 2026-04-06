import requests
import time
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)

# Caching dictionary with TTL (time to live)
cache = {}
cache_ttl = 300 # 5 minutes


def set_cache(key, value):
    cache[key] = (value, time.time())


def get_cache(key):
    if key in cache:
        value, timestamp = cache[key]
        if time.time() - timestamp < cache_ttl:
            return value
        else:
            del cache[key]  # Remove expired cache
    return None


def validate_ticker(ticker):
    # Basic ticker validation logic (can be expanded)
    return len(ticker) > 0 and ticker.isalnum()


def search_tickers(ticker):
    if not validate_ticker(ticker):
        logging.error('Invalid ticker format.')
        return []
    
    # Simulated search functionality (replace with actual search)
    try:
        response = requests.get(f'https://api.example.com/tickers/search?q={ticker}')
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logging.error(f'Error searching tickers: {e}')
        return []


def get_expiries_detailed(ticker):
    data = get_cache(ticker)
    if data:
        return data
    try:
        response = requests.get(f'https://api.example.com/options/expiries?ticker={ticker}')
        response.raise_for_status()
        data = response.json()
        set_cache(ticker, data)
        return data
    except requests.exceptions.RequestException as e:
        logging.error(f'Error getting expiries: {e}')
        return None


# Example of how to use the functions
if __name__ == '__main__':
    ticker = 'AAPL'
    expiries = get_expiries_detailed(ticker)
    if expiries:
        logging.info(f'Expiries for {ticker}: {expiries}')
    else:
        logging.info(f'No data found for {ticker}.')