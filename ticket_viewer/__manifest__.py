# -*- encoding: utf-8 -*-
{
    'name': 'Ticket Viewer',
    'version': '1.0',
    'author': 'Damien Bouvy',
    'website': 'https://www.damienbouvy.be',
    'summary': 'Demo a WebApp to view tickets online',
    'depends': ['web', 'base_setup', 'bus'],
    'description': """
Ticket Viewer Demo
==================
View & submit support tickets online.
Odoo Experience 2017 demo of the Odoo Javascript Framework.
""",
    "data": [
        "views/ticket_views.xml",
        "views/ticket_templates.xml",
        "data/ir.model.access.csv",
        "data/ticket_security.xml",
    ],
    "demo": [
        "demo/ticket_demo.xml",
    ],
    'installable': True,
    'application': True,
    'license': 'LGPL-3',
}
