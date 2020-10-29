// Import TypeScript modules
import { registerSettings } from './module/settings.js';
import { preloadTemplates } from './module/preload-templates.js';

import GrabBagWindow from './module/grab-bag-window.js';
import { RegisterSockets } from './module/sockets.js';

/* ------------------------------------ */
/* Initialize module					          */
/* ------------------------------------ */
Hooks.once('init', async function () {
  console.log('item-grab-bag | Initializing');

  game.grabBag = {
    showWindow: false
  };

  // Register custom module settings
  registerSettings();

  // Preload Handlebars templates
  await preloadTemplates();

  // Register custom sheets (if any)
});

/* ------------------------------------ */
/* Setup module					                */
/* ------------------------------------ */
Hooks.once('setup', function () {
});

/* ------------------------------------ */
/* When ready							              */
/* ------------------------------------ */
Hooks.once('ready', function () {
  const { socket } = game;

  socket.on('module.item-grab-bag', RegisterSockets);
});

Hooks.on('renderSidebarTab', (_app, html, _data) => {
  // Only enable the button if a GM is currently connected,
  // since only a GM can set the global config.
  let isGMConnected = false;
  game.users.forEach((user: User, id) => {
    if (user.active && user.isGM) {
      isGMConnected = true;
    }
  });

  if (html.attr('id') === 'items') {
    const directoryList = html.find('ol.directory-list');

    const bagBtn = $('<div>', {
      class: 'grab-bag-directory-container',
      // title: isGMConnected ? game.i18n.localize('GRABBAG.tooltip.gmConnected') : game.i18n.localize('GRABBAG.tooltip.gmNotConnected'),

      html: $('<button>', {
        // disabled: !isGMConnected,

        html: `<i class="fas fa-hands"></i> ${game.i18n.localize('GRABBAG.button.open')}`
      })
    });

    bagBtn.on('click', ev => {
      ev.preventDefault();

      GrabBagWindow.openDialog();
    });

    directoryList.after(bagBtn);
  }
});
