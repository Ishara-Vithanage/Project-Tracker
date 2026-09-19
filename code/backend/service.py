from repository import DynamoRepository
from response import ResponseHelper

class WorkspaceService:
    def __init__(self):
        self.repo = DynamoRepository()

    # --- Login ---
    def login_user(self, body: dict):
        user_id = body.get("userId")
        input_password = body.get("password")
        if not user_id or not input_password:
            return ResponseHelper.send(400, {"error": "userId and password are required"})
        item = self.repo.get_user(user_id)
        if not item:
            return ResponseHelper.send(401, {"error": "Invalid userId or password"})
        user_status = item.get("status")
        if user_status != "active":
            return ResponseHelper.send(401, {"error": "User is inactive"})
        stored_password = item.get("password")
        if stored_password != input_password:
            return ResponseHelper.send(401, {"error": "Invalid userId or password"})
        
        keys_to_remove = ["password", "SK", "PK"]
        for key in keys_to_remove:
            item.pop(key, None)

        return ResponseHelper.send(200, {
            "message": "Login successful",
            "user": item
        })
    
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

    def update_user(self, path_params: dict, body: dict):
        user_id = path_params.get("userId")
        self.repo.update_user(user_id, body)
        return ResponseHelper.send(200, {"message": "User updated successfully"})

    # --- Projects ---
    def create_project(self, body: dict):
        proj_id = body.get("projectId")
        if not proj_id:
            return ResponseHelper.send(400, {"error": "projectId is required"})
        self.repo.create_project(proj_id, body)
        return ResponseHelper.send(201, {"message": "Project created successfully"})

    def get_project(self, path_params: dict):
        proj_id = path_params.get("projectId")
        item = self.repo.get_project(proj_id)
        if not item:
            return ResponseHelper.send(404, {"error": "Project not found"})
        return ResponseHelper.send(200, item)

    def update_project(self, path_params: dict, body: dict):
        proj_id = path_params.get("projectId")
        self.repo.update_project(proj_id, body)
        return ResponseHelper.send(200, {"message": "Project updated successfully"})

    # --- Tasks ---
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