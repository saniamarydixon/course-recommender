from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.dependencies import get_current_user
from app.models.user import User
from app.services.chatbot_service import ChatbotService
from pydantic import BaseModel
from typing import List, Optional
import time

router = APIRouter()

class ChatMessage(BaseModel):
    role: str  # 'user' or 'model' / 'assistant'
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    response: str
    suggestions: Optional[List[str]] = []
    powered_by: Optional[str] = None
    error: Optional[str] = None
    response_time_ms: Optional[float] = None

@router.post("/chat", response_model=ChatResponse)
def chat_with_bot(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    start_time = time.time()
    try:
        service = ChatbotService(db)
        
        # Convert history
        history = []
        for m in request.history:
            role = "model" if m.role in ["assistant", "model", "bot"] else "user"
            history.append({"role": role, "content": m.content})
            
        print(f"\n--- Chat API Call ---")
        print(f"User: {current_user.email}")
        try:
            print(f"Message: '{request.message}'")
        except Exception:
            pass
        
        # Call chat service
        response = service.chat(current_user, request.message, history)
        
        try:
            print(f"Response (first 100 chars): '{response[:100]}...'")
        except Exception:
            pass
            
        response_time_ms = round((time.time() - start_time) * 1000, 2)
        print(f"Response Time: {response_time_ms} ms")
        print(f"----------------------\n")
        
        return ChatResponse(
            response=response,
            suggestions=[
                "Browse all courses",
                "Show AI recommendations",
                "View learning paths"
            ],
            powered_by="Google Gemini",
            response_time_ms=response_time_ms
        )
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        # Return friendly message instead of 500 error
        return ChatResponse(
            response="🙏 I'm taking a quick break! Try again in a minute, or browse our courses! 💪",
            suggestions=[
                "Browse all courses",
                "AI recommendations",
                "Learning paths"
            ],
            powered_by="Local Fallback Engine",
            response_time_ms=round((time.time() - start_time) * 1000, 2)
        )

@router.get("/suggestions")
def get_suggestions(current_user: User = Depends(get_current_user)):
    return {
        "suggestions": [
            "What courses do you recommend for me?",
            "Help me create a learning path",
            "What should I learn first?",
            "Suggest courses for career change",
            "How long does it take to learn programming?"
        ]
    }
