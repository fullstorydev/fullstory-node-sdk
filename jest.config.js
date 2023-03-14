module.exports = {
    'roots': [
        '<rootDir>/src'
    ],
    'moduleNameMapper': {
        '@model/(.*)': '<rootDir>/src/model/$1',
        '@api/(.*)': '<rootDir>/src/api/$1'
    }
};
