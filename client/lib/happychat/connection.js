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
	initConnection,
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
	init( url, dispatch, { signer_user_id, jwt, locale, groups, geoLocation } ) {
		if ( this.openSocket ) {
			debug( 'socket is already connected' );
			return this.openSocket;
		}
		this.dispatch = dispatch;
		dispatch( initConnection() );

		const socket = buildConnection( url );
		this.openSocket = new Promise( ( resolve, reject ) => {
			socket
				.once( 'connect', () => dispatch( receiveConnect() ) )
				.on( 'token', handler => {
					dispatch( receiveToken() );
					handler( { signer_user_id, jwt, locale, groups } );
				} )
				.on( 'init', () => {
					dispatch( receiveInit( { signer_user_id, locale, groups, geoLocation } ) );
					// TODO: There's no need to dispatch a separate action to request a transcript.
					// The HAPPYCHAT_IO_RECEIVE_INIT action should have its own middleware handler that does this.
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
	}

	emit( action ) {
		this.openSocket.then(
			socket => socket.emit( action.event, action.payload ),
			e => this.dispatch( receiveError( action.error || '' + e ) )
		);
	}

	transcript( timestamp ) {
		return this.openSocket.then( socket =>
			Promise.race( [
				new Promise( ( resolve, reject ) => {
					socket.emit( 'transcript', timestamp || null, ( e, result ) => {
						if ( e ) {
							return reject( new Error( e ) );
						}
						resolve( result );
					} );
				} ),
				new Promise( ( resolve, reject ) =>
					setTimeout( () => {
						reject( Error( 'timeout' ) );
					}, 10000 )
				),
			] )
		);
	}
}

export default () => new Connection();
