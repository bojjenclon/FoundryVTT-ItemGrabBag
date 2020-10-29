import { SocketMessageType } from "./socket-message-type";

export default class GrabBagWindow extends Application {
  private static dialog: GrabBagWindow;

  static get defaultOptions(): ApplicationOptions {
    return mergeObject(super.defaultOptions, {
      template: 'modules/item-grab-bag/templates/grab-bag-window.html',

      id: 'item-grab-bag-window',
      classes: ['item-grab-bag', 'bag-window'],
      title: 'Item Grab Bag',

      width: 300,
      height: 450,
      minimizable: true,
      resizable: true
    });
  }

  constructor() {
    super();
  }

  static openDialog() {
    if (!this.dialog) {
      this.dialog = new GrabBagWindow();
    }

    this.dialog.render(true);
  }

  static closeDialog(): Promise<any> {
    return this.dialog.close();
  }

  getData() {
    const itemData = game.settings.get('item-grab-bag', 'bag-contents');
    const items = [];

    itemData.forEach(async data => {
      const { actorId, itemId } = data;
      if (actorId) {
        const actor = game.actors.get(actorId);
        const item = actor.items.get(itemId);
        items.push(item);
      } else {
        const item = game.items.get(itemId);
        items.push(item);
      }
    });

    const data = {
      isGM: game.user.isGM,
      items
    };

    return data;
  }

  activateListeners(html: JQuery) {
    super.activateListeners(html);

    // @ts-ignore
    const drag = new DragDrop({
      dropSelector: '.bag-content',

      callbacks: {
        drop: this._onDragDrop.bind(this)
      }
    });
    // @ts-ignore
    drag.bind(html[0]);

    html.find('.item .name').click(async evt => {
      evt.preventDefault();

      const { actorId, itemId } = evt.currentTarget.parentElement.dataset;
      let item: Item;
      if (actorId) {
        const actor = game.actors.get(actorId);
        item = actor.items.get(itemId);
      } else {
        item = game.items.get(itemId);
      }

      if (item) {
        item.sheet.render(true, {
          width: 600,
          height: 700
        });
      } else {
        // The item was likely removed from the game, so
        // remove it from the bag as well

        const itemIdx = evt.currentTarget.parentElement.dataset.bagIdx;
        await this._removeFromBag(parseInt(itemIdx, 10));

        ui.notifications.warn(game.i18n.localize('GRABBAG.warning.invalidItem'));
      }
    });

    if (game.user.isGM) {
      html.find('.btn-remove').on('click', async evt => {
        evt.preventDefault();

        const itemIdx = evt.currentTarget.parentElement.dataset.bagIdx;
        await this._removeFromBag(parseInt(itemIdx, 10));
      });
    } else {
      html.find('.btn-take').on('click', async evt => {
        evt.preventDefault();

        const itemIdx = evt.currentTarget.parentElement.dataset.bagIdx;

        await this._takeFromBag(parseInt(itemIdx, 10));
      });
    }
  }

  async _removeFromBag(itemIdx: number) {
    const grabBagItems = game.settings.get('item-grab-bag', 'bag-contents');

    if (!isNaN(itemIdx)) {
      game.socket.emit('module.item-grab-bag', {
        type: SocketMessageType.removeItemFromBag,
        data: {
          index: itemIdx
        }
      });

      grabBagItems.splice(itemIdx, 1);
      await game.settings.set('item-grab-bag', 'bag-contents', grabBagItems);

      this.render(true);
    }
  }

  async _takeFromBag(itemIdx: number) {
    const grabBagItems = game.settings.get('item-grab-bag', 'bag-contents');

    if (!isNaN(itemIdx)) {
      game.socket.emit('module.item-grab-bag', {
        type: SocketMessageType.itemPickedUp,
        data: {
          index: itemIdx
        }
      });

      const itemData = grabBagItems[itemIdx];
      const { actorId, itemId } = itemData;

      grabBagItems.splice(itemIdx, 1);
      await game.settings.set('item-grab-bag', 'bag-contents', grabBagItems);

      let item: Item;
      if (actorId) {
        const actor = game.actors.get(actorId);
        item = actor.items.get(itemId);
      } else {
        item = game.items.get(itemId);
      }

      const { character } = game.user;

      if (!item || !character) {
        return;
      }

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

      this.render(true);
    }
  }

  _canDragDrop(selector: string): boolean {
    console.log(selector);

    return true;
  }

  async _onDragDrop(evt: DragEvent) {
    const grabBagItems = game.settings.get('item-grab-bag', 'bag-contents');

    const { dataTransfer } = evt;
    const { items } = dataTransfer;

    let generatingItems = true;

    if (items) {
      const numItems = items.length;
      for (let i = 0; i < numItems; i++) {
        const itm = items[i];
        if (itm.kind === 'string' && itm.type.match('^text/plain')) {
          itm.getAsString(async str => {
            const data = JSON.parse(str);

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

            grabBagItems.push(itemData);

            socketData.actorId = itemData.actorId;
            socketData.itemId = itemData.itemId;

            game.socket.emit('module.item-grab-bag', {
              type: SocketMessageType.addItemToBag,
              data: socketData
            });

            if (i === numItems - 1) {
              generatingItems = false;
            }
          });
        }
      }
    }

    // Wait for items to be done processing
    const interval = setInterval(async () => {
      if (generatingItems) {
        return;
      }

      clearInterval(interval);

      await game.settings.set('item-grab-bag', 'bag-contents', grabBagItems);

      this.render(true);
    }, 10);
  }
}
