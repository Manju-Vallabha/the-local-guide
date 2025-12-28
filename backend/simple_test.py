from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["test"])

@router.get("/test")
async def test():
    return {"message": "test"}

print("Router created successfully!")
print(f"Router: {router}")