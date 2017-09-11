# -*- encoding: utf-8 -*-
from odoo.http import Controller, request, route


class TicketController(Controller):
    @route('/tickets', auth='user')
    def view_tickets(self, **kwargs):
        tickets = request.env['demo.ticket'].search([])
        return request.render('ticket_viewer.ticket_list', {'tickets': tickets})
