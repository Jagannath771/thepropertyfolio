import asyncio
import os
import sys

# Add the parent directory to sys.path to import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import AsyncSessionLocal
from app.models.user import User
from sqlalchemy import select

async def view_users():
    print("\n" + "="*80)
    print(" THE PROPERTY FOLIO: ADMIN USER DIRECTORY")
    print("="*80 + "\n")
    
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).order_by(User.created_at.desc()))
        users = result.scalars().all()
        
        if not users:
            print("No users found in database.")
            return

        header = f"{'Email':<30} | {'Full Name':<20} | {'Role':<10} | {'Status':<10}"
        print(header)
        print("-" * len(header))
        
        for user in users:
            status = "Active" if user.is_active else "Inactive"
            print(f"{user.email:<30} | {user.full_name:<20} | {user.role:<10} | {status:<10}")
        
        print("\n" + "="*80)
        print("SECURITY NOTE: Passwords are encrypted as bcrypt hashes.")
        print("To see full details including hashes, run this in your terminal:")
        print("docker exec -it tpf_db psql -U tpf_user -d thepropertyfolio -c \"SELECT email, password_hash, role FROM users;\"")
        print("="*80 + "\n")

if __name__ == "__main__":
    asyncio.run(view_users())
