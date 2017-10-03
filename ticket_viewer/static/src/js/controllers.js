odoo.define('demo.views', function (require) {
'use strict';

var bus = require('bus.bus').bus;
var core = require('web.core');
var Dialog = require('web.Dialog');
var notification = require('web.notification');
var User = require('demo.classes').User;
var Widget = require('web.Widget');
var Router = require('demo.router');

var qweb = core.qweb;
var _t = core._t;

require('web.dom_ready');

var TicketApp = Widget.extend({
    template: 'ticket_viewer.app',
    events: {
        'click .ticket_about': function (ev) {ev.preventDefault(); Router.navigate('/about');},
        'click button.o_new_ticket': function () {Router.navigate('/new');},
    },
    custom_events: {
        'ticket-submit': '_onTicketSubmit',
        'warning': function (ev) {this.notification_manager.warn(ev.data.msg);},
        'notify': function (ev) {this.notification_manager.notify(ev.data.msg);},
    },
    xmlDependencies: ['/ticket_viewer/static/src/xml/ticket_views.xml'],
    /* Lifecycle */
    init: function (parent, options) {
        this._super.apply(this, arguments);
        this.user = new User({id: odoo.session_info.user_id});
        var self = this;
        Router.config({ mode: 'history', root:'/tickets'});

        // adding routes
        Router
        .add(/new/, function () {
            self._onNewTicket();
        }).add(/about/, function () {
            self._about();
        })
        .listen();
    },
    willStart: function () {
        return $.when(this._super.apply(this, arguments),
                      this.user.fetchUserInfo(),
                      this.user.fetchAllTickets()
        ).then(function (dummy, user) {
            bus.update_option('demo.ticket', user.partner_id);
        });
    },
    start: function () {
        var self = this;
        return this._super.apply(this, arguments).then(function () {
            self.list = new TicketList(self, self.user.tickets);
            self.list.appendTo($('.o_ticket_list'));
            self.notification_manager = new notification.NotificationManager(self);
            self.notification_manager.appendTo(self.$el);
            bus.on('notification', self, self._onNotification);
            Router.check();
        });
    },
    _about: function () {
        new Dialog(this, {
            title: _t('About'),
            $content: qweb.render('ticket_viewer.about'),
            buttons: [{
                text: _t('Awesome!'),
                click: function () {
                    Router.navigate();
                },
                close: true,
            }],
        }).open();
    },
    /**
     * Open a new modal to encode a new ticket.
     * @param  {jQuery.Event} ev
     */
    _onNewTicket: function (ev) {
        new TicketDialog(this, {
            title: _t('New Ticket'),
            $content: qweb.render('ticket_viewer.ticket_form'),
            buttons: [{
                text: _t('Submit Ticket'),
                click: function () {
                    this._onFormSubmit();
                },
            }],
        }).open();
    },
    /**
     * Send the submitted ticket data to the model for saving.
     * @param  {OdooEvent} ev Odoo Event containing the form data
     */
    _onTicketSubmit: function (ev) {
        var self = this;
        var data = ev.data;
        this.user.createTicket(data).then(function (new_ticket) {
            self.list.insertTicket(new_ticket);
            Router.navigate('');
        });
    },
    /**
     * Handle bus notification.
     *
     * Currently, 2 notification types are handled in this page:
     *     - new_ticket: a ticket has been added for the current user
     *     - unlink_ticket: a ticket has been deleted for the current user
     *
     * @param  {Array} notifications Array of notification arriving through the bus.
     */
    _onNotification: function (notifications) {
        var self = this;
        for (var notif of notifications) {
            var channel = notif[0], message = notif[1];
            if (channel[1] !== 'demo.ticket' || channel[2] !== this.user.partner_id) {
                return;
            }
            if (message[0] === 'new_ticket') {
                var ticket_id = message[1];
                if (!this.user.tickets.find(t => t.id === ticket_id)) {
                    this.user.fetchTicket(ticket_id).then(function (new_ticket) {
                        self.list.insertTicket(new_ticket);
                        self.trigger_up('notify', {msg: (_t('New Ticket ') + new_ticket.name)});
                    });
                }
            } else if (message[0] === 'unlink_ticket') {
                this.user.removeTicket(message[1]);
                this.list.removeTicket(message[1]);
            }
        }
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
     * Insert a new ticket instance in the list. If the list is hidden
     * (because there was no ticket prior to the insertion), call for
     * a complete rerendering instead.
     * @param  {OdooClass.Ticket} ticket Ticket to insert in the list
     */
    insertTicket: function (ticket) {
        if (!this.$('tbody').length) {
            this._rerender();
            return;
        }
        var ticket_node = qweb.render('ticket_viewer.ticket_list.ticket', {ticket: ticket});
        this.$('tbody').prepend(ticket_node);
    },
    /**
     * Remove a ticket from the list. If this is the last ticket to be
     * removed, rerender the widget completely to reflect the 'empty list'
     * state.
     * @param  {Integer} id ID of the ticket to remove.
     */
    removeTicket: function (id) {
        this.$('tr[data-id=' + id + ']').remove();
        if (!this.$('tr[data-id]').length) {
            this._rerender();
        }
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

var TicketDialog = Dialog.extend({
    events: {
        'submit form': '_onFormSubmit',
        'click .btn-primary': '_onFormSubmit',
    },
    _onFormSubmit: function (ev) {
        if (ev) {
            ev.preventDefault();
        }
        var form = this.$('form')[0];
        var formdata = new FormData(form);
        var data = {};
        for (var field of formdata) {
            data[field[0]] = field[1];
        }
        if (!data.name || !data.description) {
            this.trigger_up('warning', {msg: _t('All fields are mandatory.')});
            return;
        }
        this.trigger_up('ticket-submit', data);
        form.reset();
        this.close();
    },
});


var $elem = $('.o_ticket_app');
var app = new TicketApp(null);
app.appendTo($elem).then(function () {
    bus.start_polling();
});
});
