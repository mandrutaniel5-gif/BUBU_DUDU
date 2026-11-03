// Varianta "un singur fisier": dist-single/index.html se deschide direct cu dublu-click.
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
export default defineConfig({ base: './', plugins: [viteSingleFile()], build: { outDir: 'dist-single' } });
