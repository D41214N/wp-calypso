/** @format **/

/**
 * External dependencies
 */
import { v4 as uuid } from 'uuid';

/**
 * Internal dependencies
 */
import { HAPPYCHAT_MESSAGE_TYPES } from 'state/happychat/constants';
import {
	HAPPYCHAT_CONNECT,
	HAPPYCHAT_INITIALIZE,
	HAPPYCHAT_IO_INIT,
	HAPPYCHAT_IO_RECEIVE_ACCEPT,
	HAPPYCHAT_IO_RECEIVE_CONNECT,
	HAPPYCHAT_IO_RECEIVE_DISCONNECT,
	HAPPYCHAT_IO_RECEIVE_ERROR,
	HAPPYCHAT_IO_RECEIVE_INIT,
	HAPPYCHAT_IO_RECEIVE_MESSAGE,
	HAPPYCHAT_IO_RECEIVE_RECONNECTING,
	HAPPYCHAT_IO_RECEIVE_TOKEN,
	HAPPYCHAT_IO_RECEIVE_UNAUTHORIZED,
	HAPPYCHAT_IO_SEND_MESSAGE_USERINFO,
	HAPPYCHAT_IO_SEND_MESSAGE_MESSAGE,
	HAPPYCHAT_IO_SEND_PREFERENCES,
	HAPPYCHAT_IO_SEND_TYPING,
	HAPPYCHAT_TRANSCRIPT_RECEIVE,
	HAPPYCHAT_TRANSCRIPT_REQUEST,
} from 'state/action-types';

export const connectChat = () => ( { type: HAPPYCHAT_CONNECT } );

export const initialize = () => ( { type: HAPPYCHAT_INITIALIZE } );

export const receiveConnect = () => ( { type: HAPPYCHAT_IO_RECEIVE_CONNECT } );

export const receiveToken = () => ( { type: HAPPYCHAT_IO_RECEIVE_TOKEN } );

export const receiveInit = user => ( { type: HAPPYCHAT_IO_RECEIVE_INIT, user } );

export const receiveError = error => ( { type: HAPPYCHAT_IO_RECEIVE_ERROR, error } );

export const receiveUnauthorized = errorStatus => ( {
	type: HAPPYCHAT_IO_RECEIVE_UNAUTHORIZED,
	errorStatus,
} );

export const initConnection = () => ( { type: HAPPYCHAT_IO_INIT } );

export const receiveDisconnect = errorStatus => ( {
	type: HAPPYCHAT_IO_RECEIVE_DISCONNECT,
	errorStatus,
} );

export const receiveReconnecting = () => ( { type: HAPPYCHAT_IO_RECEIVE_RECONNECTING } );

export const receiveAccept = isAvailable => ( {
	type: HAPPYCHAT_IO_RECEIVE_ACCEPT,
	isAvailable,
} );

/**
 * Returns an action object that sends the user message to happychat
 *
 * @param  { Object } message Message to be sent
 * @return { Object } Action object
 */
export const sendChatMessage = message => ( {
	type: HAPPYCHAT_IO_SEND_MESSAGE_MESSAGE,
	event: 'message',
	error: 'failed to send message',
	payload: { id: uuid(), text: message },
} );

/**
 * Returns an action object that sends user information about the customer to happychat
 *
 * @param  { Object } info Selected user info
 * @return { Object } Action object
 */
export const sendUserInfo = info => ( {
	type: HAPPYCHAT_IO_SEND_MESSAGE_USERINFO,
	event: 'message',
	error: 'failed to send message',
	payload: {
		type: HAPPYCHAT_MESSAGE_TYPES.CUSTOMER_INFO,
		id: uuid(),
		meta: {
			forOperator: true,
			...info,
		},
	},
} );

/**
 * Returns an action object that sends typing event to happychat
 *
 * @param  { Object } message What the user is typing
 * @return { Object } Action object
 */
export const sendTyping = message => ( {
	type: HAPPYCHAT_IO_SEND_TYPING,
	event: 'typing',
	error: 'failed to send typing',
	payload: {
		message,
	},
} );

/**
 * Returns an action object that indicates that user stopped typing to happychat
 *
 * @return { Object } Action object
 */
export const sendNotTyping = () => sendTyping( false );

/**
 * Returns an action object that send user routing preferences (locale and groups) to happychat.
 *
 * @param { String } locale representing the user selected locale
 * @param { Array } groups of string happychat groups (wp.com, jpop) based on the site selected
 * @return { Object } Action object
 */
export const sendPreferences = ( locale, groups ) => ( {
	type: HAPPYCHAT_IO_SEND_PREFERENCES,
	event: 'preferences',
	error: 'failed to send preferences',
	payload: {
		locale,
		groups,
	},
} );

export const receiveMessage = message => ( { type: HAPPYCHAT_IO_RECEIVE_MESSAGE, message } );

export const requestChatTranscript = () => ( { type: HAPPYCHAT_TRANSCRIPT_REQUEST } );

export const receiveChatTranscript = ( messages, timestamp ) => ( {
	type: HAPPYCHAT_TRANSCRIPT_RECEIVE,
	messages,
	timestamp,
} );
