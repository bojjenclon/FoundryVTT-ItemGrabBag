// Import TypeScript modules
import { registerSettings } from './module/settings.js';
import { preloadTemplates } from './module/preload-templates.js';

import GrabBagWindow from './module/grab-bag-window.js';
import { RegisterSockets } from './module/sockets.js';
import { isFirstGM, isGMConnected } from './module/grab-bag-utils.js';

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
Hooks.once('ready', async function () {
  const { socket } = game;

  const folderId = game.settings.get('item-grab-bag', 'folder-id');
  if (!game.folders.has(folderId) && isFirstGM()) {
    const folder = await Folder.create({
      name: 'Grab Bag Items',
      parent: null,
      type: 'Item',
      permission: CONST.ENTITY_PERMISSIONS.OBSERVER
    });

    await game.settings.set('item-grab-bag', 'folder-id', folder.id);
  }

  socket.on('module.item-grab-bag', RegisterSockets);
});

Hooks.on('renderSidebarTab', (_app, html, _data) => {
  // Only enable the button if a GM is currently connected,
  // since only a GM can set the global config.
  const gmConnected = isGMConnected();

  if (html.attr('id') === 'items') {
    const directoryList = html.find('ol.directory-list');

    const bagBtn = $('<div>', {
      class: 'grab-bag-directory-container',
      title: gmConnected ? game.i18n.localize('GRABBAG.tooltip.gmConnected') : game.i18n.localize('GRABBAG.tooltip.gmNotConnected'),

      html: $('<button>', {
        disabled: !gmConnected,

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
