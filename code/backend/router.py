from service import WorkspaceService
from response import ResponseHelper

class Router:
    def __init__(self):
        self.service = WorkspaceService()

    def route(self, method: str, path: str, path_params: dict, body: dict):
        # User Endpoints
        if path == "/users" and method == "POST":
            return self.service.create_user(body)
        if path.startswith("/users/by-user-id/") and method == "GET":
            return self.service.get_user_by_user_id(path_params)
        if path.startswith("/users/") and method == "GET":
            return self.service.get_user(path_params)
        if path.startswith("/users/") and method == "PUT":
            return self.service.update_user(path_params, body)

        # Independent task endpoints.
        if path == "/tasks" and method == "GET":
            return self.service.get_tasks()
        if path == "/tasks" and method == "POST":
            return self.service.create_independent_task(body)
        if path.startswith("/tasks/by-manager/") and method == "GET":
            return self.service.get_tasks_by_manager(path_params)
        if path.startswith("/tasks/by-developer/") and method == "GET":
            return self.service.get_tasks_by_developer(path_params)
        if path.startswith("/tasks/") and method == "GET":
            return self.service.get_independent_task(path_params)
        if path.startswith("/tasks/") and method == "PUT":
            return self.service.update_independent_task(path_params, body)
        if path.startswith("/tasks/") and method == "DELETE":
            return self.service.delete_independent_task(path_params)

        # Legacy project-scoped task endpoints.
        if "/tasks" in path:
            if method == "POST":
                return self.service.create_task(path_params, body)
            if method == "GET":
                return self.service.get_task(path_params)
            if method == "PUT":
                return self.service.update_task(path_params, body)

        # Project Endpoints
        if path == "/projects" and method == "GET":
            return self.service.get_projects()
        if path == "/projects" and method == "POST":
            return self.service.create_project(body)
        if path.startswith("/projects/by-manager/") and method == "GET":
            return self.service.get_projects_by_manager(path_params)
        if path.startswith("/projects/by-developer/") and method == "GET":
            return self.service.get_projects_by_developer(path_params)
        if path.startswith("/projects/by-department/") and method == "GET":
            return self.service.get_projects_by_department(path_params)
        if path.startswith("/projects/") and method == "GET":
            return self.service.get_project(path_params)
        if path.startswith("/projects/") and method == "PUT":
            return self.service.update_project(path_params, body)
        if path.startswith("/projects/") and method == "DELETE":
            return self.service.delete_project(path_params)

        return ResponseHelper.send(404, {"error": f"Route not found: {method} {path}"})