from fastapi.testclient import TestClient
import pytest
from app.main import app

client = TestClient(app)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert "Welcome" in response.json()["message"]

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

# We can mock other endpoints. Since a database is required, we do simple validation tests
def test_register_validation():
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "not-an-email", "password": "123", "role": "analyst"}
    )
    assert response.status_code == 422  # Pydantic validation error

def test_login_validation():
    response = client.post(
        "/api/v1/auth/login-json",
        json={"email": "not-an-email", "password": "123", "role": "analyst"}
    )
    assert response.status_code == 422
