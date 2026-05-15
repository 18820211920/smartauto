"""数据库配置"""
import sys
import os
from pathlib import Path

# 添加 src 目录到 Python 路径
BASE_DIR = Path(__file__).resolve().parent
SRC_DIR = BASE_DIR / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 数据库配置
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./smartauto.db")

# 创建引擎
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    echo=False,
    pool_pre_ping=True
)

# 会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# Base类
Base = declarative_base()

def get_db():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """初始化数据库表"""
    # 导入所有模型
    try:
        from modules.sys_tenant.models import Tenant
    except:
        pass
    
    try:
        from modules.sys_user.models import User
    except:
        pass
    
    try:
        from modules.sys_role.models import Role
    except:
        pass
    
    try:
        from modules.sales.v1.models.customer import Customer, CustomerContact, CustomerFollowUp
    except:
        pass
    
    try:
        from modules.sales.v1.models.business import Business
    except:
        pass
    
    try:
        from modules.sales.v1.models.quote import Quote
    except:
        pass
    
    try:
        from modules.sales.v1.models.contract import Contract
    except:
        pass
    
    try:
        from modules.sales.v1.models.order import SaleOrder
    except:
        pass
    
    # 创建所有表
    Base.metadata.create_all(bind=engine)
