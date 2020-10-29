import { SocketMessageType } from "./socket-message-type";

export async function addItemToBag(data) {
  const type = data.type || data.Type;
  if (type !== 'Item') {
    return;
  }

  let itemData = {
    actorId: null,
    itemId: null,
  };
  let socketData = {
    actorId: null,
    itemId: null,
    remove: false
  };

  if (data.pack) {
    // Support getting items directly from a compendium
    const item = await game.items.importFromCollection(data.pack, data.id);
    itemData.itemId = item.id;
  } else if (data.actorId) {
    // Item was given up by a player
    const actor = game.actors.get(data.actorId);
    const item = actor.getOwnedItem(data.data._id);

    itemData.itemId = item.id;
    itemData.actorId = actor.id;

    // Remove the item from the player's inventory
    socketData.remove = true;
  } else {
    // Otherwise pull the item from the game's data
    const item = game.items.get(data.id);
    itemData.itemId = item.id;
  }

  socketData.actorId = itemData.actorId;
  socketData.itemId = itemData.itemId;

  const { user } = game;
  if (user.isGM) {
    const grabBagItems = game.settings.get('item-grab-bag', 'bag-contents');
    grabBagItems.push(itemData);
    await game.settings.set('item-grab-bag', 'bag-contents', grabBagItems);

    game.socket.emit('module.item-grab-bag', {
      type: SocketMessageType.pushSync
    });
  } else {
    game.socket.emit('module.item-grab-bag', {
      type: SocketMessageType.addItemToBag,
      data: socketData
    });
  }
}

export async function removeFromBag(itemIdx: number) {
  const grabBagItems = game.settings.get('item-grab-bag', 'bag-contents');
  const removedItem = grabBagItems[itemIdx];

  const { user } = game;

  if (removedItem.remove) {
    const { character } = user;

    if (removedItem.actorId && character.id === removedItem.actorId) {
      character.items.delete(removedItem.itemId);
    } else if (user.isGM) {
      game.items.delete(removedItem.itemId);
    }
  }

  if (user.isGM) {
    grabBagItems.splice(itemIdx, 1);
    await game.settings.set('item-grab-bag', 'bag-contents', grabBagItems);

    game.socket.emit('module.item-grab-bag', {
      type: SocketMessageType.pushSync
    });
  }
}

export async function pickUpItem(itemIdx: number) {
  const grabBagItems = game.settings.get('item-grab-bag', 'bag-contents');
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

  const { user } = game;
  const { character } = user;
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
}
