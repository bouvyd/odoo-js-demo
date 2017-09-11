# -*- encoding: utf-8 -*-
from odoo import fields, models


class DemoTicket(models.Model):
    _name = 'demo.ticket'
    _description = 'Demo Ticket'

    name = fields.Char(required=True)
    description = fields.Text()
    partner_id = fields.Many2one('res.partner', string='Customer', required=True, default=lambda s: s.env.user.partner_id)
