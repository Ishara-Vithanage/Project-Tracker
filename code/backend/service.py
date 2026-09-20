from repository import DynamoRepository
from response import ResponseHelper

class WorkspaceService:
    def __init__(self):
        self.repo = DynamoRepository()

    def create_user(self, body: dict):
        user_id = body.get("userId")
        if not user_id:
            return ResponseHelper.send(400, {"error": "userId is required"})
        self.repo.create_user(user_id, body)
        return ResponseHelper.send(201, {"message": "User created successfully"})

    def get_user(self, path_params: dict):
        user_id = path_params.get("userId")
        item = self.repo.get_user(user_id)
        if not item:
            return ResponseHelper.send(404, {"error": "User not found"})
        # Remove sensitive password field
        item.pop("password", None)
        return ResponseHelper.send(200, item)

    def get_user_by_user_id(self, path_params: dict):
        user_id = path_params.get("userId")
        if not user_id:
            return ResponseHelper.send(400, {"error": "userId is required"})

        item = self.repo.get_user_by_user_id(user_id)
        if not item:
            return ResponseHelper.send(404, {"error": "User not found"})

        item.pop("password", None)
        return ResponseHelper.send(200, item)

    def update_user(self, path_params: dict, body: dict):
        user_id = path_params.get("userId")
        self.repo.update_user(user_id, body)
        return ResponseHelper.send(200, {"message": "User updated successfully"})

    # --- Projects ---
    @staticmethod
    def _project_response(item: dict):
        return {
            "projectID": item.get("projectID") or item.get("PK", "").replace("PROJECT#", ""),
            "name": item.get("name", item.get("projectName")),
            "businessUnit": item.get("businessUnit"),
            "manager": item.get("manager"),
            "startDate": item.get("startDate"),
            "endDate": item.get("endDate", item.get("targetDate")),
            "description": item.get("description"),
            "nature": item.get("nature"),
            "createDate": item.get("createDate"),
            "finishDate": item.get("finishDate", item.get("completeDate")),
            "status": item.get("status"),
            "tasks": item.get("tasks", [])
        }

    def get_projects(self):
        return ResponseHelper.send(200, [self._project_response(item) for item in self.repo.get_projects()])

    def get_projects_by_manager(self, path_params: dict):
        manager = path_params.get("manager") or path_params.get("managerID")
        items = self.repo.get_projects_by_attribute("manager", manager)
        return ResponseHelper.send(200, [self._project_response(item) for item in items])

    def get_projects_by_developer(self, path_params: dict):
        developer = path_params.get("developer") or path_params.get("devID")
        items = self.repo.get_projects_by_developer(developer)
        return ResponseHelper.send(200, [self._project_response(item) for item in items])

    def get_projects_by_department(self, path_params: dict):
        business_unit = path_params.get("businessUnit") or path_params.get("department")
        items = self.repo.get_projects_by_attribute("businessUnit", business_unit)
        return ResponseHelper.send(200, [self._project_response(item) for item in items])

    def create_project(self, body: dict):
        proj_id = body.get("projectId") or body.get("projectID")
        if not proj_id:
            return ResponseHelper.send(400, {"error": "projectId is required"})
        self.repo.create_project(proj_id, body)
        return ResponseHelper.send(201, {"message": "Project created successfully"})

    def get_project(self, path_params: dict):
        proj_id = path_params.get("projectId")
        item = self.repo.get_project(proj_id)
        if not item:
            return ResponseHelper.send(404, {"error": "Project not found"})
        return ResponseHelper.send(200, self._project_response(item))

    def update_project(self, path_params: dict, body: dict):
        proj_id = path_params.get("projectId")
        self.repo.update_project(proj_id, body)
        return ResponseHelper.send(200, {"message": "Project updated successfully"})

    def delete_project(self, path_params: dict):
        proj_id = path_params.get("projectId")
        if not self.repo.get_project(proj_id):
            return ResponseHelper.send(404, {"error": "Project not found"})
        self.repo.delete_project(proj_id)
        return ResponseHelper.send(200, {"message": "Project deleted successfully"})

    # --- Independent Tasks ---
    @staticmethod
    def _task_response(item: dict):
        task_id = (
            item.get("Task_ID")
            or item.get("task_ID")
            or item.get("taskId")
            or item.get("SK", "").replace("TASK#", "")
        )
        project_id = item.get("projectID") or item.get("PK", "").replace("PROJECT#", "")
        return {
            "Task_ID": task_id,
            "name": item.get("name"),
            "description": item.get("description"),
            "developer": item.get("developer"),
            "projectID": project_id,
            "manager": item.get("manager"),
            "status": item.get("status"),
            "createDate": item.get("createDate"),
            "targetDate": item.get("targetDate")
        }

    def get_tasks(self):
        items = self.repo.get_tasks()
        return ResponseHelper.send(200, [self._task_response(item) for item in items])

    def get_tasks_by_manager(self, path_params: dict):
        manager = path_params.get("manager") or path_params.get("managerID")
        items = self.repo.get_tasks_by_manager(manager)
        return ResponseHelper.send(200, [self._task_response(item) for item in items])

    def get_tasks_by_developer(self, path_params: dict):
        developer = path_params.get("developer") or path_params.get("devID")
        items = self.repo.get_tasks_by_attribute("developer", developer)
        return ResponseHelper.send(200, [self._task_response(item) for item in items])

    def create_independent_task(self, body: dict):
        task_id = body.get("Task_ID") or body.get("task_ID") or body.get("taskId")
        project_id = body.get("projectID") or body.get("projectId")
        if task_id is None or not project_id:
            return ResponseHelper.send(400, {"error": "Task_ID and projectID are required"})
        self.repo.create_independent_task(str(task_id), body)
        return ResponseHelper.send(201, {"message": "Task created successfully"})

    def get_independent_task(self, path_params: dict):
        task_id = path_params.get("taskId") or path_params.get("Task_ID")
        item = self.repo.get_independent_task(str(task_id))
        if not item:
            return ResponseHelper.send(404, {"error": "Task not found"})
        return ResponseHelper.send(200, self._task_response(item))

    def update_independent_task(self, path_params: dict, body: dict):
        task_id = path_params.get("taskId") or path_params.get("Task_ID")
        item = self.repo.get_independent_task(str(task_id))
        if not item:
            return ResponseHelper.send(404, {"error": "Task not found"})
        self.repo.update_independent_task(item, body)
        return ResponseHelper.send(200, {"message": "Task updated successfully"})

    def delete_independent_task(self, path_params: dict):
        task_id = path_params.get("taskId") or path_params.get("Task_ID")
        item = self.repo.get_independent_task(str(task_id))
        if not item:
            return ResponseHelper.send(404, {"error": "Task not found"})
        self.repo.delete_independent_task(item)
        return ResponseHelper.send(200, {"message": "Task deleted successfully"})

    # --- Legacy project-scoped Tasks ---
    def create_task(self, path_params: dict, body: dict):
        proj_id = path_params.get("projectId")
        task_id = body.get("taskId")
        if not task_id or not proj_id:
            return ResponseHelper.send(400, {"error": "projectId and taskId are required"})
        self.repo.create_task(proj_id, task_id, body)
        return ResponseHelper.send(201, {"message": "Task created successfully"})

    def get_task(self, path_params: dict):
        proj_id = path_params.get("projectId")
        task_id = path_params.get("taskId")
        item = self.repo.get_task(proj_id, task_id)
        if not item:
            return ResponseHelper.send(404, {"error": "Task not found"})
        return ResponseHelper.send(200, item)

    def update_task(self, path_params: dict, body: dict):
        proj_id = path_params.get("projectId")
        task_id = path_params.get("taskId")
        self.repo.update_task(proj_id, task_id, body)
        return ResponseHelper.send(200, {"message": "Task updated successfully"})