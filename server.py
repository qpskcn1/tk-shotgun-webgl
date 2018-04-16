from SimpleHTTPServer import SimpleHTTPRequestHandler
import SocketServer
import threading
import os

BASE_PATH = os.path.dirname(__file__)


class MyHandler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path.startswith('/kill_server'):
            self.server.running = False
    """This handler uses BASE_PATH instead of always using os.getcwd()"""
    def translate_path(self, path):
        path = SimpleHTTPRequestHandler.translate_path(self, path)
        relpath = os.path.relpath(path, os.getcwd())
        fullpath = os.path.join(BASE_PATH, relpath)
        print fullpath
        return fullpath

class TempServer(object):
    def __init__(self, app, port=8000):
        self._app = app
        self._server = SocketServer.TCPServer(('', port), MyHandler)
        self._thread = threading.Thread(target=self.run)
        self._thread.deamon = True 

    def run(self):
        self._server.running = True
        while self._server.running:
            self._server.handle_request()
        self.shut_down()

    def start(self):
        self._thread.start()

    def shut_down(self):
        self._app.destroy_app()
        self._thread.close()

# temp_server = TempServer()
# temp_server.start()
