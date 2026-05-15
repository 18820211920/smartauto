#!/usr/bin/env python3
"""创建初始数据"""
import sys
sys.path.insert(0, '/var/www/smartauto/backend/src')

from database import SessionLocal, init_db
from modules.sys_tenant.models import Tenant
from modules.sys_user.models import User
from modules.sales.v1.models.customer import Customer, CustomerLevel, CustomerType, CustomerStatus

# 初始化数据库
init_db()
db = SessionLocal()

try:
    # 检查是否已有数据
    tenant = db.query(Tenant).first()
    if not tenant:
        tenant = Tenant(
            code="LGA",
            name="鲁工自动化",
            creator_id=1
        )
        db.add(tenant)
        db.commit()
        print(f"✓ 创建租户: {tenant.name}")
    
    # 创建用户
    user = db.query(User).first()
    if not user:
        user = User(
            tenant_id=1,
            username="admin",
            password="$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4d7N3QXYFKlOcqGe",  # password123
            real_name="系统管理员",
            status="active",
            creator_id=1
        )
        db.add(user)
        db.commit()
        print(f"✓ 创建用户: {user.username}")
    
    # 创建客户数据
    customers = db.query(Customer).count()
    if customers == 0:
        customer_list = [
            Customer(tenant_id=1, name="华为技术有限公司", short_name="华为", level=CustomerLevel.A, type=CustomerType.ACTIVE, status=CustomerStatus.ACTIVE, industry="通信设备", contact_name="李工", contact_phone="13800138000", owner_id=1, creator_id=1),
            Customer(tenant_id=1, name="比亚迪股份有限公司", short_name="比亚迪", level=CustomerLevel.A, type=CustomerType.ACTIVE, status=CustomerStatus.ACTIVE, industry="新能源汽车", contact_name="王经理", contact_phone="13800138001", owner_id=1, creator_id=1),
            Customer(tenant_id=1, name="宁德时代新能源", short_name="宁德时代", level=CustomerLevel.A, type=CustomerType.ACTIVE, status=CustomerStatus.ACTIVE, industry="动力电池", contact_name="陈总", contact_phone="13800138002", owner_id=1, creator_id=1),
            Customer(tenant_id=1, name="欣旺达电子", short_name="欣旺达", level=CustomerLevel.B, type=CustomerType.POTENTIAL, status=CustomerStatus.ACTIVE, industry="消费电池", contact_name="张工", contact_phone="13800138003", owner_id=1, creator_id=1),
            Customer(tenant_id=1, name="亿纬锂能", short_name="亿纬锂能", level=CustomerLevel.B, type=CustomerType.POTENTIAL, status=CustomerStatus.ACTIVE, industry="动力电池", contact_name="刘工", contact_phone="13800138004", owner_id=1, creator_id=1),
        ]
        for c in customer_list:
            db.add(c)
        db.commit()
        print(f"✓ 创建 {len(customer_list)} 个客户")
    
    print("✓ 初始化完成!")
except Exception as e:
    import traceback
    print(f"Error: {e}")
    traceback.print_exc()
    db.rollback()
finally:
    db.close()
