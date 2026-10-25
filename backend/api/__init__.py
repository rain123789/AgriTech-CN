from flask import Blueprint, g, request
from functools import wraps


def add_api_version_header(response):
    """Add API version header to all responses."""
    response.headers['X-API-Version'] = '1.0'
    return response


def deprecated_endpoint(message="This endpoint is deprecated"):
    """Decorator to mark endpoints as deprecated."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            response = f(*args, **kwargs)
            if hasattr(response, 'headers'):
                response.headers['X-Deprecated'] = 'true'
                response.headers['X-Deprecation-Message'] = message
            return response
        return decorated_function
    return decorator


def register_api(app):
    """注册已验证的 v1 API；实验性子模块保持按需加载，避免阻断主站启动。"""
    from .v1 import api_v1

    # Register v1 API
    app.register_blueprint(api_v1)
    
    # Add version header to all API responses
    @app.after_request
    def after_request(response):
        if request.path.startswith('/api/'):
            response = add_api_version_header(response)
        return response
    
    return app
