/** @format **/

/**
 * Internal dependencies
 */
import {
	HAPPYCHAT_CONNECT,
	HAPPYCHAT_CONNECTING,
	HAPPYCHAT_INITIALIZE,
	HAPPYCHAT_IO_RECEIVE_ACCEPT,
	HAPPYCHAT_IO_RECEIVE_CONNECT,
	HAPPYCHAT_IO_RECEIVE_DISCONNECT,
	HAPPYCHAT_IO_RECEIVE_INIT,
	HAPPYCHAT_IO_RECEIVE_MESSAGE,
	HAPPYCHAT_IO_RECEIVE_RECONNECTING,
	HAPPYCHAT_IO_RECEIVE_TOKEN,
	HAPPYCHAT_IO_RECEIVE_UNAUTHORIZED,
	HAPPYCHAT_SEND_MESSAGE,
	HAPPYCHAT_SEND_USER_INFO,
	HAPPYCHAT_TRANSCRIPT_RECEIVE,
	HAPPYCHAT_TRANSCRIPT_REQUEST,
} from 'state/action-types';

export const connectChat = () => ( { type: HAPPYCHAT_CONNECT } );

export const initialize = () => ( { type: HAPPYCHAT_INITIALIZE } );

export const receiveConnect = () => ( { type: HAPPYCHAT_IO_RECEIVE_CONNECT } );

export const receiveToken = () => ( { type: HAPPYCHAT_IO_RECEIVE_TOKEN } );

export const receiveInit = user => ( { type: HAPPYCHAT_IO_RECEIVE_INIT, user } );

export const receiveUnauthorized = errorStatus => ( {
	type: HAPPYCHAT_IO_RECEIVE_UNAUTHORIZED,
	errorStatus,
} );

export const setConnecting = () => ( { type: HAPPYCHAT_CONNECTING } );

export const receiveDisconnect = errorStatus => ( {
	type: HAPPYCHAT_IO_RECEIVE_DISCONNECT,
	errorStatus,
} );

export const receiveReconnecting = () => ( { type: HAPPYCHAT_IO_RECEIVE_RECONNECTING } );

export const receiveAccept = isAvailable => ( {
	type: HAPPYCHAT_IO_RECEIVE_ACCEPT,
	isAvailable,
} );

export const sendChatMessage = message => ( { type: HAPPYCHAT_SEND_MESSAGE, message } );

/**
 * Returns an action object that sends information about the customer to happychat
 *
 * @param  { String } howCanWeHelp Selected value of `How can we help?` form input
 * @param  { String } howYouFeel Selected value of `Mind sharing how you feel?` form input
 * @param  { Object } site Selected site info
 * @return { Object } Action object
 */
export const sendUserInfo = ( howCanWeHelp, howYouFeel, site ) => {
	return {
		type: HAPPYCHAT_SEND_USER_INFO,
		howCanWeHelp,
		howYouFeel,
		site,
	};
};

export const receiveMessage = message => ( { type: HAPPYCHAT_IO_RECEIVE_MESSAGE, message } );

export const requestChatTranscript = () => ( { type: HAPPYCHAT_TRANSCRIPT_REQUEST } );

export const receiveChatTranscript = ( messages, timestamp ) => ( {
	type: HAPPYCHAT_TRANSCRIPT_RECEIVE,
	messages,
	timestamp,
} );
