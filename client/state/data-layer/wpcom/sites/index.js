/**
 * Internal dependencies
 *
 * @format
 */

import { mergeHandlers } from 'state/action-watchers/utils';
import config from 'config';
import activity from './activity';
import automatedTransfer from './automated-transfer';
import blogStickers from './blog-stickers';
import comments from './comments';
import commentsBulk from './comments-bulk';
import commentsTree from './comments-tree';
import jitm from './jitm';
import media from './media';
import plugins from './plugins';
import posts from './posts';
import simplePayments from './simple-payments';

export default mergeHandlers(
	activity,
	automatedTransfer,
	blogStickers,
	comments,
	commentsBulk,
	commentsTree,
	config.isEnabled( 'jitms' ) ? jitm : null,
	media,
	plugins,
	posts,
	simplePayments
);
