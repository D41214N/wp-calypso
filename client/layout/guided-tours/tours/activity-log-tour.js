/**
 * External dependencies
 *
 * @format
 */

import React from 'react';
import { translate } from 'i18n-calypso';
import { overEvery as and } from 'lodash';

/**
 * Internal dependencies
 */
import {
	makeTour,
	Tour,
	Step,
	ButtonRow,
	Next,
	Quit,
	Link,
} from 'layout/guided-tours/config-elements';
import { isNotNewUser } from 'state/ui/guided-tours/contexts';
import { isDesktop } from 'lib/viewport';

export const ActivityLogTour = makeTour(
	<Tour
		name="activityLogTour"
		version="20171025"
		path={ [ '/stats/activity/' ] }
		when={ and( isDesktop, isNotNewUser ) }
	>
		<Step name="init" style={ { animationDelay: '5s' } }>
			<p>
				{ translate(
					'{{strong}}Need a hand?{{/strong}} ' +
						"We'd love to show you around the Activity Log, " +
						'and tell you how you can use it to restore a previous state of your site.',
					{ components: { strong: <strong /> } }
				) }
			</p>
			<ButtonRow>
				<Next step="rewind">{ translate( "Let's go!" ) }</Next>
				<Quit>{ translate( 'No, thanks.' ) }</Quit>
			</ButtonRow>
		</Step>
		<Step
			name="rewind"
			arrow="right-top"
			target=".activity-log-day__rewind-button"
			placement="beside"
			style={ { marginTop: '-17px' } }
		>
			<p>{ translate( 'Use this button to return your site to this day' ) }</p>
			<ButtonRow>
				<Quit primary>{ translate( "Got it, I'm ready to rewind!" ) }</Quit>
			</ButtonRow>
			<Link href="https://learn.wordpress.com/activity-log/">
				{ translate( 'Learn more about Activity Log.' ) }
			</Link>
		</Step>
	</Tour>
);
