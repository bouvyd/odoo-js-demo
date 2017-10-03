# -*- encoding: utf-8 -*-
from odoo.addons.bus.controllers.main import BusController
from odoo.http import request, route


class TicketController(BusController):
    def _poll(self, dbname, channels, last, options):
        """Add the relevant channels to the BusController polling."""
        if options.get('demo.ticket'):
            channels = list(channels)
            ticket_channel = (
                request.db,
                'demo.ticket',
                options.get('demo.ticket')
            )
            channels.append(ticket_channel)
        return super(TicketController, self)._poll(dbname, channels, last, options)

    @route(['/tickets', '/tickets/<path:route>'], auth='user')
    def view_tickets(self, **kwargs):
        tickets = request.env['demo.ticket'].search([])
        return request.render('ticket_viewer.ticket_list', {'tickets': tickets})
