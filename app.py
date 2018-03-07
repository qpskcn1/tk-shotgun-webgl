#!/usr/bin/env python
# -*- coding: UTF-8 -*-
import sys
import os
import traceback

from tank.platform import Application
import sgtk

import webbrowser

BASE_PATH = os.path.dirname(__file__)
sys.path.append(BASE_PATH)
from server import TempServer


class WebGLReview(Application):

    def init_app(self):
        """
        App entry point
        """
        # make sure that the context has an entity associated - otherwise it wont work!
        if self.context.entity is None:
            raise tank.TankError("Your current context does not have an entity (e.g. "
                                 "a current Shot, current Asset etc). This app requires "
                                 "an entity as part of the context in order to work.")
        display_name = self.get_setting('display_name') or 'Review in WebGL'
        self.engine.register_command('Review in WebGL', self.run_app,
                                     {
                                         'short_name': 'tk-shotgun-webgl',
                                         'title': display_name,
                                         'supports_multiple_selection': False,
                                         "entity_types": ["Version"]
                                     })

    @property
    def context_change_allowed(self):
        """
        Specifies that context changes are allowed.
        """
        return True

    def destroy_app(self):
        """
        App teardown
        """
        self.log_debug("Destroying tk-shotgun-webgl")
        try:
            sgtk.util.filesystem.safe_delete_file(self.tmp_file_path)
        except Exception as e:
            self.log_warning(e)


    def run_app(self):
        """
        Callback from when the menu is clicked.
        """

        if self.context.entity.get("type") == "Version":
            self.version_id = self.context.entity.get("id")
            filters = [['id', 'is', self.version_id]]
            fields = ['code', 'sg_uploaded_movie', 'sg_path_to_movie']
            version = self.shotgun.find_one('Version', filters, fields)
            self.tmp_file_path = os.path.join(BASE_PATH, "tmp", version["sg_uploaded_movie"]["name"])
            self.shotgun.download_attachment(version["sg_uploaded_movie"], 
                                             file_path=self.tmp_file_path)
            temp_server = TempServer(self, 8000)
            temp_server.start()
            webbrowser.open("http://localhost:8000?file=tmp/%s" % version["sg_uploaded_movie"]["name"])
