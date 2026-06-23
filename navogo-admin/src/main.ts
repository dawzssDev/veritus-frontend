import 'zone.js';

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .then(() => {
    if (typeof document === 'undefined') return;
    const el = document.getElementById('app-preload');
    if (!el) return;

    el.classList.add('app-preload--hide');
    window.setTimeout(() => el.remove(), 220);
  })
  .catch((err) => console.error(err));
