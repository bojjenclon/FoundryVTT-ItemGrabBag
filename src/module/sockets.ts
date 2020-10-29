import { GrabBag } from "./config";
import { addItemToBag, isFirstGM, pickUpItem, removeFromBag } from "./grab-bag-utils";
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
      addItemToBag(data);

      break;

    case SocketMessageType.removeItemFromBag:
      removeFromBag(itemIdx);

      break;

    case SocketMessageType.itemPickedUp:
      pickUpItem(itemIdx);

      break;

    case SocketMessageType.pushSync:
      // Refresh the window
      setTimeout(() => {
        GrabBagWindow.openDialog();
      }, 0);

      break;
  }
}
