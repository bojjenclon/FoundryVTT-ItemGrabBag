// Import TypeScript modules
import { registerSettings } from './module/settings.js';
import { preloadTemplates } from './module/preload-templates.js';

import GrabBagWindow from './module/grab-bag-window.js';
import { SocketMessageType } from './module/socket-message-type.js';

/* ------------------------------------ */
/* Initialize module					          */
/* ------------------------------------ */
Hooks.once('init', async function() {
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
Hooks.once('setup', function() {
});

/* ------------------------------------ */
/* When ready							              */
/* ------------------------------------ */
Hooks.once('ready', function() {
	const { socket } = game;
  socket.on('module.item-grab-bag', async msg => {
		const { type, data } = msg;
		const grabBagItems = game.settings.get('item-grab-bag', 'bag-contents');

    switch (type) {
      case SocketMessageType.showWindow:
        game.grabbag.showWindow = true;

        break;
      
      case SocketMessageType.hideWindow:
        game.grabbag.showWindow = false;

        break;

      case SocketMessageType.addItemToBag:
        const item = game.items.get(data.itemId);

        grabBagItems.push(item);
        await game.settings.set('item-grab-bag', 'bag-contents', grabBagItems);

        break;
      
      case SocketMessageType.removeItemFromBag:
        grabBagItems.splice(data.index, 1);
        await game.settings.set('item-grab-bag', 'bag-contents', grabBagItems);

        break;
      
      case SocketMessageType.itemPickedUp:
        grabBagItems.splice(data.index, 1);
        await game.settings.set('item-grab-bag', 'bag-contents', grabBagItems);

        break;
    }
  });
});

Hooks.on('renderSidebarTab', (app, html, data) => {
  if (html.attr('id') === 'items') {
    const directoryList = html.find('ol.directory-list');
    
    const bagBtn = $('<div>', {
      class: 'grab-bag-directory-container',

      html: $('<button>', {
        html: `<i class="fas fa-hands"></i> ${game.i18n.localize('GRABBAG.button.open')}`
      })
    });

    bagBtn.click(ev => {
      ev.preventDefault();

      const dialog = new GrabBagWindow();
			dialog.render(true);
    });

    directoryList.after(bagBtn);
  }
});
