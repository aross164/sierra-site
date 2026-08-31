import {computeSierraRedirect} from './sierraLoader';

describe('computeSierraRedirect', () => {
    test('returns a redirect URL with the default league appended when league is missing', () => {
        const result = computeSierraRedirect('https://example.com/schedules', 'sierra123');

        expect(result).toBe('https://example.com/schedules?league=sierra123');
    });

    test('returns null when a league param is already present', () => {
        const result = computeSierraRedirect('https://example.com/schedules?league=other456', 'sierra123');

        expect(result).toBeNull();
    });

    test('treats an empty league param as missing and replaces it with the default league', () => {
        // An empty string is falsy, so `?league=` is treated the same as no league param at all.
        const result = computeSierraRedirect('https://example.com/schedules?league=', 'sierra123');

        expect(result).toBe('https://example.com/schedules?league=sierra123');
    });

    test('preserves other existing query params with a proper "&" when league is missing', () => {
        const result = computeSierraRedirect('https://example.com/rankings?otherUser=abc', 'sierra123');

        expect(result).toBe('https://example.com/rankings?otherUser=abc&league=sierra123');
    });
});
