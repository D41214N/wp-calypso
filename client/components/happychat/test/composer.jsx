/** @format */

/**
 * External dependencies
 */
import React from 'react';
import { shallow } from 'enzyme';
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import { Composer } from '../composer';

describe( '<Composer />', () => {
	describe( 'onChange event ', () => {
		test( 'should call onSendTyping property', () => {
			const onSendTyping = jest.fn();
			const wrapper = shallow( <Composer translate={ noop } onSendTyping={ onSendTyping } /> );
			wrapper.find( 'textarea' ).simulate( 'change', { target: { value: 'hey' } } );
			expect( onSendTyping ).toHaveBeenCalled();
		} );
	} );

	describe( 'onKeyDown event ', () => {
		test( 'should call message and noTyping props if message is not empty', () => {
			const onSendMessage = jest.fn();
			const onSendNotTyping = jest.fn();
			const wrapper = shallow(
				<Composer
					message={ 'hey' }
					onSendMessage={ onSendMessage }
					onSendNotTyping={ onSendNotTyping }
					translate={ noop }
				/>
			);
			wrapper.find( 'textarea' ).simulate( 'keydown', { which: 13, preventDefault: () => {} } );
			expect( onSendMessage ).toHaveBeenCalled();
			expect( onSendNotTyping ).toHaveBeenCalled();
		} );

		test( 'should call message and noTyping props if message is empty', () => {
			const onSendMessage = jest.fn();
			const onSendNotTyping = jest.fn();
			const wrapper = shallow(
				<Composer
					message={ '' }
					onSendMessage={ onSendMessage }
					onSendNotTyping={ onSendNotTyping }
					translate={ noop }
				/>
			);
			wrapper.find( 'textarea' ).simulate( 'keydown', { which: 13, preventDefault: () => {} } );
			expect( onSendMessage ).not.toHaveBeenCalled();
			expect( onSendNotTyping ).not.toHaveBeenCalled();
		} );
	} );
} );
