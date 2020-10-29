import { pickUpItem, removeFromBag } from "./grab-bag-utils";
import GrabBagWindow from "./grab-bag-window";
import { SocketMessageType } from "./socket-message-type";

export async function RegisterSockets(msg) {
  const { user } = game;

  const { type, data } = msg;
  const grabBagItems: Array<any> = game.settings.get('item-grab-bag', 'bag-contents');

  const itemIdx = (data || {}).index;

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
      removeFromBag(itemIdx);

      break;

    case SocketMessageType.itemPickedUp:
      pickUpItem(itemIdx);

      break;

    case SocketMessageType.pushSync:
      // Refresh the window
      GrabBagWindow.openDialog();

      break;
  }
}
