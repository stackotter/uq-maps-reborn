import os

from flask import Flask, send_file, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/")
def index():
    return "Hello, world!"

@app.route("/view/pano/<int:id>")
def view_pano(id: int):
    yaw = request.args.get("yaw") or 0
    pitch = request.args.get("pitch") or 0
    return """
    <!DOCTYPE HTML>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>A simple example</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css"/>
        <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js"></script>
        <style>
            html, body {
                margin: 0;
            }

            #panorama {
                width: 100%%;
                height: 100vh;
            }
        </style>
    </head>
    <body>

    <div id="panorama"></div>
    <script>
    pannellum.viewer('panorama', {
        "type": "equirectangular",
        "panorama": "/pano/%d",
        "autoLoad": true,
        "yaw": %s,
        "pitch": %s
    });
    </script>

    </body>
    </html>
    """ % (id, yaw, pitch)

@app.route("/pano/<int:id>")
def pano(id: int):
    path = f"panos/{id}.jpg"
    if not os.path.isfile(path):
        return "No such image", 404
    return send_file(path)

app.run("0.0.0.0", port=8080)
