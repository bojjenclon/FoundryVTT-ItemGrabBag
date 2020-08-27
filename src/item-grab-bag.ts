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
        grabBagItems.push(data);
        await game.settings.set('item-grab-bag', 'bag-contents', grabBagItems);

        break;
      
      case SocketMessageType.removeItemFromBag:
        const removedItem = grabBagItems[data.index];
        grabBagItems.splice(data.index, 1);

        if (removedItem.remove) {
          if (removedItem.actorId && game.user.character.id === removedItem.actorId) {
            const { character } = game.user;
            character.items.delete(removedItem.itemId);
          } else {
            game.items.delete(removedItem.itemId);
          }
        }

        await game.settings.set('item-grab-bag', 'bag-contents', grabBagItems);

        break;
      
      case SocketMessageType.itemPickedUp:
        const pickedUpItem = grabBagItems[data.index];
        grabBagItems.splice(data.index, 1);

        if (pickedUpItem.remove) {
          // If an item owned by this user is picked up by someone else,
          // remove it from their inventory
          if (pickedUpItem.actorId && game.user.character.id === pickedUpItem.actorId) {
            const { character } = game.user;
            character.items.delete(pickedUpItem.itemId);
          } else {
            game.items.delete(pickedUpItem.itemId);
          }
        }

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
