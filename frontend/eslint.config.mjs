import next from 'eslint-config-next';

export default [
  next,
  {
    rules: {
      'react/no-unescaped-entities': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/rules-of-hooks': 'off',
      // Disable the setState in effect warning for now
      'react/no-unknown-property': ['error', { ignore: ['jsx', 'global'] }],
      'react/jsx-no-target-blank': 'off',
      'react/display-name': 'off',
    },
  },
];
