import os

from flask import Flask, send_file
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/")
def index():
    return "Hello, world!"

@app.route("/pano/<int:id>")
def pano(id: int):
    path = f"panos/{id}.jpg"
    if not os.path.isfile(path):
        return "No such image", 404
    return send_file(path)

app.run("0.0.0.0", port=8080)
