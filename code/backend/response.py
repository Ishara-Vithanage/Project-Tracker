import json

class ResponseHelper:
    @staticmethod
    def send(status_code: int, body: dict):
        return {
            "statusCode": status_code,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(body)
        }