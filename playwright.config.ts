import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  timeout: 60000,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:5174',
    channel: 'chrome',
    headless: true,
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5174 --strictPort',
    url: 'http://127.0.0.1:5174',
    reuseExistingServer: false,
  },
});
