/**
 * External dependencies
 *
 * @format
 */

import IO from 'socket.io-client';
import { isString } from 'lodash';

/**
 * Internal dependencies
 */
import {
	receiveAccept,
	receiveConnect,
	receiveDisconnect,
	receiveError,
	receiveInit,
	receiveMessage,
	receiveToken,
	receiveUnauthorized,
	requestChatTranscript,
	receiveReconnecting,
} from 'state/happychat/connection/actions';
import { receiveStatus } from 'state/happychat/chat/actions';

const debug = require( 'debug' )( 'calypso:happychat:connection' );

const buildConnection = socket =>
	isString( socket )
		? new IO( socket ) // If socket is an URL, connect to server.
		: socket; // If socket is not an url, use it directly. Useful for testing.

class Connection {
	/**
	 * Init the SockeIO connection (bind events, etc)
	 *
	 * @param  { Function } dispatch Redux dispatch function
	 * @param  { Promise } config   Will give us the user info
	 * @return { Promise }          Resolved promise (an opened socket) or rejected
	 */
	init( dispatch, config ) {
		if ( this.openSocket ) {
			debug( 'socket is already connected' );
			return this.openSocket;
		}
		this.dispatch = dispatch;

		// By not catching the config promise, we expose a better API to init:
		// - either we return a resolve promise (the openSocket)
		// - or a rejected promise
		return config.then( ( { url, user: { signer_user_id, jwt, locale, groups, geoLocation } } ) => {
			const socket = buildConnection( url );

			this.openSocket = new Promise( ( resolve, reject ) => {
				// TODO: reject this promise
				socket
					.once( 'connect', () => dispatch( receiveConnect() ) )
					.on( 'token', handler => {
						dispatch( receiveToken() );
						handler( { signer_user_id, jwt, locale, groups } );
					} )
					.on( 'init', () => {
						dispatch( receiveInit( { signer_user_id, locale, groups, geoLocation } ) );
						dispatch( requestChatTranscript() );
						resolve( socket );
					} )
					.on( 'unauthorized', () => {
						socket.close();
						dispatch( receiveUnauthorized( 'User is not authorized' ) );
						reject( 'User is not authorized' );
					} )
					.on( 'disconnect', reason => dispatch( receiveDisconnect( reason ) ) )
					.on( 'reconnecting', () => dispatch( receiveReconnecting() ) )
					.on( 'status', status => dispatch( receiveStatus( status ) ) )
					.on( 'accept', accept => dispatch( receiveAccept( accept ) ) )
					.on( 'message', message => dispatch( receiveMessage( message ) ) );
			} );
			return this.openSocket;
		} );
	}

	/**
	 * Given a Redux action, emits a SocketIO event.
	 *
	 * @param  { Object } action Redux action with {event, payload, error} props
	 * @return { Object } A socket promise
	 */
	emit( action ) {
		return this.openSocket.then(
			socket => socket.emit( action.event, action.payload ),
			e => this.dispatch( receiveError( action.error || '' + e ) )
		);
	}

	/**
	 * Given a Redux action and a timeout, emits a SocketIO event that request
	 * some info to server as a Promise. Upon resolution of that request promise
	 * the action.callback will be dispatched (it should be a Redux action creator).
	 * If server response takes more than timeout,
	 * the action.callbackTimeout will be dispatched instead.
	 *
	 * @param  { Object } action Redux action with {event, payload, error} props
	 * @param  { Number } timeout How long (in milliseconds) has the server to respond
	 * @return { Object } A socket promise
	 */
	request( action, timeout ) {
		return this.openSocket.then( socket =>
			Promise.race( [
				new Promise( ( resolve, reject ) => {
					socket.emit( action.event, action.payload, ( e, result ) => {
						if ( e ) {
							this.dispatch( receiveError( action.error + e ) );
							return reject( new Error( e ) );
						}
						this.dispatch( action.callback( result ) );
						resolve( result );
					} );
				} ),
				new Promise( ( resolve, reject ) =>
					setTimeout( () => {
						reject( Error( 'timeout' ) );
						this.dispatch( action.callbackTimeout() );
					}, timeout )
				),
			] )
		);
	}
}

export default () => new Connection();
