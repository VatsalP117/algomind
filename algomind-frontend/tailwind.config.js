import typography from '@tailwindcss/typography';

export default {
    darkMode: ['class'],
    content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './features/**/*.{ts,tsx}'],
    plugins: [typography],
}
