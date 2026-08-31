import {render} from '@testing-library/react';
import useWaSelectChange from './useWaSelectChange';

function TestComponent({onChange}) {
    const ref = useWaSelectChange(onChange);
    return (
        <select ref={ref} data-testid="select">
            <option value="picked">Picked</option>
        </select>
    );
}

describe('useWaSelectChange', () => {
    test('calls onChange with the element value on a native change event', () => {
        const onChange = jest.fn();
        const {getByTestId} = render(<TestComponent onChange={onChange} />);
        const select = getByTestId('select');
        select.value = 'picked';

        select.dispatchEvent(new Event('change', {bubbles: true}));

        expect(onChange).toHaveBeenCalledWith('picked');
    });

    test('removes the listener on unmount so it no longer fires', () => {
        const onChange = jest.fn();
        const {getByTestId, unmount} = render(<TestComponent onChange={onChange} />);
        const select = getByTestId('select');

        unmount();
        select.dispatchEvent(new Event('change', {bubbles: true}));

        expect(onChange).not.toHaveBeenCalled();
    });
});
