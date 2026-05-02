import typography from '@tailwindcss/typography';

const config = {
    darkMode: ['class'],
    content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './features/**/*.{ts,tsx}'],
    plugins: [typography],
}

export default config
