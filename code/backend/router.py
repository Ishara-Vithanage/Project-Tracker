from service import WorkspaceService
from response import ResponseHelper

class Router:
    def __init__(self):
        self.service = WorkspaceService()

    def route(self, method: str, path: str, path_params: dict, body: dict):
        # Login Endpoints
        if path == "/login" and method == "POST":
            return self.service.login_user(body)

        # User Endpoints
        if path == "/users" and method == "POST":
            return self.service.create_user(body)
        if path.startswith("/users/") and method == "GET":
            return self.service.get_user(path_params)
        if path.startswith("/users/") and method == "PUT":
            return self.service.update_user(path_params, body)

        # Task Endpoints (checked before generic /projects/ to avoid route collision)
        if "/tasks" in path:
            if method == "POST":
                return self.service.create_task(path_params, body)
            if method == "GET":
                return self.service.get_task(path_params)
            if method == "PUT":
                return self.service.update_task(path_params, body)

        # Project Endpoints
        if path == "/projects" and method == "POST":
            return self.service.create_project(body)
        if path.startswith("/projects/") and method == "GET":
            return self.service.get_project(path_params)
        if path.startswith("/projects/") and method == "PUT":
            return self.service.update_project(path_params, body)

        return ResponseHelper.send(404, {"error": f"Route not found: {method} {path}"})