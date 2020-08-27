/**
 * This is your TypeScript entry file for Foundry VTT.
 * Register custom settings, sheets, and constants using the Foundry API.
 * Change this heading to be more descriptive to your module, or remove it.
 * Author: [your name]
 * Content License: [copyright and-or license] If using an existing system
 * 					you may want to put a (link to a) license or copyright
 * 					notice here (e.g. the OGL).
 * Software License: [your license] Put your desired license here, which
 * 					 determines how others may use and modify your module
 */

// Import TypeScript modules
import { registerSettings } from './module/settings.js';
import { preloadTemplates } from './module/preload-templates.js';

import GrabBagWindow from './module/grab-bag-window.js';

const SocketMessageType = {
  showWindow: 'showWindow',
  hideWindow: 'hideWindow',

  addItemToBag: 'addItemToBag',
  removeItemFromBag: 'removeItemFromBag',
  itemPickedUp: 'itemPickedUp'
};

/* ------------------------------------ */
/* Initialize module					*/
/* ------------------------------------ */
Hooks.once('init', async function() {
	console.log('item-grab-bag | Initializing');

	game.grabbag = {
    showWindow: false,
    items: []
  };
	
	// Register custom module settings
	registerSettings();
	
	// Preload Handlebars templates
	await preloadTemplates();

	// Register custom sheets (if any)
});

/* ------------------------------------ */
/* Setup module							*/
/* ------------------------------------ */
Hooks.once('setup', function() {
});

/* ------------------------------------ */
/* When ready							*/
/* ------------------------------------ */
Hooks.once('ready', function() {
	const { socket } = game;
	// @ts-ignore
  socket.on('module.item-grab-bag', async msg => {
		const { data } = msg;
		const { items } = game.grabbag;

    switch (msg) {
      case SocketMessageType.showWindow:
        game.grabbag.showWindow = true;

        break;
      
      case SocketMessageType.hideWindow:
        game.grabbag.showWindow = false;

        break;

      case SocketMessageType.addItemToBag:
        items.push(data.item);

        break;
      
      case SocketMessageType.removeItemFromBag:

        break;
      
      case SocketMessageType.itemPickedUp:

        break;
    }
  });
});

Hooks.on('renderSidebarTab', (app, html, data) => {
  if (html.attr('id') === 'items') {
    const footer = html.find('footer.directory-footer');
    
    const bagBtn = $('<div>', {
      class: 'grab-bag-directory-container',

      html: $('<button>', {
        text: 'Open Grab Bag'
      })
    });
    bagBtn.click(ev => {
      ev.preventDefault();

      const dialog = new GrabBagWindow();
      dialog.render(true);
    });

    footer.before(bagBtn);
  }
});
