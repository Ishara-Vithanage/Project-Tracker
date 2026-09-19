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
        response = self.table.get_item(
            Key={"PK": f"USER#{user_id}", "SK": "METADATA"}
        )
        return response.get("Item")

    def get_user_for_login(self, user_input: str):
        response = self.table.scan(
            FilterExpression=Attr("userId").eq(user_input)
        )
        items = response.get("Items", [])
        while response.get("LastEvaluatedKey") and not items:
            response = self.table.scan(
                FilterExpression=Attr("userId").eq(user_input),
                ExclusiveStartKey=response["LastEvaluatedKey"]
            )
            items.extend(response.get("Items", []))
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
    def _scan_all(self, filter_expression):
        items = []
        response = self.table.scan(FilterExpression=filter_expression)
        items.extend(response.get("Items", []))
        while response.get("LastEvaluatedKey"):
            response = self.table.scan(
                FilterExpression=filter_expression,
                ExclusiveStartKey=response["LastEvaluatedKey"]
            )
            items.extend(response.get("Items", []))
        return items

    def get_projects(self):
        return self._scan_all(Attr("PK").begins_with("PROJECT#") & Attr("SK").eq("METADATA"))

    def get_projects_by_attribute(self, attribute: str, value: str):
        return self._scan_all(
            Attr("PK").begins_with("PROJECT#") & Attr("SK").eq("METADATA") & Attr(attribute).eq(value)
        )

    def get_projects_by_developer(self, developer: str):
        project_ids = {item.get("PK") for item in self.get_tasks_by_attribute("developer", developer)}
        return [item for item in self.get_projects() if item.get("PK") in project_ids]

    def delete_project(self, proj_id: str):
        return self.table.delete_item(Key={"PK": f"PROJECT#{proj_id}", "SK": "METADATA"})

    def create_project(self, proj_id: str, data: dict):
        item = {
            "PK": f"PROJECT#{proj_id}",
            "SK": "METADATA",
            "projectID": proj_id,
            "name": data.get("name", data.get("projectName")),
            "projectName": data.get("projectName"),
            "businessUnit": data.get("businessUnit"),
            "manager": data.get("manager"),
            "startDate": data.get("startDate"),
            "endDate": data.get("endDate", data.get("targetDate")),
            "targetDate": data.get("targetDate"),
            "description": data.get("description"),
            "nature": data.get("nature"),
            "createDate": data.get("createDate"),
            "finishDate": data.get("finishDate", data.get("completeDate")),
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
            UpdateExpression="SET #n = :name, #b = :businessUnit, #m = :manager, #s = :status",
            ExpressionAttributeNames={"#n": "name", "#b": "businessUnit", "#m": "manager", "#s": "status"},
            ExpressionAttributeValues={
                ":name": data.get("name", data.get("projectName")),
                ":businessUnit": data.get("businessUnit"),
                ":manager": data.get("manager"),
                ":status": data.get("status")
            }
        )

    # --- Independent Task Operations ---
    def get_tasks(self):
        return self._scan_tasks()

    def get_tasks_by_attribute(self, attribute: str, value: str):
        return self._scan_tasks(FilterExpression=Attr(attribute).eq(value))

    def get_tasks_by_manager(self, manager: str):
        project_keys = {
            project["PK"]
            for project in self.get_projects_by_attribute("manager", manager)
        }
        return [task for task in self.get_tasks() if task.get("PK") in project_keys]

    def _scan_tasks(self, FilterExpression=None):
        task_filter = Attr("PK").begins_with("PROJECT#") & Attr("SK").begins_with("TASK#")
        if FilterExpression is not None:
            task_filter = task_filter & FilterExpression

        items = []
        scan_args = {"FilterExpression": task_filter}
        response = self.table.scan(**scan_args)
        items.extend(response.get("Items", []))
        while response.get("LastEvaluatedKey"):
            response = self.table.scan(
                ExclusiveStartKey=response["LastEvaluatedKey"],
                **scan_args
            )
            items.extend(response.get("Items", []))
        return items

    def create_independent_task(self, task_id: str, data: dict):
        project_id = data.get("projectID") or data.get("projectId")
        item = {
            "PK": f"PROJECT#{project_id}",
            "SK": f"TASK#{task_id}",
            "Task_ID": task_id,
            "name": data.get("name"),
            "description": data.get("description"),
            "developer": data.get("developer"),
            "manager": data.get("manager"),
            "projectID": project_id,
            "status": data.get("status"),
            "createDate": data.get("createDate"),
            "targetDate": data.get("targetDate")
        }
        return self.table.put_item(Item=item)

    def get_independent_task(self, task_id: str):
        items = self._scan_tasks(FilterExpression=Attr("SK").eq(f"TASK#{task_id}"))
        return items[0] if items else None

    def update_independent_task(self, item: dict, data: dict):
        return self.table.update_item(
            Key={"PK": item["PK"], "SK": item["SK"]},
            UpdateExpression="SET #n = :name, #d = :description, #dev = :developer, #m = :manager, #p = :projectID, #s = :status, #c = :createDate, #t = :targetDate",
            ExpressionAttributeNames={
                "#n": "name", "#d": "description", "#dev": "developer",
                "#m": "manager", "#p": "projectID", "#s": "status",
                "#c": "createDate", "#t": "targetDate"
            },
            ExpressionAttributeValues={
                ":name": data.get("name"),
                ":description": data.get("description"),
                ":developer": data.get("developer"),
                ":manager": data.get("manager"),
                ":projectID": data.get("projectID"),
                ":status": data.get("status"),
                ":createDate": data.get("createDate"),
                ":targetDate": data.get("targetDate")
            }
        )

    def delete_independent_task(self, item: dict):
        return self.table.delete_item(Key={"PK": item["PK"], "SK": item["SK"]})

    # --- Legacy project-scoped Task Operations ---
    def create_task(self, proj_id: str, task_id: str, data: dict):
        item = {
            "PK": f"PROJECT#{proj_id}",
            "SK": f"TASK#{task_id}",
            "Task_ID": task_id,
            "projectID": proj_id,
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