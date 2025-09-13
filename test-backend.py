#!/usr/bin/env python3
"""
Gideon Backend Test Script
Tests the basic functionality of the backend API
"""

import requests
import json
import time
import sys
import os

# Configuration
BASE_URL = os.getenv("GIDEON_URL", "http://localhost:8000")
TIMEOUT = 30

def test_endpoint(method, url, data=None, headers=None, description=None):
    """Test a single endpoint"""
    print(f"\n🧪 {description}" if description else f"\n🧪 Testing {method} {url}")

    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=headers, timeout=TIMEOUT)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=TIMEOUT)
        elif method.upper() == "PUT":
            response = requests.put(url, json=data, headers=headers, timeout=TIMEOUT)
        elif method.upper() == "DELETE":
            response = requests.delete(url, headers=headers, timeout=TIMEOUT)
        else:
            print(f"❌ Unsupported method: {method}")
            return False

        if response.status_code >= 200 and response.status_code < 300:
            print(f"✅ Status: {response.status_code}")
            return response
        else:
            print(f"❌ Status: {response.status_code} - {response.text}")
            return False

    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return False

def main():
    print("🚀 Gideon Backend Test Suite")
    print("=" * 50)

    # Test 1: Health Check
    response = test_endpoint("GET", f"{BASE_URL}/health", description="Health Check")
    if not response:
        print("\n❌ Backend is not running or health check failed")
        print("💡 Make sure to run: docker-compose up -d")
        sys.exit(1)

    # Test 2: API Documentation
    response = test_endpoint("GET", f"{BASE_URL}/docs", description="API Documentation")
    if response:
        print("📖 API docs available at: http://localhost:8000/docs")

    # Test 3: OpenAPI Schema
    response = test_endpoint("GET", f"{BASE_URL}/openapi.json", description="OpenAPI Schema")
    if response and response.json():
        schema = response.json()
        endpoints = list(schema.get("paths", {}).keys())
        print(f"📋 Available endpoints: {len(endpoints)}")

    print("\n🎉 Backend is healthy and responding!")
    print("\n📝 Next steps:")
    print("1. Add an OpenAI API key through the UI or API")
    print("2. Start chatting with AI models")
    print("3. Configure MCP servers for enhanced functionality")
    print("\n📖 Full documentation: http://localhost:8000/docs")

if __name__ == "__main__":
    main()
