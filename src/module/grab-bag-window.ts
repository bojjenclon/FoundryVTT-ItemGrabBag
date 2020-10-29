import { addItemToBag, pickUpItem, removeFromBag } from "./grab-bag-utils";
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

    html.find('.item .name').on('click', async (evt) => {
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
    const { user } = game;

    if (!isNaN(itemIdx)) {
      // if (user.isGM) {
      //   const grabBagItems = game.settings.get('item-grab-bag', 'bag-contents');
      //   grabBagItems.splice(itemIdx, 1);
      //   await game.settings.set('item-grab-bag', 'bag-contents', grabBagItems);

      //   game.socket.emit('module.item-grab-bag', {
      //     type: SocketMessageType.pushSync
      //   });

      //   GrabBagWindow.openDialog();
      // } else {
      //   game.socket.emit('module.item-grab-bag', {
      //     type: SocketMessageType.removeItemFromBag,
      //     data: {
      //       index: itemIdx
      //     }
      //   });
      // }

      await removeFromBag(itemIdx);

      GrabBagWindow.openDialog();

      game.socket.emit('module.item-grab-bag', {
        type: SocketMessageType.itemPickedUp,
        data: {
          index: itemIdx
        }
      });
    }
  }

  async _takeFromBag(itemIdx: number) {
    if (!isNaN(itemIdx)) {
      await pickUpItem(itemIdx);

      GrabBagWindow.openDialog();

      game.socket.emit('module.item-grab-bag', {
        type: SocketMessageType.itemPickedUp,
        data: {
          index: itemIdx
        }
      });
    }
  }

  _canDragDrop(selector: string): boolean {
    console.log(selector);

    return true;
  }

  async _onDragDrop(evt: DragEvent) {
    const { dataTransfer } = evt;
    const { items } = dataTransfer;

    if (items) {
      const numItems = items.length;
      for (let i = 0; i < numItems; i++) {
        const itm = items[i];
        if (itm.kind === 'string' && itm.type.match('^text/plain')) {
          itm.getAsString(async (str) => {
            const data = JSON.parse(str);

            await addItemToBag(data);
          });
        }
      }
    }
  }
}
