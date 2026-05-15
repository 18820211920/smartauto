"""
SmartAuto AI Gateway Server
Phase 2: AI基础能力 - AI对话/知识库/RAG服务
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

# 导入AI模块路由
from .modules.ai_gateway import chat_router, model_router, knowledge_router

# 创建FastAPI应用
app = FastAPI(
    title="SmartAuto AI Gateway",
    description="AI对话、知识库、RAG服务",
    version="1.0.0"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# 注册路由
app.include_router(chat_router, prefix="/api/v1")
app.include_router(model_router, prefix="/api/v1")
app.include_router(knowledge_router, prefix="/api/v1")

# 健康检查
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "ai-gateway", "version": "1.0.0"}

@app.get("/")
async def root():
    return {
        "name": "SmartAuto AI Gateway",
        "version": "1.0.0",
        "endpoints": {
            "chat": "/api/v1/ai/chat/send",
            "models": "/api/v1/ai/model/list",
            "knowledge": "/api/v1/ai/knowledge/base/list"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)