import os
import boto3
from boto3.dynamodb.conditions import Attr

class DynamoRepository:
    def __init__(self):
        table_name = os.environ.get("TABLE_NAME", "AppWorkspace")
        self.table = boto3.resource("dynamodb").Table(table_name)

    # --- User Operations ---
    def create_user(self, user_id: str, data: dict):
        item = {
            "PK": f"USER#{user_id}",
            "SK": "METADATA",
            "userID": user_id,
            "name": data.get("name"),
            "email": data.get("email"),
            "department": data.get("department"),
            "role": data.get("role"),
            "status": data.get("status"),
            "lastLogin": data.get("lastLogin")
        }
        return self.table.put_item(Item=item)

    # def get_user(self, user_id: str):
    #     res = self.table.get_item(Key={"PK": f"USER#{user_id}", "SK": "METADATA"})
    #     return res.get("Item")

    def get_user(self, user_id: str):
        response = self.table.scan(
            FilterExpression=Attr("userId").eq(user_id)
        )
        items = response.get("Items", [])
        return items[0] if items else None

    def update_user(self, user_id: str, data: dict):
        return self.table.update_item(
            Key={"PK": f"USER#{user_id}", "SK": "METADATA"},
            UpdateExpression="SET #n = :name, #e = :email",
            ExpressionAttributeNames={"#n": "name", "#e": "email"},
            ExpressionAttributeValues={
                ":name": data.get("name"),
                ":email": data.get("email")
            }
        )

    # --- Project Operations ---
    def create_project(self, proj_id: str, data: dict):
        item = {
            "PK": f"PROJECT#{proj_id}",
            "SK": "METADATA",
            "projectName": data.get("projectName"),
            "businessUnit": data.get("businessUnit"),
            "manager": data.get("manager"),
            "startDate": data.get("startDate"),
            "targetDate": data.get("targetDate"),
            "createDate": data.get("createDate"),
            "completeDate": data.get("completeDate"),
            "status": data.get("status")
        }
        return self.table.put_item(Item=item)

    def get_project(self, proj_id: str):
        res = self.table.get_item(Key={"PK": f"PROJECT#{proj_id}", "SK": "METADATA"})
        return res.get("Item")

    def update_project(self, proj_id: str, data: dict):
        return self.table.update_item(
            Key={"PK": f"PROJECT#{proj_id}", "SK": "METADATA"},
            UpdateExpression="SET #t = :title, #s = :status",
            ExpressionAttributeNames={"#t": "Title", "#s": "Status"},
            ExpressionAttributeValues={
                ":title": data.get("title"),
                ":status": data.get("status")
            }
        )

    # --- Task Operations ---
    def create_task(self, proj_id: str, task_id: str, data: dict):
        item = {
            "PK": f"PROJECT#{proj_id}",
            "SK": f"TASK#{task_id}",
            "name": data.get("name"),
            "description": data.get("description"),
            "developer": data.get("developer"),
            "createDate": data.get("createDate"),
            "targetDate": data.get("targetDate"),
            "status": data.get("status")
        }
        return self.table.put_item(Item=item)

    def get_task(self, proj_id: str, task_id: str):
        res = self.table.get_item(Key={"PK": f"PROJECT#{proj_id}", "SK": f"TASK#{task_id}"})
        return res.get("Item")

    def update_task(self, proj_id: str, task_id: str, data: dict):
        return self.table.update_item(
            Key={"PK": f"PROJECT#{proj_id}", "SK": f"TASK#{task_id}"},
            UpdateExpression="SET #t = :title, #s = :status, #a = :assigned",
            ExpressionAttributeNames={"#t": "Title", "#s": "Status", "#a": "AssignedTo"},
            ExpressionAttributeValues={
                ":title": data.get("title"),
                ":status": data.get("status"),
                ":assigned": data.get("assignedTo")
            }
        )