import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                // Custom branding colors
                brand: {
                    50: '#fff1f3',
                    100: '#ffe0e5',
                    400: '#ff3366',
                    500: '#ff0350',
                    600: '#e6024a',
                    700: '#cc0241',
                    800: '#b30239',
                    900: '#990130',
                }
            },
            fontFamily: {
                'heading': ['var(--font-montserrat)', 'sans-serif'],
                'sans': ['var(--font-inter)', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
export default config;
