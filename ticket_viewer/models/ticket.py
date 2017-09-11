# -*- encoding: utf-8 -*-
from odoo import api, fields, models


class DemoTicket(models.Model):
    _name = 'demo.ticket'
    _description = 'Demo Ticket'

    name = fields.Char(required=True)
    description = fields.Text()
    partner_id = fields.Many2one('res.partner', string='Customer', required=True, default=lambda s: s.env.user.partner_id)

    @api.model
    def create(self, vals):
        ticket = super(DemoTicket, self).create(vals)
        (channel, message) = ((self._cr.dbname, 'demo.ticket', ticket.partner_id.id), ('new_ticket', ticket.id))
        self.env['bus.bus'].sendone(channel, message)
        return ticket

    def unlink(self):
        notifications = []
        for ticket in self:
            notifications.append(((self._cr.dbname, 'demo.ticket', ticket.partner_id.id), ('unlink_ticket', ticket.id)))
        self.env['bus.bus'].sendmany(notifications)
        return super(DemoTicket, self).unlink()
