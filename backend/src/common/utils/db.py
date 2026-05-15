"""数据库工具"""
from typing import Optional, List, Any
from sqlalchemy import and_, or_, func
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
import logging

logger = logging.getLogger(__name__)

class BaseRepo:
    """基础仓储"""
    
    def __init__(self, db: Session, model):
        self.db = db
        self.model = model
    
    def get_by_id(self, id: int, tenant_id: int) -> Optional[Any]:
        """根据ID查询"""
        return self.db.query(self.model).filter(
            and_(
                self.model.id == id,
                self.model.tenant_id == tenant_id
            )
        ).first()
    
    def get_list(self, tenant_id: int, skip: int = 0, limit: int = 20, **filters) -> List[Any]:
        """查询列表"""
        query = self.db.query(self.model).filter(self.model.tenant_id == tenant_id)
        
        for key, value in filters.items():
            if value is not None and hasattr(self.model, key):
                query = query.filter(getattr(self.model, key) == value)
        
        return query.offset(skip).limit(limit).all()
    
    def get_count(self, tenant_id: int, **filters) -> int:
        """统计数量"""
        query = self.db.query(func.count(self.model.id)).filter(self.model.tenant_id == tenant_id)
        
        for key, value in filters.items():
            if value is not None and hasattr(self.model, key):
                query = query.filter(getattr(self.model, key) == value)
        
        return query.scalar()
    
    def create(self, obj: Any, creator_id: int) -> Any:
        """创建"""
        obj.creator_id = creator_id
        obj.create_time = func.now()
        obj.update_time = func.now()
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj
    
    def update(self, obj: Any, updater_id: int, **kwargs) -> Any:
        """更新"""
        for key, value in kwargs.items():
            if hasattr(obj, key):
                setattr(obj, key, value)
        obj.updater_id = updater_id
        obj.update_time = func.now()
        self.db.commit()
        self.db.refresh(obj)
        return obj
    
    def delete(self, id: int, tenant_id: int) -> bool:
        """删除"""
        obj = self.get_by_id(id, tenant_id)
        if obj:
            self.db.delete(obj)
            self.db.commit()
            return True
        return False

def safe_db_commit(db: Session):
    """安全提交"""
    try:
        db.commit()
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"数据库提交失败: {e}")
        raise
