import json
from router import Router
from response import ResponseHelper

# Instantiate outside the handler to reuse connection pools across warm invokes
router = Router()

def lambda_handler(event, context):
    http_ctx = event.get("requestContext", {}).get("http", {})
    http_method = http_ctx.get("method")
    path = http_ctx.get("path", "")
    path_params = event.get("pathParameters") or {}

    if http_method == "OPTIONS":
        return ResponseHelper.send(204, {})

    try:
        body = json.loads(event.get("body", "{}")) if event.get("body") else {}
    except json.JSONDecodeError:
        return ResponseHelper.send(400, {"error": "Invalid JSON body"})

    try:
        return router.route(http_method, path, path_params, body)
    except Exception as e:
        return ResponseHelper.send(500, {"error": str(e)})