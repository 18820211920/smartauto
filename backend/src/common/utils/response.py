"""统一响应工具"""
from typing import Any, Optional, List, Dict
from fastapi.responses import JSONResponse
from fastapi import HTTPException

def success_res(data: Any = None, message: str = "操作成功", code: int = 200) -> JSONResponse:
    """成功响应"""
    return JSONResponse(
        content={
            "code": code,
            "message": message,
            "data": data
        },
        status_code=code
    )

def error_res(message: str = "操作失败", code: int = 400, errors: Optional[List] = None) -> JSONResponse:
    """错误响应"""
    content = {
        "code": code,
        "message": message
    }
    if errors:
        content["errors"] = errors
    return JSONResponse(content=content, status_code=code)

def not_found_res(resource: str = "资源") -> JSONResponse:
    """404响应"""
    return error_res(message=f"{resource}不存在", code=404)

def unauthorized_res(message: str = "未授权") -> JSONResponse:
    """401响应"""
    return error_res(message=message, code=401)

def forbidden_res(message: str = "禁止访问") -> JSONResponse:
    """403响应"""
    return error_res(message=message, code=403)

def page_res(items: List, total: int, page: int, page_size: int) -> Dict:
    """分页响应"""
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }

def api_result(data: Any = None, message: str = "success"):
    """统一API结果格式"""
    return {"code": 200, "message": message, "data": data}
