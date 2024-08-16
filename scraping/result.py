from typing import Any

'''
A simple result object for wrapping around requests
'''
class Result(object):
    def __init__(self, success: bool, message: str, value: Any = None) -> None:
        self.success = success
        self.message = message
        self.value   = value

    def __str__(self) -> str:
        status = 'success' if self.success else 'fail'
        return f'Result ({status}) \"{self.message}\"'

    @classmethod
    def Succeed(cls, message: str = 'Ok', value: Any = None) -> 'Result':
        return cls(True, message, value = value)

    @classmethod
    def Fail(cls, message: str, value: Any = None) -> 'Result':
        return cls(False, message, value = value)
