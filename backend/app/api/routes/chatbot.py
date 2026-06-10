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
            try:
                print(f"Message: '{request.message.encode('ascii', errors='replace').decode('ascii')}'")
            except Exception:
                pass
        
        # Call chat service
        response, used_gemini, err = service.chat(current_user, request.message, history)
        
        # Determine powered_by
        powered_by = "Google Gemini" if used_gemini else "Local Fallback Engine"
        if not used_gemini and err:
            try:
                print(f"Gemini API failure/bypass: {err}")
            except Exception:
                try:
                    print(f"Gemini API failure/bypass: {str(err).encode('ascii', errors='replace').decode('ascii')}")
                except Exception:
                    pass
            
        try:
            print(f"Response (first 100 chars): '{response[:100]}...'")
        except UnicodeEncodeError:
            try:
                print(f"Response (first 100 chars): '{response[:100].encode('ascii', errors='replace').decode('ascii')}...'")
            except Exception:
                pass
                
        print(f"Powered by: {powered_by}")
        
        # Default suggestions for next turn
        suggestions = [
            "What courses do you recommend for beginners?",
            "Tell me about Python courses",
            "What should I learn for web development?",
            "How can I become a data scientist?"
        ]
        
        response_time_ms = round((time.time() - start_time) * 1000, 2)
        print(f"Response Time: {response_time_ms} ms")
        print(f"----------------------\n")
        
        return ChatResponse(
            response=response,
            suggestions=suggestions[:3],
            powered_by=powered_by,
            error=err,
            response_time_ms=response_time_ms
        )
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
