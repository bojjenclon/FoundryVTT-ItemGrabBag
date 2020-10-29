import GrabBagWindow from "./grab-bag-window";
import { SocketMessageType } from "./socket-message-type";

export async function RegisterSockets(msg) {
  const { user } = game;

  const { type, data } = msg;
  const grabBagItems: Array<any> = game.settings.get('item-grab-bag', 'bag-contents');

  switch (type) {
    case SocketMessageType.showWindow:
      game.grabbag.showWindow = true;

      break;

    case SocketMessageType.hideWindow:
      game.grabbag.showWindow = false;

      break;

    case SocketMessageType.addItemToBag:
      grabBagItems.push(data);

      if (user.isGM) {
        await game.settings.set('item-grab-bag', 'bag-contents', grabBagItems);

        game.socket.emit('module.item-grab-bag', {
          type: SocketMessageType.pushSync
        });
      }

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

      if (user.isGM) {
        await game.settings.set('item-grab-bag', 'bag-contents', grabBagItems);

        game.socket.emit('module.item-grab-bag', {
          type: SocketMessageType.pushSync
        });
      }

      break;

    case SocketMessageType.itemPickedUp:
      const itemIdx = data.index;
      const pickedUpItem = grabBagItems[itemIdx];

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

      const { actorId, itemId } = pickedUpItem;

      let item: Item;
      if (actorId) {
        const actor = game.actors.get(actorId);
        item = actor.items.get(itemId);
      } else {
        item = game.items.get(itemId);
      }

      const { character } = game.user;
      const isValidPickup = item && character;

      if (isValidPickup) {
        // User is picking up their own item, not much to do
        if (actorId === character.id) {
          await ChatMessage.create({
            content: game.i18n.localize('GRABBAG.chat.itemTakenBack')
              .replace('##ACTOR##', character.name)
              .replace('##ITEM##', item.name)
          });
        } else {
          await character.createEmbeddedEntity('OwnedItem', item.data);
          await ChatMessage.create({
            content: game.i18n.localize('GRABBAG.chat.itemTaken')
              .replace('##ACTOR##', character.name)
              .replace('##ITEM##', item.name)
          });
        }
      }

      if (user.isGM) {
        grabBagItems.splice(itemIdx, 1);
        await game.settings.set('item-grab-bag', 'bag-contents', grabBagItems);

        game.socket.emit('module.item-grab-bag', {
          type: SocketMessageType.pushSync
        });
      }

      break;

    case SocketMessageType.pushSync:
      // Refresh the window
      GrabBagWindow.openDialog();

      break;
  }
}
