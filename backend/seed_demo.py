"""Seed a demo account and a ready DBMS lecture for demonstrations.

Run from the backend directory:  python seed_demo.py
Login with:  demo@lectureloop.app / demo1234
"""
import os

from fastapi.testclient import TestClient

from app.main import app

TRANSCRIPT = """00:00 In this lecture we study database normalization and why it matters.
00:20 Data redundancy is the unnecessary repetition of the same data in multiple places.
00:45 Data redundancy wastes storage and can cause update anomalies.
01:05 A functional dependency is a relationship between two attributes.
01:30 The left side of a functional dependency is called the determinant.
01:55 Normalization refers to the process of organizing data to reduce redundancy.
02:20 First Normal Form requires that every column contains atomic, indivisible values.
02:50 Second Normal Form removes partial dependencies on a composite key.
03:20 Third Normal Form removes transitive dependencies between non key attributes.
03:50 Boyce Codd Normal Form is a stronger version of the third normal form.
04:20 Keys are attributes that uniquely identify a row in a relation.
04:50 A primary key must be unique and cannot contain null values.
05:20 A foreign key references the primary key of another relation.
05:50 Normalization improves consistency but can increase the number of joins.
06:20 Denormalization is sometimes used to improve read performance.
06:50 Good schema design balances normalization with practical query needs.
"""

DEMO_EMAIL = "demo@lectureloop.app"
DEMO_PASSWORD = "demo1234"


def main() -> None:
    with TestClient(app) as client:
        reg = client.post(
            "/auth/register",
            json={"name": "Demo Student", "email": DEMO_EMAIL, "password": DEMO_PASSWORD},
        )
        if reg.status_code == 409:
            login = client.post(
                "/auth/login",
                json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD},
            )
            token = login.json()["access_token"]
            print("Demo account already exists — signing in.")
        else:
            reg.raise_for_status()
            token = reg.json()["access_token"]
            print("Created demo account.")

        headers = {"Authorization": f"Bearer {token}"}
        created = client.post(
            "/lectures",
            json={"transcript": TRANSCRIPT, "language": "en", "difficulty": "medium"},
            headers=headers,
        )
        created.raise_for_status()
        lecture = created.json()
        print(f"Seeded lecture #{lecture['id']}: {lecture['title']}")
        print(f"Status: {lecture['status']}")
        print(f"Login with {DEMO_EMAIL} / {DEMO_PASSWORD}")


if __name__ == "__main__":
    main()
