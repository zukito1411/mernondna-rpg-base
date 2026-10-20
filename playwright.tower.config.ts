import {defineConfig} from '@playwright/test';
import base from './playwright.config';
export default defineConfig({...base,testMatch:['towerOfMight.spec.ts','towerStartupSmoke.spec.ts'],
 outputDir:'test-results/tower-playwright-artifacts',timeout:180000,
 use:{...base.use,trace:'off',launchOptions:{args:['--use-angle=default']}}});
