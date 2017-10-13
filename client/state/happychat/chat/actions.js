/** @format */

/**
 * Internal dependencies
 */
import { HAPPYCHAT_IO_RECEIVE_STATUS } from 'state/action-types';

/**
 * Returns an action object that sets the current chat status
 *
 * @param  { String } status Current status to be set
 * @return { Object } Action object
 */
export const receiveStatus = status => ( {
	type: HAPPYCHAT_IO_RECEIVE_STATUS,
	status,
} );
