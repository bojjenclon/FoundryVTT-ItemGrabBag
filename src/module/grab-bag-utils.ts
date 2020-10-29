import { SocketMessageType } from "./socket-message-type";

export async function pickUpItem(itemIdx) {
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
