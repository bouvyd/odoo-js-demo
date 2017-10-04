odoo.define('demo.classes', function (require) {
'use strict';

var Class = require('web.Class');
var rpc = require('web.rpc');


/**
 * Ticket
 * Represent a demo.ticket object from the Odoo Backend
 * @type {OdooClass}
 */
var Ticket = Class.extend({
    init: function (values) {
        Object.assign(this, values);
    },
    /**
     * Fetch the latest fields for this particular ticket
     * on the backend server
     * @return {jQuery.Deferred} Resolves to the updated
     *                           Ticket if successful.
     */
    update: function () {
        var self = this;
        return rpc.query({
            model: 'demo.ticket',
            method: 'read',
            args: [[this.id]],
            kwargs: {fields: ['id', 'name', 'description']}
        }).then(function (ticket_values) {
            Object.assign(self, ticket_values[0]);
            return self;
        });
    },
});


/**
 * User
 * Represent a res.users from the Odoo Backend, with only
 * the fields [id, login, name, image_small] accessible by
 * default.
 * The User class also represent a Ticket collection.
 * @type {OdooClass}
 */
var User = Class.extend({
    init: function (values) {
        Object.assign(this, values);
        this.tickets = [];
    },
    /**
     * Create a ticket on the server via rpc call and create it
     * client-side in the User tickets' collection on success.
     * @param  {Object} values Object containing the 'name'
     *                         and 'description' content for
     *                         the new ticket
     * @return {jQuery.Deferred} The newly created ticket.
     */
    createTicket: function (values) {
        var self = this;
        var ticket_values = {
            name: values.name,
            description: values.description
        };
        return rpc.query({
            model: 'demo.ticket',
            method: 'create',
            args: [ticket_values]
        }).then(function (ticket_id) {
            var ticket = new Ticket({id: ticket_id});
            self.tickets.push(ticket);
            return ticket.update();
        });
    },
    /**
     * Fetch the default fields for the user on the server.
     * @return {jQuery.Deferred} Resolves to the udpate User.
     */
    fetchUserInfo: function () {
        var self = this;
        return rpc.query({
            model: 'res.users',
            method: 'read',
            args: [[this.id]],
            kwargs: {fields: ['id', 'login', 'name', 'image_small', 'partner_id']}
        }).then(function (user_values) {
            var values = user_values[0];
            values.partner_id = values.partner_id[0];
            Object.assign(self, values);
            return self;
        });
    },
    /**
     * Fetch all available tickets for the current user.
     * Note that the actual search is done server side
     * using the model's ACLs and Access Rules.
     * @return {jQuery.Deferred} Resolves to the udpated User
     *                           (with its Tickets collection
     *                           populated).
     */
    fetchAllTickets: function () {
        var self = this;
        return rpc.query({
            model: 'demo.ticket',
            method: 'search_read',
            args: [[]],
            kwargs: {fields: ['id', 'name', 'description']}
        }).then(function (ticket_values) {
            for (var vals of ticket_values) {
                self.tickets.push(new Ticket(vals));
            }
            return self;
        });
    },
    /**
     * Fetch a specified ticket id for the current user.
     * @param  {Integer} id ID of the ticket to fetch.
     * @return {jQuery.Deferred} Resolves to the new Ticket
     */
    fetchTicket: function (id) {
        var self = this;
        return rpc.query({
            model: 'demo.ticket',
            method: 'search_read',
            args: [[['id', '=', id]]],
            kwargs: {fields: ['id', 'name', 'description']}
        }).then(function (ticket_values) {
            if (ticket_values.length) {
                var ticket = new Ticket(ticket_values[0]);
                self.tickets.push(ticket);
            }
            return ticket;
        });
    },
    /**
     * Remove a specified ticket id from the collections.
     * @param  {Integer} id ID of the ticket to remove
     */
    removeTicket: function (id) {
        var t_idx = this.tickets.findIndex(t => t.id === id);
        if (t_idx !== -1) {
            this.tickets.splice(t_idx, 1);
        }
    },
});

return {
    Ticket: Ticket,
    User: User,
};
});