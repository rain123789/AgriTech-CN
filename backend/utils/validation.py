import re

def sanitize_input(text, max_length=None):
    """移除 HTML 标签并限制长度，兼容原有单参数与路由中的双参数调用。"""
    if not text or not isinstance(text, str):
        return ""

    text = re.sub(r'<[^>]+>', '', text).strip()
    if max_length is not None:
        text = text[: int(max_length)]
    return text

def validate_required_fields(data, required_fields):
    """Validate that a mapping contains non-empty required fields."""
    if not isinstance(data, dict):
        return False, "Invalid request payload"

    for field in required_fields:
        value = data.get(field)
        if value is None or (isinstance(value, str) and not value.strip()):
            return False, f"Missing required field: {field}"
    return True, "Valid input"


def validate_input(data, required_fields=None):
    """Validate input data structure and optionally required fields."""
    if not isinstance(data, dict) or not data:
        return False, "No data provided"

    if required_fields:
        return validate_required_fields(data, required_fields)

    return True, "Valid input"


def validate_email(email, gmail_only=False):
    """验证常见合法邮箱。默认不再限制 Gmail，兼容中国大陆常用邮箱。"""
    if not isinstance(email, str):
        return False, "请输入邮箱地址"

    email = email.strip().lower()
    if not email:
        return False, "请输入邮箱地址"

    pattern = r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$'
    if len(email) > 254 or not re.match(pattern, email):
        return False, "请输入有效的邮箱地址"

    # 保留开关仅用于兼容历史调用；默认和本项目配置均不限制邮箱服务商。
    if gmail_only and not email.endswith("@gmail.com"):
        return False, "请使用 @gmail.com 邮箱地址"

    return True, "邮箱格式有效"


def validate_username(username, min_length=2, max_length=30):
    """验证用户名，支持中文、英文字母、数字及常用间隔符。"""
    if not isinstance(username, str):
        return False, "请输入用户名"

    username = username.strip()
    if not username:
        return False, "请输入用户名"

    if len(username) < min_length or len(username) > max_length:
        return False, f"用户名长度需为 {min_length}–{max_length} 个字符"

    if not re.match(r"^[\w\u4e00-\u9fff·._-]+$", username, re.UNICODE):
        return False, "用户名只能包含中文、字母、数字、点、下划线或连字符"

    return True, "用户名有效"


def validate_full_name(full_name, max_length=50):
    """验证真实姓名/昵称，支持中文姓名中的间隔号与少数民族姓名。"""
    if not isinstance(full_name, str):
        return False, "请输入姓名"

    full_name = full_name.strip()
    if not full_name:
        return False, "请输入姓名"

    if len(full_name) < 2 or len(full_name) > max_length:
        return False, f"姓名长度需为 2–{max_length} 个字符"

    if not re.fullmatch(r"[A-Za-z\u4e00-\u9fff\u3400-\u4dbf·.'’\-\s]+", full_name, re.UNICODE):
        return False, "姓名只能包含中文、字母、空格、间隔号、点号或连字符"

    return True, "姓名有效"


def validate_password_strength(password, min_length=8, require_special=False):
    """Validate password strength for auth forms."""
    if not isinstance(password, str) or not password:
        return False, "请输入密码"

    if len(password) < min_length:
        return False, f"密码至少需要 {min_length} 位字符"

    if not re.search(r'[a-z]', password):
        return False, "密码需要包含至少一个小写字母"

    if not re.search(r'[A-Z]', password):
        return False, "密码需要包含至少一个大写字母"

    if not re.search(r'\d', password):
        return False, "密码需要包含至少一个数字"

    if require_special and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "密码需要包含至少一个特殊字符"

    return True, "密码有效"


def validate_role(role, allowed_roles):
    """Validate that a role belongs to an allowed set."""
    if not isinstance(role, str):
        return False, "Role is required"

    normalized_role = role.strip().lower()
    if not normalized_role:
        return False, "Role is required"

    if normalized_role not in allowed_roles:
        return False, "Invalid role selected"

    return True, normalized_role


def validate_numeric_range(value, min_value=None, max_value=None, field_name="value"):
    """Validate a numeric input and enforce optional range checks."""
    try:
        number = float(str(value).strip())
    except (TypeError, ValueError):
        return False, f"{field_name} must be a number"

    if min_value is not None and number < min_value:
        return False, f"{field_name} must be at least {min_value}"

    if max_value is not None and number > max_value:
        return False, f"{field_name} must be at most {max_value}"

    return True, number
