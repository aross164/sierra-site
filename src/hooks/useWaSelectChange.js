import {useEffect, useRef} from 'react';

// The React 18 wrapper for <wa-select> only forwards wa-*-prefixed events (see its
// `events` map), so a plain `onChange` prop never fires. Listen for the native
// `change` event on the underlying element directly instead.
export default function useWaSelectChange(onChange){
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if(!el){
            return;
        }

        function handleChange(e){
            onChange(e.target.value);
        }

        el.addEventListener('change', handleChange);
        return () => el.removeEventListener('change', handleChange);
    }, [onChange]);

    return ref;
}
