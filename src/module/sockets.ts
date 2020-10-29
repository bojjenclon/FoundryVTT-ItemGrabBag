import { pickUpItem } from "./grab-bag-utils";
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

      pickUpItem(itemIdx);

      break;

    case SocketMessageType.pushSync:
      // Refresh the window
      GrabBagWindow.openDialog();

      break;
  }
}
