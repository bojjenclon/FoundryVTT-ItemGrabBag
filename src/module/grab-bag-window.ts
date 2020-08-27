import { SocketMessageType } from "./socket-message-type";

export default class GrabBagWindow extends Application {
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
  
  getData() {
    const data = {
      isGM: game.user.isGM,
      items: game.settings.get('item-grab-bag', 'bag-contents')
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

    html.find('.item .name').click(evt => {
      evt.preventDefault();

      const itemId = evt.currentTarget.parentElement.dataset.itemId;
      const item = game.items.get(itemId);
      item.sheet.render(true, {
        width: 600,
        height: 700
      });
    });

    if (game.user.isGM) {
      html.find('.btn-remove').click(async evt => {
        evt.preventDefault();

        const grabBagItems = game.settings.get('item-grab-bag', 'bag-contents');
        const itemIdx = evt.currentTarget.parentElement.dataset.bagIdx;

        if (itemIdx) {
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
      });
    } else {
      html.find('.btn-take').click(async evt => {
        evt.preventDefault();

        const grabBagItems = game.settings.get('item-grab-bag', 'bag-contents');
        const itemId = evt.currentTarget.parentElement.dataset.itemId;
        const itemIdx = evt.currentTarget.parentElement.dataset.bagIdx;

        if (itemIdx) {
          game.socket.emit('module.item-grab-bag', {
            type: SocketMessageType.removeItemFromBag,
            data: {
              index: itemIdx
            }
          });

          grabBagItems.splice(itemIdx, 1);
          await game.settings.set('item-grab-bag', 'bag-contents', grabBagItems);

          const item = game.items.get(itemId);
          await game.user.character.createEmbeddedEntity('OwnedItem', item.data);

          this.render(true);
        }
      });
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

    if (items) {
      for (let i = 0; i < items.length; i++) {
        const itm = items[i];
        if (itm.kind === 'string' && itm.type.match('^text/plain')) {
          itm.getAsString(str => {
            const data = JSON.parse(str);

            const type = data.type || data.Type;
            if (type !== 'Item') {
              return;
            }

            const item = game.items.get(data.id);
            grabBagItems.push(item.data);

            game.socket.emit('module.item-grab-bag', {
              type: SocketMessageType.addItemToBag,
              data: {
                itemId: data.id
              }
            });
            
          });
        }
      }
    }
    
    setTimeout(async () => {
      await game.settings.set('item-grab-bag', 'bag-contents', grabBagItems);

      this.render(true);
    }, 0);
  }
}
