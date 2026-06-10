import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    watch: {
      ignored: [
        '**/dotnet-server/bin/**',
        '**/dotnet-server/obj/**',
        '**/dotnet-server/Properties/**'
      ]
    }
  }
});
