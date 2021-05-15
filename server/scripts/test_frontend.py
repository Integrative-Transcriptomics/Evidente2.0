from flask import Flask, request, jsonify, flash, redirect, abort, send_from_directory
from markupsafe import escape

app = Flask(__name__)

DOWNLOAD_DIRECTORY = "Syphilis"

@app.route('/get-files/<path:path>', methods=['GET', 'POST'])
def get_files(path):
    """Download a file."""
    try:
        return send_from_directory(DOWNLOAD_DIRECTORY, path, as_attachment=True)
    except FileNotFoundError:
        abort(404)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3001, threaded=True, debug=True)
