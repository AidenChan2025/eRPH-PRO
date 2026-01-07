/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./App.tsx",
        "./index.tsx"
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                jawi: ['Amiri', 'serif'],
                tamil: ['Noto Sans Tamil', 'sans-serif'],
                chinese: ['Noto Sans SC', 'sans-serif'],
            },
            colors: {
                primary: '#2563eb',
                secondary: '#475569',
                accent: '#f59e0b',
            }
        },
    },
    plugins: [],
}
