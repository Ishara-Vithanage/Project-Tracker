import json

class ResponseHelper:
    @staticmethod
    def send(status_code: int, body: dict):
        return {
            "statusCode": status_code,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,DELETE",
            },
            "body": json.dumps(body)
        }