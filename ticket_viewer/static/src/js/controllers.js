odoo.define('demo.views', function (require) {
'use strict';

var core = require('web.core');
var User = require('demo.classes').User;
var Widget = require('web.Widget');

var qweb = core.qweb;
var _t = core._t;

require('web.dom_ready');

var TicketApp = Widget.extend({
    template: 'ticket_viewer.app',
    xmlDependencies: ['/ticket_viewer/static/src/xml/ticket_views.xml'],
    /* Lifecycle */
    init: function (parent, options) {
        this._super.apply(this, arguments);
        this.user = new User({id: odoo.session_info.user_id});
    },
    willStart: function () {
        return $.when(this._super.apply(this, arguments),
                      this.user.fetchUserInfo(),
                      this.user.fetchAllTickets()
        );
    },
    start: function () {
        var self = this;
        return this._super.apply(this, arguments).then(function () {
            self.list = new TicketList(self, self.user.tickets);
            self.list.appendTo($('.o_ticket_list'));
        });
    },
});

var TicketList = Widget.extend({
    template: 'ticket_viewer.ticket_list',
    /* Lifecycle */
    init: function (parent, tickets) {
        this._super.apply(this, arguments);
        this.tickets = tickets;
    },
    /**
     * Rerender the whole widget; will be useful when we switch from
     * an empty list of tickets to one or more ticket (or vice-versa)
     * by using the bus.
     */
    _rerender: function () {
        this.replaceElement(qweb.render('ticket_viewer.ticket_list', {widget: this}));
    },
});


var $elem = $('.o_ticket_app');
var app = new TicketApp(null);
app.appendTo($elem);
});
