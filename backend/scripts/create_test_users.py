import asyncio
import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.database import AsyncSessionLocal
from app.models.user import User
from app.database import AsyncSessionLocal
from app.models.user import User
from app.services import auth_service
from sqlalchemy import select

async def create_test_users():
    async with AsyncSessionLocal() as session:
        # Check if users exist
        for email, role, name in [
            ('test_tenant@example.com', 'tenant', 'Test Tenant'),
            ('test_owner@example.com', 'owner', 'Test Owner')
        ]:
            res = await session.execute(select(User).where(User.email == email))
            if res.scalars().first():
                print(f"User {email} already exists.")
                continue
            
            user = User(
                email=email,
                full_name=name,
                role=role,
                password_hash=auth_service.hash_password('password123'),
                is_active=True,
                is_verified=True
            )
            session.add(user)
            print(f"Created {role}: {email}")
        
        await session.commit()

if __name__ == "__main__":
    asyncio.run(create_test_users())
