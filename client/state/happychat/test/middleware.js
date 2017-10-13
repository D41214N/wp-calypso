/** @format */

/**
 * External dependencies
 */
import { expect } from 'chai';
import deepFreeze from 'deep-freeze';
import { noop } from 'lodash';
import { spy, stub } from 'sinon';

/**
 * Internal dependencies
 */
import middleware, {
	connectChat,
	connectIfRecentlyActive,
	sendActionLogsAndEvents,
	sendAnalyticsLogEvent,
} from '../middleware';
import {
	HAPPYCHAT_CHAT_STATUS_ASSIGNED,
	HAPPYCHAT_CHAT_STATUS_DEFAULT,
	HAPPYCHAT_CHAT_STATUS_PENDING,
	HAPPYCHAT_CONNECTION_STATUS_UNINITIALIZED,
	HAPPYCHAT_CONNECTION_STATUS_CONNECTED,
	HAPPYCHAT_CONNECTION_STATUS_CONNECTING,
} from '../constants';
import wpcom from 'lib/wp';
import {
	ANALYTICS_EVENT_RECORD,
	HAPPYCHAT_BLUR,
	HAPPYCHAT_IO_SEND_MESSAGE_MESSAGE,
	HAPPYCHAT_IO_SEND_MESSAGE_EVENT,
	HAPPYCHAT_IO_SEND_MESSAGE_LOG,
	HAPPYCHAT_SET_CURRENT_MESSAGE,
	HELP_CONTACT_FORM_SITE_SELECT,
	ROUTE_SET,
} from 'state/action-types';
import { useSandbox } from 'test/helpers/use-sinon';
import {
	sendLog,
	sendTyping,
	sendNotTyping,
	sendPreferences,
} from 'state/happychat/connection/actions';
import { getCurrentUserLocale } from 'state/current-user/selectors';
import { getGroups } from 'state/happychat/selectors';

