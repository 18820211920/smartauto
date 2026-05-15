"""SmartAuto 主应用"""
import sys
import os
from pathlib import Path

# 添加 src 目录到 Python 路径
BASE_DIR = Path(__file__).resolve().parent
SRC_DIR = BASE_DIR / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# 创建FastAPI应用
app = FastAPI(
    title="SmartAuto ERP",
    description="非标自动化设备公司全流程管理系统",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 全局异常处理
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "code": 500,
            "message": f"服务器错误: {str(exc)}",
            "data": None
        }
    )

# 健康检查
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "SmartAuto ERP"}

# 启动事件
@app.on_event("startup")
async def startup_event():
    # 初始化数据库
    from database import init_db
    try:
        init_db()
        print("数据库初始化完成")
    except Exception as e:
        print(f"数据库初始化失败: {e}")

# 注册路由
def register_routers():
    """注册所有模块路由"""
    
    # 租户管理
    try:
        from modules.sys_tenant.router import router as tenant_router
        app.include_router(tenant_router, prefix="/api/v1/tenant", tags=["租户管理"])
        print("✓ 租户路由注册成功")
    except Exception as e:
        print(f"租户路由注册失败: {e}")
    
    # 用户管理
    try:
        from modules.sys_user.router import router as user_router
        app.include_router(user_router, prefix="/api/v1/user", tags=["用户管理"])
        print("✓ 用户路由注册成功")
    except Exception as e:
        print(f"用户路由注册失败: {e}")
    
    # 角色管理
    try:
        from modules.sys_role.router import router as role_router
        app.include_router(role_router, prefix="/api/v1/role", tags=["角色管理"])
        print("✓ 角色路由注册成功")
    except Exception as e:
        print(f"角色路由注册失败: {e}")
    
    # 套餐管理
    try:
        from modules.sys_package.router import router as package_router
        app.include_router(package_router, prefix="/api/v1/package", tags=["套餐管理"])
        print("✓ 套餐路由注册成功")
    except Exception as e:
        print(f"套餐路由注册失败: {e}")
    
    # 销售管理
    try:
        from modules.sales.v1.router import router as sales_router
        app.include_router(sales_router, prefix="/api/v1/sales", tags=["销售管理"])
        print("✓ 销售路由注册成功")
    except Exception as e:
        print(f"销售路由注册失败: {e}")
    
    # AI对话
    try:
        from modules.ai_gateway.ai_chat import router as ai_router
        app.include_router(ai_router, prefix="/api/v1/ai", tags=["AI对话"])
        print("✓ AI路由注册成功")
    except Exception as e:
        print(f"AI路由注册失败: {e}")

# 注册路由
register_routers()

# 运行
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
