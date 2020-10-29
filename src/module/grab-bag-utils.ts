import { GrabBag } from "./config";
import GrabBagWindow from "./grab-bag-window";
import { SocketMessageType } from "./socket-message-type";

export function isFirstGM(): boolean {
  const { user } = game;
  if (!user.isGM) {
    return false;
  }

  const gmList = game.users.filter((usr: User) => user.active && usr.isGM);
  const isFirstGM = gmList && gmList[0].id === user.id;

  return isFirstGM;
}

export async function addItemToBag(data) {
  if (isFirstGM()) {
    const grabBagItems = game.settings.get('item-grab-bag', 'bag-contents');

    let origItem;
    if (data.packId) {
      origItem = await game.items.importFromCollection(data.pack, data.id);
    } else if (data.actorId) {
      const actor = game.actors.get(data.actorId);
      origItem = actor.getOwnedItem(data.data._id);
    } else {
      origItem = game.items.get(data.id);
    }

    if (origItem) {
      const folderId = game.settings.get('item-grab-bag', 'folder-id');
      const item = await Item.create(mergeObject(duplicate(origItem.data), { permission: CONST.ENTITY_PERMISSIONS.OBSERVER, folder: folderId }));
      grabBagItems.push(item.id);

      await game.settings.set('item-grab-bag', 'bag-contents', grabBagItems);

      game.socket.emit('module.item-grab-bag', {
        type: SocketMessageType.pushSync
      });
    }

    GrabBagWindow.openDialog();

    return;
  }

  const type = data.type || data.Type;
  if (type !== 'Item') {
    return;
  }

  let socketData = {
    packId: null,
    actorId: null,
    itemId: null
  };

  if (data.pack) {
    // Support getting items directly from a compendium
    const item = await game.items.importFromCollection(data.pack, data.id);
    socketData.packId = data.pack;
    socketData.itemId = item.id;
  } else if (data.actorId) {
    // Item was given up by a player
    const actor = game.actors.get(data.actorId);
    const item = actor.getOwnedItem(data.data._id);

    socketData.itemId = item.id;
    socketData.actorId = actor.id;
  } else {
    // Otherwise pull the item from the game's data
    const item = game.items.get(data.id);
    socketData.itemId = item.id;
  }

  game.socket.emit('module.item-grab-bag', {
    type: SocketMessageType.addItemToBag,
    data: socketData
  });
}

export async function removeFromBag(itemIdx: number) {
  const grabBagItems = game.settings.get('item-grab-bag', 'bag-contents');
  const removedItem = grabBagItems[itemIdx];

  if (isFirstGM()) {
    const item = game.items.get(removedItem);
    if (item) {
      await item.delete();

      grabBagItems.splice(itemIdx, 1);
      await game.settings.set('item-grab-bag', 'bag-contents', grabBagItems);

      game.socket.emit('module.item-grab-bag', {
        type: SocketMessageType.pushSync
      });
    }

    GrabBagWindow.openDialog();

    return;
  }

  game.socket.emit('module.item-grab-bag', {
    type: SocketMessageType.addItemToBag,
    data: {
      itemId: removedItem
    }
  });
}

export async function pickUpItem(itemIdx: number) {
  const grabBagItems = game.settings.get('item-grab-bag', 'bag-contents');
  const pickedUpItem = grabBagItems[itemIdx];

  const item = game.items.get(pickedUpItem);

  if (isFirstGM()) {
    if (item) {
      await item.delete();

      grabBagItems.splice(itemIdx, 1);
      await game.settings.set('item-grab-bag', 'bag-contents', grabBagItems);

      game.socket.emit('module.item-grab-bag', {
        type: SocketMessageType.pushSync
      });
    }

    GrabBagWindow.openDialog();

    return;
  }

  const { user } = game;
  const { character } = user;
  const isValidPickup = item && character;

  if (isValidPickup) {
    await character.createEmbeddedEntity('OwnedItem', item.data);
    await ChatMessage.create({
      content: game.i18n.localize('GRABBAG.chat.itemTaken')
        .replace('##ACTOR##', character.name)
        .replace('##ITEM##', item.name)
    });
  }

  game.socket.emit('module.item-grab-bag', {
    type: SocketMessageType.itemPickedUp,
    data: {
      itemId: pickedUpItem
    }
  });
}