describe( 'middleware', () => {
	describe( 'HAPPYCHAT_CONNECT action', () => {
		// TODO: Add tests for cases outside the happy path
		let connection;
		let dispatch, getState;
		const uninitializedState = deepFreeze( {
			currentUser: { id: 1, capabilities: {} },
			happychat: { connection: { status: HAPPYCHAT_CONNECTION_STATUS_UNINITIALIZED } },
			users: { items: { 1: {} } },
			help: { selectedSiteId: 2647731 },
			sites: {
				items: {
					2647731: {
						ID: 2647731,
						name: 'Manual Automattic Updates',
					},
				},
			},
			ui: {
				section: {
					name: 'reader',
				},
			},
		} );

		useSandbox( sandbox => {
			connection = {
				init: sandbox.stub().returns( Promise.resolve() ),
			};
			dispatch = sandbox.stub();
			getState = sandbox.stub();
			sandbox.stub( wpcom, 'request', ( args, callback ) => callback( null, {} ) );
		} );

		test( 'should not attempt to connect when Happychat has been initialized', () => {
			const connectedState = {
				happychat: { connection: { status: HAPPYCHAT_CONNECTION_STATUS_CONNECTED } },
			};
			const connectingState = {
				happychat: { connection: { status: HAPPYCHAT_CONNECTION_STATUS_CONNECTING } },
			};

			return Promise.all( [
				connectChat( connection, { dispatch, getState: getState.returns( connectedState ) } ),
				connectChat( connection, { dispatch, getState: getState.returns( connectingState ) } ),
			] ).then( () => expect( connection.init ).not.to.have.been.called );
		} );

		test( 'should attempt to connect when Happychat is uninitialized', () => {
			getState.returns( uninitializedState );
			return connectChat( connection, { dispatch, getState } ).then( () => {
				expect( connection.init ).to.have.been.calledOnce;
			} );
		} );
	} );

	describe( 'HAPPYCHAT_INITIALIZE action', () => {
		// TODO: This test is only complicated because connectIfRecentlyActive calls
		// connectChat directly, and since both are in the same module we can't stub
		// connectChat. So we need to build up all the objects to make connectChat execute
		// without errors. It may be worth pulling each of these helpers out into their
		// own modules, so that we can stub them and simplify our tests.
		const recentlyActiveState = deepFreeze( {
			currentUser: { id: 1, capabilities: {} },
			happychat: {
				connection: { status: HAPPYCHAT_CONNECTION_STATUS_UNINITIALIZED },
				lastActivityTimestamp: Date.now(),
			},
			users: { items: { 1: {} } },
			help: { selectedSiteId: 2647731 },
			sites: {
				items: {
					2647731: {
						ID: 2647731,
						name: 'Manual Automattic Updates',
					},
				},
			},
			ui: {
				section: {
					name: 'reader',
				},
			},
		} );
		const storeRecentlyActive = {
			dispatch: noop,
			getState: stub().returns( recentlyActiveState ),
		};

		const notRecentlyActiveState = deepFreeze( {
			currentUser: { id: 1, capabilities: {} },
			happychat: {
				connection: { status: HAPPYCHAT_CONNECTION_STATUS_UNINITIALIZED },
				lastActivityTimestamp: null, // no record of last activity
			},
			users: { items: { 1: {} } },
			help: { selectedSiteId: 2647731 },
			sites: {
				items: {
					2647731: {
						ID: 2647731,
						name: 'Manual Automattic Updates',
					},
				},
			},
			ui: {
				section: {
					name: 'reader',
				},
			},
		} );
		const storeNotRecentlyActive = {
			dispatch: noop,
			getState: stub().returns( notRecentlyActiveState ),
		};

		let connection;
		useSandbox( sandbox => {
			connection = {
				init: sandbox.stub().returns( Promise.resolve() ),
			};
			sandbox.stub( wpcom, 'request', ( args, callback ) => callback( null, {} ) );
		} );

		test( 'should connect the chat if user was recently connected', () => {
			connectIfRecentlyActive( connection, storeRecentlyActive ).then( () => {
				expect( connection.init ).to.have.been.called;
			} );
		} );

		test( 'should not connect the chat if user was not recently connected', () => {
			connectIfRecentlyActive( connection, storeNotRecentlyActive ).then( () => {
				expect( connection.init ).to.not.have.been.called;
			} );
		} );
	} );

	describe( 'HAPPYCHAT_IO_SEND_MESSAGE_MESSAGE action', () => {
		test( 'should send the message through the connection and send a notTyping signal', () => {
			const action = { type: HAPPYCHAT_IO_SEND_MESSAGE_MESSAGE, message: 'Hello world' };
			const connection = {
				emit: spy(),
				notTyping: spy(),
			};
			middleware( connection )( { getState: noop } )( noop )( action );
			expect( connection.emit ).to.have.been.calledWithMatch( action );
		} );
	} );

	describe( 'HAPPYCHAT_SET_CURRENT_MESSAGE action', () => {
		test( 'should send the connection a typing signal when a message is present', () => {
			const action = { type: HAPPYCHAT_SET_CURRENT_MESSAGE, message: 'Hello world' };
			const dispatch = spy();
			middleware( noop )( { getState: noop, dispatch } )( noop )( action );
			expect( dispatch ).to.have.been.calledWithMatch( sendTyping( action.message ) );
		} );

		test( 'should send the connection a notTyping signal when the message is blank', () => {
			const action = { type: HAPPYCHAT_SET_CURRENT_MESSAGE, message: '' };
			const dispatch = spy();
			middleware( noop )( { getState: noop, dispatch } )( noop )( action );
			expect( dispatch ).to.have.been.calledWithMatch( sendNotTyping() );
		} );
	} );

	describe( 'HELP_CONTACT_FORM_SITE_SELECT action', () => {
		test( 'should send the locale and groups through the connection and send a preferences signal', () => {
			const state = {
				happychat: {
					connection: { status: HAPPYCHAT_CONNECTION_STATUS_CONNECTED },
				},
				currentUser: {
					locale: 'en',
					capabilities: {},
				},
				sites: {
					items: {
						1: { ID: 1 },
					},
				},
				ui: {
					section: {
						name: 'reader',
					},
				},
			};
			const action = {
				type: HELP_CONTACT_FORM_SITE_SELECT,
				siteId: 1,
			};
			const getState = () => state;
			const dispatch = spy();
			middleware( noop )( { getState, dispatch } )( noop )( action );
			expect( dispatch ).to.have.been.calledWithMatch(
				sendPreferences( getCurrentUserLocale( state ), getGroups( state, action.siteId ) )
			);
		} );

		test( 'should not send the locale and groups if there is no happychat connection', () => {
			const state = {
				currentUser: {
					locale: 'en',
					capabilities: {},
				},
				sites: {
					items: {
						1: { ID: 1 },
					},
				},
			};
			const action = {
				type: HELP_CONTACT_FORM_SITE_SELECT,
				siteId: 1,
			};
			const getState = () => state;
			const dispatch = spy();
			middleware( noop )( { getState, dispatch } )( noop )( action );
			expect( dispatch ).to.not.have.been.called;
		} );
	} );

	describe( 'ROUTE_SET action', () => {
		let dispatch;
		const action = { type: ROUTE_SET, path: '/me' };
		const state = {
			currentUser: {
				id: '2',
			},
			users: {
				items: {
					2: { username: 'Link' },
				},
			},
			happychat: {
				connection: {
					status: HAPPYCHAT_CONNECTION_STATUS_CONNECTED,
					isAvailable: true,
				},
				chat: { status: HAPPYCHAT_CHAT_STATUS_ASSIGNED },
			},
		};

		beforeEach( () => {
			dispatch = spy();
		} );

		test( 'should sent the page URL the user is in', () => {
			const getState = () => state;
			middleware( noop )( { getState, dispatch } )( noop )( action );
			expect( dispatch.getCall( 0 ).args[ 0 ].payload.text ).to.be.equals(
				'Looking at https://wordpress.com/me?support_user=Link'
			);
		} );

		test( 'should not sent the page URL the user is in when client not connected', () => {
			const getState = () =>
				Object.assign( {}, state, {
					happychat: { connection: { status: HAPPYCHAT_CONNECTION_STATUS_UNINITIALIZED } },
				} );
			middleware( noop )( { getState, dispatch } )( noop )( action );
			expect( dispatch ).to.not.have.been.called;
		} );

		test( 'should not sent the page URL the user is in when chat is not assigned', () => {
			const getState = () =>
				Object.assign( {}, state, {
					happychat: { chat: { status: HAPPYCHAT_CHAT_STATUS_PENDING } },
				} );
			middleware( noop )( { getState, dispatch } )( noop )( action );
			expect( dispatch ).to.not.have.been.called;
		} );
	} );

	describe( '#sendAnalyticsLogEvent', () => {
		let dispatch;

		beforeEach( () => {
			dispatch = spy();
		} );

		test( 'should ignore non-tracks analytics recordings', () => {
			const analyticsMeta = [
				{ type: ANALYTICS_EVENT_RECORD, payload: { service: 'ga' } },
				{ type: ANALYTICS_EVENT_RECORD, payload: { service: 'fb' } },
				{ type: ANALYTICS_EVENT_RECORD, payload: { service: 'adwords' } },
			];
			sendAnalyticsLogEvent( dispatch, { meta: { analytics: analyticsMeta } } );

			expect( dispatch ).not.to.have.been.called;
		} );

		test( 'should send log events for all listed tracks events', () => {
			const analyticsMeta = [
				{ type: ANALYTICS_EVENT_RECORD, payload: { service: 'ga' } },
				{ type: ANALYTICS_EVENT_RECORD, payload: { service: 'tracks', name: 'abc' } },
				{ type: ANALYTICS_EVENT_RECORD, payload: { service: 'adwords' } },
				{ type: ANALYTICS_EVENT_RECORD, payload: { service: 'tracks', name: 'def' } },
			];
			sendAnalyticsLogEvent( dispatch, { meta: { analytics: analyticsMeta } } );

			expect( dispatch.callCount ).to.equal( 2 );
			expect( dispatch.getCall( 0 ).args[ 0 ].payload.text ).to.be.equals( 'abc' );
			expect( dispatch.getCall( 1 ).args[ 0 ].payload.text ).to.be.equals( 'def' );
		} );

		test( 'should only send a timeline event for whitelisted tracks events', () => {
			const analyticsMeta = [
				{
					type: ANALYTICS_EVENT_RECORD,
					payload: { service: 'tracks', name: 'calypso_add_new_wordpress_click' },
				},
				{ type: ANALYTICS_EVENT_RECORD, payload: { service: 'tracks', name: 'abc' } },
				{
					type: ANALYTICS_EVENT_RECORD,
					payload: {
						service: 'tracks',
						name: 'calypso_themeshowcase_theme_activate',
						properties: {},
					},
				},
				{ type: ANALYTICS_EVENT_RECORD, payload: { service: 'tracks', name: 'def' } },
			];
			sendAnalyticsLogEvent( dispatch, { meta: { analytics: analyticsMeta } } );

			expect( dispatch.callCount ).to.equal( 6 );
			expect( dispatch.getCall( 0 ).args[ 0 ].type ).to.be.equal( HAPPYCHAT_IO_SEND_MESSAGE_EVENT );
			expect( dispatch.getCall( 1 ).args[ 0 ].type ).to.be.equal( HAPPYCHAT_IO_SEND_MESSAGE_LOG );
			expect( dispatch.getCall( 2 ).args[ 0 ].type ).to.be.equal( HAPPYCHAT_IO_SEND_MESSAGE_LOG );
			expect( dispatch.getCall( 3 ).args[ 0 ].type ).to.be.equal( HAPPYCHAT_IO_SEND_MESSAGE_EVENT );
			expect( dispatch.getCall( 4 ).args[ 0 ].type ).to.be.equal( HAPPYCHAT_IO_SEND_MESSAGE_LOG );
			expect( dispatch.getCall( 5 ).args[ 0 ].type ).to.be.equal( HAPPYCHAT_IO_SEND_MESSAGE_LOG );
		} );
	} );

	describe( '#sendActionLogsAndEvents', () => {
		const assignedState = deepFreeze( {
			happychat: {
				connection: { status: HAPPYCHAT_CONNECTION_STATUS_CONNECTED },
				chat: { status: HAPPYCHAT_CHAT_STATUS_ASSIGNED },
			},
		} );
		const unassignedState = deepFreeze( {
			happychat: {
				connection: { status: HAPPYCHAT_CONNECTION_STATUS_CONNECTED },
				chat: { status: HAPPYCHAT_CHAT_STATUS_DEFAULT },
			},
		} );
		const unconnectedState = deepFreeze( {
			happychat: {
				connection: { status: HAPPYCHAT_CONNECTION_STATUS_UNINITIALIZED },
				chat: { status: HAPPYCHAT_CHAT_STATUS_DEFAULT },
			},
		} );

		let dispatch, getState;
		useSandbox( sandbox => {
			getState = sandbox.stub();
		} );
		beforeEach( () => {
			dispatch = spy();
			getState.returns( assignedState );
		} );

		test( "should not send events if there's no Happychat connection", () => {
			const action = {
				type: HAPPYCHAT_BLUR,
				meta: {
					analytics: [
						{ type: ANALYTICS_EVENT_RECORD, payload: { service: 'tracks', name: 'abc' } },
					],
				},
			};
			getState.returns( unconnectedState );
			sendActionLogsAndEvents( dispatch, { getState }, action );

			expect( dispatch ).not.to.have.been.called;
		} );

		test( 'should not send log events if the Happychat connection is unassigned', () => {
			const action = {
				type: HAPPYCHAT_BLUR,
				meta: {
					analytics: [
						{ type: ANALYTICS_EVENT_RECORD, payload: { service: 'tracks', name: 'abc' } },
					],
				},
			};
			getState.returns( unassignedState );
			sendActionLogsAndEvents( dispatch, { getState }, action );

			expect( dispatch ).not.to.have.been.called;
		} );

		test( 'should send matching events when Happychat is connected and assigned', () => {
			const action = {
				type: HAPPYCHAT_BLUR,
				meta: {
					analytics: [
						{
							type: ANALYTICS_EVENT_RECORD,
							payload: { service: 'tracks', name: 'calypso_add_new_wordpress_click' },
						},
						{ type: ANALYTICS_EVENT_RECORD, payload: { service: 'tracks', name: 'abc' } },
						{
							type: ANALYTICS_EVENT_RECORD,
							payload: {
								service: 'tracks',
								name: 'calypso_themeshowcase_theme_activate',
								properties: {},
							},
						},
						{ type: ANALYTICS_EVENT_RECORD, payload: { service: 'tracks', name: 'def' } },
					],
				},
			};
			getState.returns( assignedState );
			sendActionLogsAndEvents( dispatch, { getState }, action );

			// All 4 analytics records will be sent to the "firehose" log
			// The two whitelisted analytics events and the HAPPYCHAT_BLUR action itself
			// will be sent as customer events
			expect( dispatch.callCount ).to.equal( 7 );
			expect( dispatch.getCall( 0 ).args[ 0 ].type ).to.be.equal( HAPPYCHAT_IO_SEND_MESSAGE_EVENT );
			expect( dispatch.getCall( 1 ).args[ 0 ].type ).to.be.equal( HAPPYCHAT_IO_SEND_MESSAGE_LOG );
			expect( dispatch.getCall( 2 ).args[ 0 ].type ).to.be.equal( HAPPYCHAT_IO_SEND_MESSAGE_LOG );
			expect( dispatch.getCall( 3 ).args[ 0 ].type ).to.be.equal( HAPPYCHAT_IO_SEND_MESSAGE_EVENT );
			expect( dispatch.getCall( 4 ).args[ 0 ].type ).to.be.equal( HAPPYCHAT_IO_SEND_MESSAGE_LOG );
			expect( dispatch.getCall( 5 ).args[ 0 ].type ).to.be.equal( HAPPYCHAT_IO_SEND_MESSAGE_LOG );
			expect( dispatch.getCall( 6 ).args[ 0 ].type ).to.be.equal( HAPPYCHAT_IO_SEND_MESSAGE_EVENT );
		} );
	} );
} );
