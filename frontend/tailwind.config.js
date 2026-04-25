/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'edu-navy': '#003366',
                'edu-orange': '#F39200',
                'edu-teal': '#008080',
            },
        },
    },
    plugins: [],
}