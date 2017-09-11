odoo.define('demo.views', function (require) {
'use strict';

var core = require('web.core');
var Dialog = require('web.Dialog');
var User = require('demo.classes').User;
var Widget = require('web.Widget');

var qweb = core.qweb;
var _t = core._t;

require('web.dom_ready');

var TicketApp = Widget.extend({
    template: 'ticket_viewer.app',
    events: {
        'click button.o_new_ticket': '_onNewTicket',
    },
    custom_events: {
        'ticket-submit': '_onTicketSubmit',
    },
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
                close: true,
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
        this.user.createTicket(data);
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
        this.trigger_up('ticket-submit', data);
        form.reset();
    },
});


var $elem = $('.o_ticket_app');
var app = new TicketApp(null);
app.appendTo($elem);
});
